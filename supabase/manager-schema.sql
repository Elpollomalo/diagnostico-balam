-- ═══════════════════════════════════════════════════════════════════════════
-- Ponexo Manager — modelo de datos de Fase 1
-- Correr una sola vez en el SQL Editor de Supabase.
--
-- Diseño acordado con Carlos el 29 julio 2026 (ver
-- vault/1-desk/ponexo-plan-revisado.md en el repo del sistema).
--
-- Cubre el ciclo completo: perfil → plan de marketing → textos → investigación
-- → oportunidades → campañas de correo → envío → seguimiento de respuestas →
-- aviso por Telegram. Más tareas programadas y suscripción.
--
-- ── Dos principios que atraviesan todo el esquema ──────────────────────────
--
-- 1. AISLAMIENTO POR CLIENTE. Cada tabla con datos de cliente lleva `user_id`
--    y RLS que solo deja ver lo propio. Los resultados de los agentes viven
--    AQUI, nunca en el vault del sistema: el vault se commitea a git y son
--    datos personales de terceros.
--
-- 2. FRONTERA DEL CONOCIMIENTO. `atomos` es la unica tabla deliberadamente
--    compartida entre clientes, y solo admite lo que salio de fuentes
--    publicas (`origen = 'publico'`). Un dato que salio del cliente jamas
--    entra ahi. La linea va en el ORIGEN del dato, no en quien lo pidio.
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- PERFIL DE NEGOCIO
-- ───────────────────────────────────────────────────────────────────────────
-- El diagnostico que ya existe (`diagnosticos`) es la puerta de entrada y la
-- primera version del perfil. Esta tabla es el "perfil vivo" que pedia el
-- documento original: se actualiza con cada interaccion, campana y respuesta.
--
-- Se separa de `diagnosticos` a proposito: esa tiene UNIQUE por user_id y
-- nacio como formulario de una sola vez. Forzar ahi un perfil que cambia
-- constantemente mezclaria dos cosas con ciclos de vida distintos.

create table if not exists public.perfiles_negocio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,

  nombre_negocio text,
  industria text,
  cliente_ideal text,
  tono_marca text,
  propuesta_valor text,
  zona text,
  sitio_web text,

  -- Todo lo que no amerita columna propia todavia. El perfil crece con el
  -- producto y no queremos una migracion por cada campo nuevo.
  datos jsonb not null default '{}'::jsonb,

  -- Que tan completo esta (0-100). Sirve para pedirle al cliente lo que falta
  -- en vez de entregarle trabajos pobres por falta de contexto.
  completitud int not null default 0,

  idioma text not null default 'es',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ───────────────────────────────────────────────────────────────────────────
-- SUSCRIPCION Y CUOTAS
-- ───────────────────────────────────────────────────────────────────────────
-- Decision de Carlos: TODOS los planes ven TODAS las funciones. Lo que cambia
-- es cuanto pueden usarlas. El free es una probada real del producto completo,
-- no una version mutilada.
--
-- Los limites concretos viven en el codigo (src/lib/planes.ts), no aqui: son
-- reglas de negocio que se ajustan seguido y no queremos una migracion cada
-- vez que se mueve un numero.

create table if not exists public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,

  plan text not null default 'free',
  estado text not null default 'activo',

  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_schedule_id text,

  -- Mismo patron ya probado en tourbrain-app: el plan SOLO sube cuando el
  -- pago esta confirmado; mientras tanto queda anotado aqui y lo aplica el
  -- webhook. Sin esto, cualquiera se activa el plan alto sin pagar.
  plan_pendiente_pago text,
  -- Downgrade agendado al fin del periodo ya pagado (no se le quitan
  -- beneficios a quien ya pago el mes).
  plan_programado text,
  plan_programado_fecha timestamptz,
  cancelar_al_finalizar_periodo boolean not null default false,
  proximo_intento_cobro timestamptz,

  terminos_aceptados_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint suscripciones_estado_check
    check (estado in ('activo', 'pendiente_pago', 'pago_fallido', 'cancelado'))
);

-- Consumo por periodo. Se lleva por FILA CONTADA, no por un contador que se
-- incrementa: un contador se desincroniza en cuanto falla algo a la mitad, y
-- ademas no deja auditar por que un cliente llego a su tope.
--
-- `costo_*` guarda lo REALMENTE gastado, no lo estimado. Sin ese dato no hay
-- forma de saber si un plan deja margen o se pierde dinero en cada cliente.
create table if not exists public.consumo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Que se consumio: 'investigacion' | 'plan_marketing' | 'contenido' |
  -- 'campana' | 'correo_enviado' | 'campo_abierto'
  tipo text not null,
  ejecucion_id uuid,

  costo_busquedas int not null default 0,
  costo_llamadas_modelo int not null default 0,
  costo_tokens_entrada int not null default 0,
  costo_tokens_salida int not null default 0,

  -- Periodo al que cuenta, en formato AAAA-MM. Se guarda calculado y no se
  -- deriva de created_at al vuelo para que un cambio de zona horaria no mueva
  -- de mes un consumo ya contado.
  periodo text not null,

  created_at timestamptz not null default now()
);

