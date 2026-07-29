/**
 * API Route: POST /api/manager/resultado
 *
 * Por aquí el MOTOR devuelve el trabajo terminado. No la llama un navegador:
 * la llama el worker con el secreto compartido.
 *
 * Por eso usa `service_role` y no la sesión del usuario — el worker no tiene
 * sesión de nadie. La contrapartida es que `service_role` se salta RLS, así
 * que cada escritura verifica explícitamente que la ejecución pertenece al
 * usuario que dice: sin esa comprobación, un secreto filtrado permitiría
 * escribir resultados en la cuenta de cualquiera.
 *
 * Recibe tres cosas:
 *  - los resultados (reporte crudo, resumen, oportunidades, contenido, plan)
 *  - lo que REALMENTE gastó, para poder saber si el plan deja margen
 *  - los átomos de conocimiento que aprendió, que abaratan las próximas
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface ResultadoEntrante {
  tipo: 'reporte_crudo' | 'resumen' | 'oportunidades' | 'contenido' | 'plan';
  titulo?: string;
  contenido: string;
  fuentes?: { url: string; titulo?: string; consultada_at?: string }[];
}

interface AtomoEntrante {
  dato: string;
  tema?: string;
  industria?: string;
  zona?: string;
  etiquetas?: string[];
  fuente_url?: string;
  fuente_titulo?: string;
  /** Días de vigencia. Un precio envejece rápido; una descripción no tanto. */
  vigencia_dias?: number;
  /** 'publico' se comparte entre clientes; 'cliente' es privado de quien lo pidió. */
  origen?: 'publico' | 'cliente';
}

export async function POST(request: Request) {
  try {
    const secreto = process.env.MOTOR_SECRETO;
    const autorizacion = request.headers.get('authorization');
    if (!secreto || autorizacion !== `Bearer ${secreto}`) {
      return NextResponse.json({ error: 'NO_AUTORIZADO' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'SUPABASE_NO_CONFIGURADO' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await request.json();
    const ejecucionId: string = body.ejecucionId;
    if (!ejecucionId) {
      return NextResponse.json({ error: 'FALTA_EJECUCION' }, { status: 400 });
    }

    // El dueño se lee de la BASE, nunca del cuerpo de la petición. Si viniera
    // en el body, quien tuviera el secreto podría escribir en la cuenta de
    // cualquiera.
    const { data: ejecucion } = await supabase
      .from('ejecuciones')
      .select('id, user_id, estado')
      .eq('id', ejecucionId)
      .maybeSingle();

    if (!ejecucion) {
      return NextResponse.json({ error: 'EJECUCION_NO_ENCONTRADA' }, { status: 404 });
    }

    const userId = ejecucion.user_id;
    const fallo: string | null = body.error ?? null;

    // ── Trabajo fallido ────────────────────────────────────────────────────
    if (fallo) {
      await supabase
        .from('ejecuciones')
        .update({ estado: 'fallida', error: fallo, terminada_at: new Date().toISOString() })
        .eq('id', ejecucionId);

      // El cliente no paga por un trabajo que no recibió.
      await supabase.from('consumo').delete().eq('ejecucion_id', ejecucionId);
      return NextResponse.json({ ok: true, devuelto: true });
    }

    // ── Resultados ─────────────────────────────────────────────────────────
    const resultados: ResultadoEntrante[] = Array.isArray(body.resultados) ? body.resultados : [];
    if (resultados.length > 0) {
      await supabase.from('resultados').insert(
        resultados.map((r) => ({
          ejecucion_id: ejecucionId,
          user_id: userId,
          tipo: r.tipo,
          titulo: r.titulo ?? null,
          contenido: r.contenido,
          fuentes: r.fuentes ?? [],
        }))
      );
    }

    // ── Átomos de conocimiento ─────────────────────────────────────────────
    // Es lo que hace que la segunda investigación sobre un giro sea más
    // barata que la primera.
    const atomos: AtomoEntrante[] = Array.isArray(body.atomos) ? body.atomos : [];
    if (atomos.length > 0) {
      const ahora = Date.now();
      await supabase.from('atomos').insert(
        atomos.map((a) => {
          // Sin fuente no puede ser conocimiento compartido: un dato sin
          // origen verificable contamina la base para TODOS los clientes.
          // Se degrada a privado en vez de rechazarse, para no perder el
          // trabajo ya hecho.
          const origen = a.origen === 'cliente' || !a.fuente_url ? 'cliente' : 'publico';
          return {
            origen,
            // La restricción de la base exige dueño si es de cliente.
            user_id: origen === 'cliente' ? userId : null,
            dato: a.dato,
            tema: a.tema ?? null,
            industria: a.industria ?? null,
            zona: a.zona ?? null,
            etiquetas: a.etiquetas ?? [],
            fuente_url: a.fuente_url ?? null,
            fuente_titulo: a.fuente_titulo ?? null,
            vence_at: a.vigencia_dias
              ? new Date(ahora + a.vigencia_dias * 86_400_000).toISOString()
              : null,
            ejecucion_id: ejecucionId,
          };
        })
      );
    }

    // ── Costo real y cierre ────────────────────────────────────────────────
    const gasto = body.gasto ?? {};
    await supabase
      .from('ejecuciones')
      .update({
        estado: 'lista',
        usado_busquedas: gasto.busquedas ?? 0,
        usado_llamadas: gasto.llamadas ?? 0,
        presupuesto_agotado: !!body.presupuestoAgotado,
        terminada_at: new Date().toISOString(),
      })
      .eq('id', ejecucionId);

    // Lo REALMENTE gastado, no lo estimado. Sin este dato no hay forma de
    // saber si un plan deja margen o se pierde dinero en cada cliente.
    await supabase
      .from('consumo')
      .update({
        costo_busquedas: gasto.busquedas ?? 0,
        costo_llamadas_modelo: gasto.llamadas ?? 0,
        costo_tokens_entrada: gasto.tokensEntrada ?? 0,
        costo_tokens_salida: gasto.tokensSalida ?? 0,
      })
      .eq('ejecucion_id', ejecucionId);

    return NextResponse.json({ ok: true, resultados: resultados.length, atomos: atomos.length });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('[RESULTADO] Error inesperado:', mensaje);
    return NextResponse.json({ error: 'ERROR_INTERNO' }, { status: 500 });
  }
}
