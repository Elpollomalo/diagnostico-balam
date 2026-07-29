/**
 * Catálogo de plantillas de investigación y tareas de Ponexo Manager.
 *
 * Carlos (29 julio 2026): "en investigaciones se deben definir varias
 * plantillas a elegir, de todo tipo de tareas, unas 10 que puedan hacer y
 * mandar el reporte. La free solo tiene acceso a dos, la pro a 8 y la plus
 * todas más campo abierto."
 *
 * Cada plantilla declara qué agente la ejecuta y con qué presupuesto. Eso es
 * lo que hace el costo PREDECIBLE: se sabe cuánto puede gastar una tarea
 * antes de lanzarla, no al final del mes cuando llega la factura.
 *
 * El orden importa: `orden` define cuáles caen dentro del cupo de cada plan
 * (las 2 primeras para free, las 8 primeras para pro). Se ordenaron poniendo
 * primero las que dan valor más rápido con menos contexto del negocio —
 * alguien que apenas se registró todavía no tiene perfil completo.
 */

export type SlugPlantilla =
  | 'competencia'
  | 'precios-giro'
  | 'contenido-redes'
  | 'plan-marketing'
  | 'oportunidades'
  | 'prospectos-zona'
  | 'auditoria-presencia'
  | 'tendencias-industria'
  | 'campana-correo'
  | 'reporte-ejecutivo';

export interface Plantilla {
  slug: SlugPlantilla;
  orden: number;
  icono: string;
  /** Agente del sistema que la ejecuta. */
  agente: string;
  /** Contra qué cuota cuenta (ver planes.ts). */
  tipoConsumo: 'investigacion' | 'plan_marketing' | 'contenido' | 'campana';
  /** Qué produce: define qué filas de `resultados` se esperan. */
  entrega: ('reporte_crudo' | 'resumen' | 'oportunidades' | 'contenido' | 'plan')[];
  /**
   * Presupuesto propio. Sobrescribe el del plan cuando es MENOR — una
   * plantilla barata no debe gastar como una cara solo porque el cliente
   * tiene plan alto.
   */
  presupuestoBusquedas?: number;
  /** Necesita el perfil de negocio razonablemente completo para dar algo útil. */
  requierePerfil: boolean;
  nombre: { es: string; en: string };
  descripcion: { es: string; en: string };
}