create index if not exists consumo_user_periodo_idx on public.consumo (user_id, periodo, tipo);


-- ───────────────────────────────────────────────────────────────────────────
-- TRABAJOS (ejecuciones de agentes)
-- ───────────────────────────────────────────────────────────────────────────
-- Una fila por cada cosa que el cliente pide. Es la bitacora de todo lo que
-- el sistema hizo por el.
--
-- El presupuesto vive EN la fila (no solo en la plantilla) porque una vez
-- lanzada, la ejecucion tiene que poder responder "cuanto me queda" sin
-- depender de que la plantilla no haya cambiado desde entonces.

create table if not exists public.ejecuciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Slug de la plantilla del catalogo, o null si es campo abierto (plan plus).
  plantilla text,
  titulo text not null,
  -- Lo que pidio el cliente, tal cual.
  peticion text,
  agente text not null,

  estado text not null default 'encolada',
  -- Id del job en la cola, para poder rastrearlo del lado del worker.
  job_id text,

  -- Presupuesto asignado y gastado. Al agotarse NO se mata la ejecucion:
  -- entrega lo que alcanzo y lo dice ("alcance a revisar 6 de 10 fuentes").
  presupuesto_busquedas int not null default 5,
  presupuesto_llamadas int not null default 10,
  usado_busquedas int not null default 0,
  usado_llamadas int not null default 0,
  presupuesto_agotado boolean not null default false,

  error text,
  encolada_at timestamptz not null default now(),
  iniciada_at timestamptz,
  terminada_at timestamptz,

  constraint ejecuciones_estado_check
    check (estado in ('encolada', 'corriendo', 'lista', 'fallida', 'cancelada'))
);

create index if not exists ejecuciones_user_idx on public.ejecuciones (user_id, encolada_at desc);
create index if not exists ejecuciones_estado_idx on public.ejecuciones (estado);

-- El entregable. Se separa de `ejecuciones` porque una ejecucion puede
-- producir varias piezas (el reporte crudo, el resumen ejecutivo y las
-- oportunidades son tres cosas distintas que el cliente consume distinto).
create table if not exists public.resultados (
  id uuid primary key default gen_random_uuid(),
  ejecucion_id uuid not null references public.ejecuciones (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,

  -- 'reporte_crudo' | 'resumen' | 'oportunidades' | 'contenido' | 'plan'
  tipo text not null,
  titulo text,
  contenido text not null,
  -- Fuentes citadas: [{ url, titulo, consultada_at }]
  fuentes jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists resultados_user_idx on public.resultados (user_id, created_at desc);
create index if not exists resultados_ejecucion_idx on public.resultados (ejecucion_id);


-- ───────────────────────────────────────────────────────────────────────────
-- TAREAS PROGRAMADAS (crones del cliente)
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.tareas_programadas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  plantilla text not null,
  titulo text not null,
  peticion text,

  -- 'diaria' | 'semanal' | 'mensual'. Se guarda asi y no como expresion cron
  -- porque el cliente elige de una lista, no escribe sintaxis.
  frecuencia text not null,
  -- Dia de la semana (0-6) o del mes (1-28), segun frecuencia.
  dia int,
  hora time not null default '09:00',

  activa boolean not null default true,
  ultima_corrida_at timestamptz,
  proxima_corrida_at timestamptz,

  created_at timestamptz not null default now(),

  constraint tareas_frecuencia_check check (frecuencia in ('diaria', 'semanal', 'mensual'))
);

create index if not exists tareas_proxima_idx on public.tareas_programadas (proxima_corrida_at)
  where activa = true;


-- ───────────────────────────────────────────────────────────────────────────
-- CAMPANAS DE CORREO
-- ───────────────────────────────────────────────────────────────────────────
-- El dominio de envio es del CLIENTE, no de Ponexo (decision de Carlos): sus
-- campanas salen a su nombre y la reputacion que arriesga es la suya. Es
-- funcionalidad de onboarding, no una traba.

create table if not exists public.dominios_envio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  dominio text not null,
  remitente text not null,
  -- Id del dominio en Resend, para consultar su verificacion.
  proveedor_dominio_id text,
  verificado boolean not null default false,
  verificado_at timestamptz,

  created_at timestamptz not null default now(),
  unique (user_id, dominio)
);

