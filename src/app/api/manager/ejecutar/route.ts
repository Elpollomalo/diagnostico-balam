/**
 * API Route: POST /api/manager/ejecutar
 *
 * Lanza un trabajo (investigación, plan de marketing, contenido, campaña).
 * Es el único camino por el que se encola trabajo, y por eso concentra todas
 * las verificaciones.
 *
 * El orden de los pasos NO es casual:
 *
 *   1. Autenticación
 *   2. Cuota  ← ANTES de gastar nada
 *   3. Crear la fila de ejecución
 *   4. Registrar el consumo  ← al encolar, no al terminar
 *   5. Encolar en el motor
 *   6. Si el motor falla → devolver el cupo y marcar la ejecución fallida
 *
 * El paso 6 es el que evita el peor escenario: que el cliente pierda una
 * investigación de su cuota mensual por una caída de infraestructura que no
 * fue culpa suya.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verificarCuota, registrarConsumo, devolverConsumo } from '@/lib/cuotas';
import { getPlantilla } from '@/lib/plantillas';
import { getPlan } from '@/lib/planes';
import { encolarTrabajo } from '@/lib/motor';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'NO_AUTORIZADO' }, { status: 401 });
    }

    const body = await request.json();
    const slugPlantilla: string | null = body.plantilla ?? null;
    const peticionTexto: string | null = body.peticion?.trim() || null;

    // Campo abierto (solo plus) exige que diga qué quiere: sin instrucciones
    // el agente no tiene de dónde partir y gastaría la cuota en nada.
    if (!slugPlantilla && !peticionTexto) {
      return NextResponse.json({ error: 'FALTA_PETICION' }, { status: 400 });
    }

    const plantilla = slugPlantilla ? getPlantilla(slugPlantilla) : null;
    if (slugPlantilla && !plantilla) {
      return NextResponse.json({ error: 'PLANTILLA_DESCONOCIDA' }, { status: 400 });
    }

    const tipoConsumo = plantilla?.tipoConsumo ?? 'campo_abierto';

    // ── 2. Cuota, antes de gastar ──────────────────────────────────────────
    const cuota = await verificarCuota(supabase, user.id, {
      tipo: tipoConsumo,
      plantilla: slugPlantilla,
    });

    if (!cuota.permitido) {
      // Se devuelve el detalle para que el panel pueda decir exactamente qué
      // pasó: no es lo mismo "se te acabaron las investigaciones del mes" que
      // "esta plantilla no está en tu plan" o "completa tu perfil primero".
      return NextResponse.json(
        { error: cuota.motivo, usado: cuota.usado, limite: cuota.limite, plan: cuota.plan },
        { status: 403 }
      );
    }

    const plan = getPlan(cuota.plan);

    // El presupuesto real es el MENOR entre el del plan y el de la plantilla:
    // una plantilla barata no debe gastar como una cara solo porque el
    // cliente tiene plan alto.
    const presupuestoBusquedas = Math.min(
      plan.presupuestoBusquedas,
      plantilla?.presupuestoBusquedas ?? plan.presupuestoBusquedas
    );

    const { data: perfil } = await supabase
      .from('perfiles_negocio')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const titulo = plantilla?.nombre.es ?? (peticionTexto ?? '').slice(0, 80);

    // ── 3. Fila de ejecución ───────────────────────────────────────────────
    const { data: ejecucion, error: errorEjecucion } = await supabase
      .from('ejecuciones')
      .insert({
        user_id: user.id,
        plantilla: slugPlantilla,
        titulo,
        peticion: peticionTexto,
        agente: plantilla?.agente ?? 'investigadores',
        estado: 'encolada',
        presupuesto_busquedas: presupuestoBusquedas,
        presupuesto_llamadas: plan.presupuestoLlamadas,
      })
      .select('id')
      .single();

    if (errorEjecucion || !ejecucion) {
      console.error('[EJECUTAR] No se pudo crear la ejecución:', errorEjecucion?.message);
      return NextResponse.json({ error: 'ERROR_INTERNO' }, { status: 500 });
    }

    // ── 4. Consumo, al encolar ─────────────────────────────────────────────
    // Deliberado: si se registrara al terminar, alguien podría lanzar veinte
    // trabajos en paralelo antes de que el primero acabe y saltarse la cuota.
    await registrarConsumo(supabase, user.id, {
      tipo: tipoConsumo,
      ejecucionId: ejecucion.id,
    });

    // ── 5. Encolar ─────────────────────────────────────────────────────────
    const encolado = await encolarTrabajo({
      ejecucionId: ejecucion.id,
      userId: user.id,
      agente: plantilla?.agente ?? 'investigadores',
      plantilla: slugPlantilla,
      titulo,
      peticion: peticionTexto,
      perfil: perfil ?? {},
      presupuesto: { busquedas: presupuestoBusquedas, llamadas: plan.presupuestoLlamadas },
      idioma: perfil?.idioma ?? 'es',
    });

    // ── 6. Si el motor falló, devolver el cupo ─────────────────────────────
    // El cliente no puede perder una investigación de su mes por una caída de
    // infraestructura ajena a él.
    if (!encolado.ok) {
      await devolverConsumo(supabase, ejecucion.id);
      await supabase
        .from('ejecuciones')
        .update({
          estado: 'fallida',
          error: encolado.error,
          terminada_at: new Date().toISOString(),
        })
        .eq('id', ejecucion.id);

      return NextResponse.json({ error: encolado.error }, { status: 503 });
    }

    await supabase
      .from('ejecuciones')
      .update({ job_id: encolado.jobId ?? null })
      .eq('id', ejecucion.id);

    return NextResponse.json({
      ok: true,
      ejecucionId: ejecucion.id,
      // El panel lo usa para actualizar el contador sin volver a preguntar.
      usado: cuota.usado + 1,
      limite: cuota.limite,
    });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('[EJECUTAR] Error inesperado:', mensaje);
    return NextResponse.json({ error: 'ERROR_INTERNO' }, { status: 500 });
  }
}
