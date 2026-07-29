/**
 * Puente con el motor de agentes.
 *
 * El motor corre aparte (VPS, con su propia cola BullMQ/Redis) y Ponexo corre
 * en Vercel. El puente es HTTP y no una conexión directa a Redis a propósito:
 * las funciones serverless nacen y mueren en cada petición, y mantener
 * conexiones persistentes desde ahí produce agotamiento de conexiones y
 * timeouts difíciles de diagnosticar. Una llamada HTTP con secreto compartido
 * es más simple y desacopla los despliegues: se puede actualizar el motor sin
 * tocar la app y al revés.
 *
 * Por qué instalación aparte y no el mismo worker que ya corre los agentes
 * internos: esos tienen herramientas que un cliente jamás debe tocar —
 * escribir código, hacer push a repos, mandar correo a nombre de Carlos. Dos
 * instalaciones del mismo código es más seguro que una sola llena de
 * condicionales de permisos.
 *
 * Si el motor no está configurado, `encolarTrabajo` lo dice claramente en vez
 * de fallar en silencio: una ejecución que se queda "encolada" para siempre
 * sin que nadie sepa por qué es peor que un error visible.
 */

export interface TrabajoEncolado {
  ok: boolean;
  jobId?: string;
  error?: 'MOTOR_NO_CONFIGURADO' | 'MOTOR_NO_RESPONDE' | 'MOTOR_RECHAZO';
  detalle?: string;
}

export interface PeticionTrabajo {
  ejecucionId: string;
  userId: string;
  agente: string;
  /** Slug de la plantilla, o null si es campo abierto. */
  plantilla: string | null;
  titulo: string;
  /** Lo que pidió el cliente, tal cual lo escribió. */
  peticion: string | null;
  /** Perfil del negocio, para que el agente no trabaje a ciegas. */
  perfil: Record<string, unknown>;
  /** Presupuesto duro de esta ejecución. Al agotarse entrega lo que alcanzó. */
  presupuesto: { busquedas: number; llamadas: number };
  idioma: string;
}

export async function encolarTrabajo(peticion: PeticionTrabajo): Promise<TrabajoEncolado> {
  const url = process.env.MOTOR_URL;
  const secreto = process.env.MOTOR_SECRETO;

  if (!url || !secreto) {
    console.error('[MOTOR] MOTOR_URL o MOTOR_SECRETO no configurados — no se puede encolar.');
    return { ok: false, error: 'MOTOR_NO_CONFIGURADO' };
  }

  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/encolar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Secreto compartido: el motor solo acepta trabajos de esta app.
        Authorization: `Bearer ${secreto}`,
      },
      body: JSON.stringify(peticion),
      // Encolar debe ser rápido: el motor solo mete el trabajo en la cola y
      // responde. Si tarda más que esto, algo está mal y conviene fallar
      // ahora (y devolverle el cupo al cliente) en vez de dejarlo colgado.
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const detalle = (await res.text()).slice(0, 300);
      console.error('[MOTOR] Rechazó el trabajo:', res.status, detalle);
      return { ok: false, error: 'MOTOR_RECHAZO', detalle };
    }

    const data = await res.json();
    return { ok: true, jobId: data.jobId ?? undefined };
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('[MOTOR] No respondió:', mensaje);
    return { ok: false, error: 'MOTOR_NO_RESPONDE', detalle: mensaje };
  }
}