create table if not exists public.contactos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  correo text not null,
  nombre text,
  -- Campos libres para personalizar el correo ({{empresa}}, {{ciudad}}...).
  datos jsonb not null default '{}'::jsonb,

  -- Quien rebota o se queja NO vuelve a recibir nada de este cliente, nunca.
  -- Es supresion global suya, no por campana: reintentar contra un rebote
  -- duro es la via mas rapida a que le bloqueen el dominio.
  suprimido boolean not null default false,
  motivo_supresion text,
  suprimido_at timestamptz,

  -- Consentimiento declarado por el cliente al subir la lista. Queda fechado.
  consentimiento_declarado_at timestamptz,

  created_at timestamptz not null default now(),
  unique (user_id, correo)
);

create index if not exists contactos_user_idx on public.contactos (user_id) where suprimido = false;

create table if not exists public.campanas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dominio_envio_id uuid references public.dominios_envio (id) on delete set null,

  nombre text not null,
  asunto text not null,
  -- Cuerpo con marcadores de personalizacion ({{nombre}}, {{empresa}}...).
  cuerpo_html text not null,
  -- La imagen la SUBE el cliente; el sistema no la genera (decision de Fase 1).
  imagen_url text,

  estado text not null default 'borrador',
  programada_para timestamptz,
  enviada_at timestamptz,

  created_at timestamptz not null default now(),

  constraint campanas_estado_check
    check (estado in ('borrador', 'programada', 'enviando', 'enviada', 'cancelada'))
);

-- Un envio por destinatario. Aqui se cierra el ciclo: enviado → abierto →
-- respondido. Es lo que alimenta el CRM de Fase 2 sin rehacer nada.
create table if not exists public.envios (
  id uuid primary key default gen_random_uuid(),
  campana_id uuid not null references public.campanas (id) on delete cascade,
  contacto_id uuid not null references public.contactos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Direccion de respuesta unica de este envio. Es el mecanismo que permite
  -- emparejar una respuesta con su campana y su destinatario sin adivinar por
  -- el asunto, que la gente edita.
  reply_to text not null unique,

  estado text not null default 'pendiente',
  proveedor_mensaje_id text,

  enviado_at timestamptz,
  abierto_at timestamptz,
  respondido_at timestamptz,
  respuesta_texto text,
  error text,

  constraint envios_estado_check
    check (estado in ('pendiente', 'enviado', 'rebotado', 'abierto', 'respondido', 'fallido'))
);

create index if not exists envios_campana_idx on public.envios (campana_id);
create index if not exists envios_user_idx on public.envios (user_id, enviado_at desc);


-- ───────────────────────────────────────────────────────────────────────────
-- BASE DE CONOCIMIENTO ATOMIZADA
-- ───────────────────────────────────────────────────────────────────────────
-- Idea de Carlos: las investigaciones no se entregan y se tiran, se guardan y
-- sirven a los mismos agentes. La segunda investigacion sobre un giro parte
-- de lo que se supo en la primera, y solo sale a buscar lo que falta.
--
-- ATOMICO a proposito: un dato por fila, con su fuente y su fecha. Recuperar
-- 5 atomos relevantes cuesta muchisimo menos que meter tres informes
-- completos al contexto -- y ademas responde mejor. (Comprobado el mismo dia
-- en el chat de tourbrain: recortar el contexto MEJORO las respuestas.)
--
-- ⚠️ ESTA ES LA UNICA TABLA COMPARTIDA ENTRE CLIENTES, y solo admite
-- `origen = 'publico'`. Un dato que salio del cliente (su perfil, sus listas,
-- sus resultados) NUNCA entra aqui. La linea va en el origen del dato.

create table if not exists public.atomos (
  id uuid primary key default gen_random_uuid(),

  -- 'publico' = salio de una fuente publica y se comparte.
  -- 'cliente'  = salio del cliente; se guarda con user_id y NO se comparte.
  origen text not null default 'publico',
  user_id uuid references auth.users (id) on delete cascade,

  -- El dato, corto y autocontenido. Si necesita contexto para entenderse,
  -- esta mal atomizado.
  dato text not null,

  -- Para encontrarlo despues sin leerlo todo.
  tema text,
  industria text,
  zona text,
  etiquetas text[] not null default '{}',

  fuente_url text,
  fuente_titulo text,
  obtenido_at timestamptz not null default now(),

  -- La fecha importa tanto como el dato: un precio de mercado de hace ocho
  -- meses no es un ahorro, es un error que se propaga a todos los clientes.
  -- Cada tipo de dato envejece distinto -- un precio rapido, la descripcion
  -- de un competidor no tanto -- asi que la caducidad se fija al guardarlo.
  vence_at timestamptz,

  ejecucion_id uuid references public.ejecuciones (id) on delete set null,
  created_at timestamptz not null default now(),

  constraint atomos_origen_check check (origen in ('publico', 'cliente')),
  -- Un atomo de cliente SIN dueno seria un dato privado compartido con todos:
  -- justo lo que este diseno evita. La base lo impide, no solo el codigo.
  constraint atomos_cliente_con_dueno check (origen = 'publico' or user_id is not null)
);

