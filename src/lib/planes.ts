/**
 * Planes y cuotas de Ponexo Manager.
 *
 * Decisión de Carlos (29 julio 2026): **todos los planes ven TODAS las
 * funciones**. Lo que cambia es cuánto pueden usarlas. El free no es una
 * versión mutilada — es una probada real del producto completo, para que el
 * cliente se tope con el límite queriendo más, no con una pared que le dice
 * "esto no es para ti".
 *
 * La única excepción es cuántas plantillas del catálogo puede usar cada plan
 * (free 2 · pro 8 · plus las 10 + campo abierto), porque cada plantilla tiene
 * un costo distinto de ejecutar.
 *
 * Los límites viven aquí y no en la base a propósito: son reglas de negocio
 * que se ajustan seguido, y no queremos una migración cada vez que se mueve
 * un número.
 */

export type PlanId = 'free' | 'pro' | 'plus';

export interface Plan {
  id: PlanId;
  nombre: string;
  precioUsd: number;
  /** Variable de entorno con el price id de Stripe. El free no cobra. */
  priceEnvVar?: string;

  /** Cuántas plantillas del catálogo puede usar (ver PLANTILLAS). */
  maxPlantillas: number;
  /** Puede pedir una investigación con instrucciones propias. */
  campoAbierto: boolean;

  // ── Cuotas mensuales ──────────────────────────────────────────────────
  investigacionesMes: number;
  planesMarketingMes: number;
  contenidosMes: number;
  correosMes: number;
  /** Tareas programadas activas al mismo tiempo (no al mes). */
  cronesActivos: number;

  // ── Presupuesto por ejecución ─────────────────────────────────────────
  // Al agotarse NO se mata la ejecución: entrega lo que alcanzó y lo dice.
  // Un trabajo a medias que avisa sirve; uno que se cuelga, no.
  presupuestoBusquedas: number;
  presupuestoLlamadas: number;
}

export const PLANES: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    nombre: 'Free',
    precioUsd: 0,
    maxPlantillas: 2,
    campoAbierto: false,
    investigacionesMes: 2,
    planesMarketingMes: 1,
    contenidosMes: 2,
    correosMes: 10,
    cronesActivos: 0,
    presupuestoBusquedas: 3,
    presupuestoLlamadas: 6,
  },
  pro: {
    id: 'pro',
    nombre: 'Pro',
    precioUsd: 29,
    priceEnvVar: 'STRIPE_PRICE_ID_PRO',
    maxPlantillas: 8,
    campoAbierto: false,
    investigacionesMes: 15,
    planesMarketingMes: 4,
    contenidosMes: 20,
    correosMes: 2000,
    cronesActivos: 3,
    presupuestoBusquedas: 8,
    presupuestoLlamadas: 15,
  },
  plus: {
    id: 'plus',
    nombre: 'Plus',
    precioUsd: 79,
    priceEnvVar: 'STRIPE_PRICE_ID_PLUS',
    maxPlantillas: 999,
    campoAbierto: true,
    investigacionesMes: 60,
    planesMarketingMes: 12,
    contenidosMes: 80,
    correosMes: 10000,
    cronesActivos: 10,
    presupuestoBusquedas: 15,
    presupuestoLlamadas: 30,
  },
};

/** Tipos de consumo que se cuentan contra la cuota. */
export type TipoConsumo =
  | 'investigacion'
  | 'plan_marketing'
  | 'contenido'
  | 'campana'
  | 'correo_enviado'
  | 'campo_abierto';

/** Cuota mensual de un tipo de consumo para un plan. */
export function cuotaMensual(plan: PlanId, tipo: TipoConsumo): number {
  const p = PLANES[plan];
  switch (tipo) {
    case 'investigacion':
    case 'campo_abierto':
      return p.investigacionesMes;
    case 'plan_marketing':
      return p.planesMarketingMes;
    case 'contenido':
    case 'campana':
      return p.contenidosMes;
    case 'correo_enviado':
      return p.correosMes;
  }
}

export function getPlan(plan: string | null | undefined): Plan {
  if (plan === 'pro' || plan === 'plus') return PLANES[plan];
  return PLANES.free;
}

/** true si `hacia` cuesta más que `desde` (define si se cobra ya o se agenda). */
export function esUpgrade(desde: PlanId, hacia: PlanId): boolean {
  return PLANES[hacia].precioUsd > PLANES[desde].precioUsd;
}

/**
 * Periodo actual en formato AAAA-MM.
 *
 * Se calcula en UTC a propósito: si dependiera de la zona del servidor, un
 * consumo hecho el día 1 podría contarse al mes anterior según dónde corra el
 * proceso. La cuota tiene que cortar igual para todos.
 */
export function periodoActual(fecha: Date = new Date()): string {
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
}
