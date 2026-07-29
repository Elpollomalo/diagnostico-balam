/**
 * Verificación de cuota antes de ejecutar cualquier trabajo.
 *
 * La regla que evita el fracaso más caro de un SaaS de este tipo: **la cuota
 * se verifica ANTES de encolar, nunca después**. Si se revisa al terminar, el
 * trabajo ya se pagó (tokens, búsquedas) cuando se descubre que no había
 * cupo — el cliente no recibe nada y tú ya gastaste.
 *
 * El consumo se cuenta por FILAS en `consumo`, no con un contador que se
 * incrementa. Un contador se desincroniza en cuanto algo falla a la mitad, y
 * además no deja auditar por qué un cliente llegó a su tope. Contar filas es
 * más lento y es la decisión correcta: aquí la exactitud vale más que los
 * milisegundos.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getPlan, cuotaMensual, periodoActual, type PlanId, type TipoConsumo } from './planes';
import { getPlantilla, plantillaDisponibleEnPlan } from './plantillas';

export interface ResultadoCuota {
  permitido: boolean;
  /** Por qué se rechazó, para poder decírselo al cliente con precisión. */
  motivo?: 'SIN_CUPO' | 'PLANTILLA_NO_DISPONIBLE' | 'CAMPO_ABIERTO_NO_DISPONIBLE' | 'PERFIL_INCOMPLETO';
  usado: number;
  limite: number;
  plan: PlanId;
}

/** Completitud mínima del perfil para que una plantilla que lo requiere dé algo útil. */
const COMPLETITUD_MINIMA = 40;

/**
 * ¿Puede este usuario lanzar este trabajo ahora?
 *
 * Devuelve siempre el uso y el límite, aunque esté permitido: el panel los
 * muestra para que el cliente vea cuánto le queda. Un límite invisible se
 * siente como una falla del producto, no como un plan.
 */
export async function verificarCuota(
  supabase: SupabaseClient,
  userId: string,
  opciones: {
    tipo: TipoConsumo;
    /** Slug de plantilla, o null si es campo abierto. */
    plantilla?: string | null;
  }
): Promise<ResultadoCuota> {
  const { data: suscripcion } = await supabase
    .from('suscripciones')
    .select('plan, estado')
    .eq('user_id', userId)
    .maybeSingle();

  // Sin fila de suscripción es un usuario nuevo: free. Y si su suscripción
  // está vencida o cancelada también cae a free en vez de quedarse sin
  // servicio -- perder el acceso completo por un pago fallido es la forma
  // más rápida de que alguien no vuelva.
  const planId: PlanId =
    suscripcion?.estado === 'activo' ? getPlan(suscripcion.plan).id : 'free';
  const plan = getPlan(planId);

  // ── Acceso a la plantilla ───────────────────────────────────────────────
  if (opciones.plantilla) {
    if (!plantillaDisponibleEnPlan(opciones.plantilla, plan.maxPlantillas)) {
      return { permitido: false, motivo: 'PLANTILLA_NO_DISPONIBLE', usado: 0, limite: 0, plan: planId };
    }
  } else if (!plan.campoAbierto) {
    return { permitido: false, motivo: 'CAMPO_ABIERTO_NO_DISPONIBLE', usado: 0, limite: 0, plan: planId };
  }

  // ── Perfil suficiente ───────────────────────────────────────────────────
  // Se comprueba antes de gastar: una investigación sin contexto del negocio
  // entrega algo genérico, y el cliente igual habría consumido su cuota.
  const plantilla = opciones.plantilla ? getPlantilla(opciones.plantilla) : null;
  if (plantilla?.requierePerfil) {
    const { data: perfil } = await supabase
      .from('perfiles_negocio')
      .select('completitud')
      .eq('user_id', userId)
      .maybeSingle();

    if ((perfil?.completitud ?? 0) < COMPLETITUD_MINIMA) {
      return { permitido: false, motivo: 'PERFIL_INCOMPLETO', usado: 0, limite: 0, plan: planId };
    }
  }

  // ── Cupo del mes ────────────────────────────────────────────────────────
  const limite = cuotaMensual(planId, opciones.tipo);
  const { count } = await supabase
    .from('consumo')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tipo', opciones.tipo)
    .eq('periodo', periodoActual());

  const usado = count ?? 0;

  return {
    permitido: usado < limite,
    motivo: usado < limite ? undefined : 'SIN_CUPO',
    usado,
    limite,
    plan: planId,
  };
}

/**
 * Registra consumo. Se llama al ENCOLAR, no al terminar.
 *
 * Deliberado: si se registrara al terminar, alguien podría lanzar veinte
 * trabajos en paralelo antes de que el primero acabe y saltarse la cuota por
 * completo. Se cobra el cupo al pedir; si el trabajo falla por culpa nuestra,
 * se devuelve con `devolverConsumo`.
 */
export async function registrarConsumo(
  supabase: SupabaseClient,
  userId: string,
  datos: {
    tipo: TipoConsumo;
    ejecucionId?: string | null;
    costoBusquedas?: number;
    costoLlamadas?: number;
    tokensEntrada?: number;
    tokensSalida?: number;
  }
): Promise<void> {
  await supabase.from('consumo').insert({
    user_id: userId,
    tipo: datos.tipo,
    ejecucion_id: datos.ejecucionId ?? null,
    costo_busquedas: datos.costoBusquedas ?? 0,
    costo_llamadas_modelo: datos.costoLlamadas ?? 0,
    costo_tokens_entrada: datos.tokensEntrada ?? 0,
    costo_tokens_salida: datos.tokensSalida ?? 0,
    periodo: periodoActual(),
  });
}

/**
 * Devuelve el cupo de una ejecución que falló por causa nuestra.
 *
 * Importante: NO se devuelve cuando la ejecución agotó su presupuesto y
 * entregó resultados parciales. Ahí sí hubo trabajo y sí hubo costo — el
 * cliente recibió algo. Solo se devuelve cuando no recibió nada.
 */
export async function devolverConsumo(
  supabase: SupabaseClient,
  ejecucionId: string
): Promise<void> {
  await supabase.from('consumo').delete().eq('ejecucion_id', ejecucionId);
}

/** Resumen de consumo del mes, para mostrarlo en el panel. */
export async function consumoDelMes(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<TipoConsumo, { usado: number; limite: number }>> {
  const { data: suscripcion } = await supabase
    .from('suscripciones')
    .select('plan, estado')
    .eq('user_id', userId)
    .maybeSingle();

  const planId: PlanId =
    suscripcion?.estado === 'activo' ? getPlan(suscripcion.plan).id : 'free';

  const { data: filas } = await supabase
    .from('consumo')
    .select('tipo')
    .eq('user_id', userId)
    .eq('periodo', periodoActual());

  const tipos: TipoConsumo[] = [
    'investigacion',
    'plan_marketing',
    'contenido',
    'campana',
    'correo_enviado',
    'campo_abierto',
  ];

  const resumen = {} as Record<TipoConsumo, { usado: number; limite: number }>;
  for (const tipo of tipos) {
    resumen[tipo] = {
      usado: (filas ?? []).filter((f: { tipo: string }) => f.tipo === tipo).length,
      limite: cuotaMensual(planId, tipo),
    };
  }
  return resumen;
}