create index if not exists atomos_busqueda_idx on public.atomos (origen, industria, tema);
create index if not exists atomos_etiquetas_idx on public.atomos using gin (etiquetas);
create index if not exists atomos_vigencia_idx on public.atomos (vence_at) where vence_at is not null;


-- ───────────────────────────────────────────────────────────────────────────
-- TELEGRAM
-- ───────────────────────────────────────────────────────────────────────────
-- Telegram no permite escribirle a alguien que no inicio la conversacion: hay
-- que obtener su chat_id cuando el le da Start al bot. El codigo de
-- vinculacion es lo que permite emparejar ese Start con su cuenta de Ponexo.

create table if not exists public.telegram_vinculos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,

  codigo text not null unique,
  chat_id text,
  vinculado_at timestamptz,
  activo boolean not null default true,

  created_at timestamptz not null default now()
);


-- ───────────────────────────────────────────────────────────────────────────
-- RLS — cada quien ve solo lo suyo
-- ───────────────────────────────────────────────────────────────────────────
-- Se aplica a TODAS las tablas de cliente. `atomos` es el unico caso especial
-- y se maneja aparte, mas abajo.

alter table public.perfiles_negocio    enable row level security;
alter table public.suscripciones       enable row level security;
alter table public.consumo             enable row level security;
alter table public.ejecuciones         enable row level security;
alter table public.resultados          enable row level security;
alter table public.tareas_programadas  enable row level security;
alter table public.dominios_envio      enable row level security;
alter table public.contactos           enable row level security;
alter table public.campanas            enable row level security;
alter table public.envios              enable row level security;
alter table public.atomos              enable row level security;
alter table public.telegram_vinculos   enable row level security;

-- Politicas de "solo lo mio" para las tablas con user_id directo.
do $$
declare
  t text;
begin
  foreach t in array array[
    'perfiles_negocio', 'suscripciones', 'consumo', 'ejecuciones', 'resultados',
    'tareas_programadas', 'dominios_envio', 'contactos', 'campanas', 'envios',
    'telegram_vinculos'
  ]
  loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$I', t);
    execute format(
      'create policy "%1$s_select_own" on public.%1$I for select using (auth.uid() = user_id)', t);

    execute format('drop policy if exists "%1$s_insert_own" on public.%1$I', t);
    execute format(
      'create policy "%1$s_insert_own" on public.%1$I for insert with check (auth.uid() = user_id)', t);

    execute format('drop policy if exists "%1$s_update_own" on public.%1$I', t);
    execute format(
      'create policy "%1$s_update_own" on public.%1$I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);

    execute format('drop policy if exists "%1$s_delete_own" on public.%1$I', t);
    execute format(
      'create policy "%1$s_delete_own" on public.%1$I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- `atomos`: el conocimiento PUBLICO lo lee cualquiera autenticado (ahi esta el
-- ahorro de tokens); el de cliente solo su dueno.
--
-- Nadie escribe atomos desde el navegador: los crea el worker con service_role,
-- que se salta RLS. Por eso aqui solo hay politica de lectura -- si manana
-- alguien agrega un insert desde el cliente, va a fallar, y eso es lo correcto:
-- que falle ruidoso en vez de dejar entrar datos sin verificar su origen.
drop policy if exists "atomos_select" on public.atomos;
create policy "atomos_select" on public.atomos
  for select
  using (origen = 'publico' or auth.uid() = user_id);


-- ───────────────────────────────────────────────────────────────────────────
-- updated_at automatico
-- ───────────────────────────────────────────────────────────────────────────
-- Reusa la funcion que ya existe en schema.sql (public.set_updated_at).

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists perfiles_negocio_set_updated_at on public.perfiles_negocio;
create trigger perfiles_negocio_set_updated_at
  before update on public.perfiles_negocio
  for each row execute function public.set_updated_at();

drop trigger if exists suscripciones_set_updated_at on public.suscripciones;
create trigger suscripciones_set_updated_at
  before update on public.suscripciones
  for each row execute function public.set_updated_at();