export const PLANTILLAS: Plantilla[] = [
  {
    slug: 'competencia',
    orden: 1,
    icono: '🔍',
    agente: 'investigadores',
    tipoConsumo: 'investigacion',
    entrega: ['reporte_crudo', 'resumen', 'oportunidades'],
    requierePerfil: false,
    nombre: { es: 'Radiografía de competencia', en: 'Competitor breakdown' },
    descripcion: {
      es: 'Quiénes son tus competidores, qué ofrecen, a qué precio y qué dicen sus sitios.',
      en: 'Who your competitors are, what they offer, at what price, and what their sites say.',
    },
  },
  {
    slug: 'precios-giro',
    orden: 2,
    icono: '💰',
    agente: 'investigadores',
    tipoConsumo: 'investigacion',
    entrega: ['reporte_crudo', 'resumen'],
    requierePerfil: false,
    nombre: { es: 'Qué se cobra en tu giro', en: 'Pricing in your industry' },
    descripcion: {
      es: 'Rangos de precio reales del mercado, con la fuente de cada dato.',
      en: 'Real market price ranges, with a source for every figure.',
    },
  },
  {
    slug: 'contenido-redes',
    orden: 3,
    icono: '✍️',
    agente: 'marketing',
    tipoConsumo: 'contenido',
    entrega: ['contenido'],
    presupuestoBusquedas: 2,
    requierePerfil: true,
    nombre: { es: 'Contenido del mes para redes', en: "This month's social content" },
    descripcion: {
      es: 'Una tanda de textos listos para publicar, con el tono de tu marca.',
      en: 'A batch of ready-to-post copy, in your brand voice.',
    },
  },
  {
    slug: 'plan-marketing',
    orden: 4,
    icono: '🎯',
    agente: 'marketing',
    tipoConsumo: 'plan_marketing',
    entrega: ['plan'],
    requierePerfil: true,
    nombre: { es: 'Plan de marketing trimestral', en: 'Quarterly marketing plan' },
    descripcion: {
      es: 'Objetivos, canales, mensajes y calendario para los próximos tres meses.',
      en: 'Goals, channels, messaging and a calendar for the next three months.',
    },
  },
  {
    slug: 'oportunidades',
    orden: 5,
    icono: '💡',
    agente: 'investigadores',
    tipoConsumo: 'investigacion',
    entrega: ['oportunidades'],
    requierePerfil: true,
    nombre: { es: 'Oportunidades detectadas', en: 'Detected opportunities' },
    descripcion: {
      es: 'Huecos del mercado que tu negocio podría tomar, a partir de lo ya investigado.',
      en: 'Market gaps your business could take, based on what has already been researched.',
    },
  },
  {
    slug: 'prospectos-zona',
    orden: 6,
    icono: '📍',
    agente: 'prospectores',
    tipoConsumo: 'investigacion',
    entrega: ['reporte_crudo', 'resumen'],
    requierePerfil: true,
    nombre: { es: 'Prospectos en mi zona', en: 'Prospects in my area' },
    descripcion: {
      es: 'Negocios reales que encajan con el cliente ideal que describiste.',
      en: 'Real businesses that match the ideal customer you described.',
    },
  },
  {
    slug: 'auditoria-presencia',
    orden: 7,
    icono: '🔬',
    agente: 'auditoria',
    tipoConsumo: 'investigacion',
    entrega: ['reporte_crudo', 'oportunidades'],
    requierePerfil: true,
    nombre: { es: 'Auditoría de mi presencia online', en: 'Online presence audit' },
    descripcion: {
      es: 'Qué dice hoy tu sitio y tus redes, y qué le falta frente a tu competencia.',
      en: 'What your site and social say today, and what they lack against competitors.',
    },
  },
  {
    slug: 'tendencias-industria',
    orden: 8,
    icono: '📈',
    agente: 'investigadores',
    tipoConsumo: 'investigacion',
    entrega: ['reporte_crudo', 'resumen'],
    requierePerfil: false,
    nombre: { es: 'Tendencias de mi industria', en: 'Industry trends' },
    descripcion: {
      es: 'Qué se está moviendo en tu sector, con fuentes fechadas.',
      en: "What's moving in your sector, with dated sources.",
    },
  },
  {
    slug: 'campana-correo',
    orden: 9,
    icono: '📧',
    agente: 'marketing',
    tipoConsumo: 'campana',
    entrega: ['contenido'],
    presupuestoBusquedas: 2,
    requierePerfil: true,
    nombre: { es: 'Campaña de correo lista', en: 'Ready-to-send email campaign' },
    descripcion: {
      es: 'Copia, segmentación y personalización por destinatario, lista para enviar.',
      en: 'Copy, segmentation and per-recipient personalization, ready to send.',
    },
  },
  {
    slug: 'reporte-ejecutivo',
    orden: 10,
    icono: '📊',
    agente: 'editores',
    tipoConsumo: 'investigacion',
    entrega: ['resumen'],
    presupuestoBusquedas: 0,
    requierePerfil: false,
    nombre: { es: 'Reporte ejecutivo del mes', en: 'Monthly executive report' },
    descripcion: {
      es: 'Resumen unificado de todo lo que pasó este mes en tu cuenta.',
      en: 'A unified summary of everything that happened in your account this month.',
    },
  },
];

export function getPlantilla(slug: string): Plantilla | undefined {
  return PLANTILLAS.find((p) => p.slug === slug);
}

/**
 * Plantillas que un plan puede USAR. Las demás se siguen mostrando en el
 * catálogo (bloqueadas), porque un límite que se ve convierte mejor que una
 * función escondida: el cliente sabe qué está dejando sobre la mesa.
 */
export function plantillasDisponibles(maxPlantillas: number): SlugPlantilla[] {
  return PLANTILLAS.filter((p) => p.orden <= maxPlantillas).map((p) => p.slug);
}

export function plantillaDisponibleEnPlan(slug: string, maxPlantillas: number): boolean {
  const p = getPlantilla(slug);
  return !!p && p.orden <= maxPlantillas;
}
