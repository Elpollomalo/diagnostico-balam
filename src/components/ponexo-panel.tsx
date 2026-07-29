"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Plan } from "@/lib/planes";
import type { Plantilla } from "@/lib/plantillas";
import { COLORS } from "@/lib/config";
import {
  primaryButtonStyle,
  secondaryButtonStyle,
  textareaStyle,
  introTitleStyle,
  subtitleSmallStyle,
} from "@/lib/styles";

type Idioma = "es" | "en";

type TipoConsumoMostrado = "investigacion" | "plan_marketing" | "contenido" | "campana";

type Consumo = Record<string, { usado: number; limite: number }>;

interface EjecucionRow {
  id: string;
  plantilla: string | null;
  titulo: string;
  estado: "encolada" | "corriendo" | "lista" | "fallida" | "cancelada";
  presupuesto_agotado: boolean;
  error: string | null;
  encolada_at: string;
  terminada_at: string | null;
}

interface ResultadoRow {
  tipo: string;
  titulo: string | null;
  contenido: string;
  fuentes: { url: string; titulo?: string }[];
  created_at: string;
}

interface Textos {
  cuotasTitulo: string;
  investigacion: string;
  plan_marketing: string;
  contenido: string;
  campana: string;
  catalogoTitulo: string;
  perfilIncompleto: string;
  bloqueada: string;
  lanzar: string;
  lanzando: string;
  campoAbiertoTitulo: string;
  campoAbiertoPlaceholder: string;
  campoAbiertoBoton: string;
  historialTitulo: string;
  sinHistorial: string;
  verResultado: string;
  ocultar: string;
  presupuestoAgotado: string;
  volver: string;
  cerrarSesion: string;
  fuentes: string;
  estadoEncolada: string;
  estadoCorriendo: string;
  estadoLista: string;
  estadoFallida: string;
  estadoCancelada: string;
  errores: Record<string, string>;
}

const T: Record<Idioma, Textos> = {
  es: {
    cuotasTitulo: "Tu consumo este mes",
    investigacion: "Investigaciones",
    plan_marketing: "Planes de marketing",
    contenido: "Contenido",
    campana: "Campañas de correo",
    catalogoTitulo: "Catálogo de tareas",
    perfilIncompleto: "Completa tu perfil de negocio para usar esta tarea",
    bloqueada: "No disponible en tu plan",
    lanzar: "Lanzar",
    lanzando: "Lanzando…",
    campoAbiertoTitulo: "Investigación con instrucciones propias",
    campoAbiertoPlaceholder: "Describe qué quieres que investiguemos…",
    campoAbiertoBoton: "Lanzar investigación",
    historialTitulo: "Historial",
    sinHistorial: "Todavía no has lanzado ninguna tarea.",
    verResultado: "Ver resultado",
    ocultar: "Ocultar",
    presupuestoAgotado: "(se agotó el presupuesto antes de terminar)",
    volver: "← Volver a tu diagnóstico",
    cerrarSesion: "Cerrar sesión",
    fuentes: "Fuentes",
    estadoEncolada: "En cola",
    estadoCorriendo: "Corriendo…",
    estadoLista: "Lista",
    estadoFallida: "Falló",
    estadoCancelada: "Cancelada",
    errores: {
      SIN_CUPO: "Se te acabó el cupo de este tipo de tarea para este mes.",
      PLANTILLA_NO_DISPONIBLE: "Esta tarea no está incluida en tu plan.",
      CAMPO_ABIERTO_NO_DISPONIBLE: "La investigación con instrucciones propias es solo para el plan Plus.",
      PERFIL_INCOMPLETO: "Completa tu perfil de negocio antes de lanzar esta tarea.",
      FALTA_PETICION: "Escribe qué quieres investigar.",
      ERROR_INTERNO: "Algo falló de nuestro lado. Intenta de nuevo en un momento.",
    },
  },
  en: {
    cuotasTitulo: "Your usage this month",
    investigacion: "Research",
    plan_marketing: "Marketing plans",
    contenido: "Content",
    campana: "Email campaigns",
    catalogoTitulo: "Task catalog",
    perfilIncompleto: "Complete your business profile to use this task",
    bloqueada: "Not available on your plan",
    lanzar: "Run",
    lanzando: "Running…",
    campoAbiertoTitulo: "Custom research request",
    campoAbiertoPlaceholder: "Describe what you want us to research…",
    campoAbiertoBoton: "Run research",
    historialTitulo: "History",
    sinHistorial: "You haven't run any task yet.",
    verResultado: "View result",
    ocultar: "Hide",
    presupuestoAgotado: "(budget ran out before finishing)",
    volver: "← Back to your assessment",
    cerrarSesion: "Sign out",
    fuentes: "Sources",
    estadoEncolada: "Queued",
    estadoCorriendo: "Running…",
    estadoLista: "Ready",
    estadoFallida: "Failed",
    estadoCancelada: "Cancelled",
    errores: {
      SIN_CUPO: "You ran out of quota for this kind of task this month.",
      PLANTILLA_NO_DISPONIBLE: "This task isn't included in your plan.",
      CAMPO_ABIERTO_NO_DISPONIBLE: "Custom research requests are Plus-only.",
      PERFIL_INCOMPLETO: "Complete your business profile before running this task.",
      FALTA_PETICION: "Write what you'd like us to research.",
      ERROR_INTERNO: "Something failed on our end. Try again in a moment.",
    },
  },
};

const TIPOS_MOSTRADOS: TipoConsumoMostrado[] = [
  "investigacion",
  "plan_marketing",
  "contenido",
  "campana",
];

const ESTADO_COLOR: Record<EjecucionRow["estado"], string> = {
  encolada: COLORS.piedra,
  corriendo: COLORS.ambar,
  lista: COLORS.jade,
  fallida: "#C0392B",
  cancelada: COLORS.piedra,
};

const HAY_TRABAJO_ACTIVO = (lista: EjecucionRow[]) =>
  lista.some((e) => e.estado === "encolada" || e.estado === "corriendo");

export function PonexoPanel({
  userEmail,
  plan,
  perfilCompletitud,
  idioma,
  consumo,
  plantillas,
  ejecucionesIniciales,
}: {
  userEmail: string;
  plan: Plan;
  perfilCompletitud: number;
  idioma: Idioma;
  consumo: Consumo;
  plantillas: Plantilla[];
  ejecucionesIniciales: EjecucionRow[];
}) {
  const supabase = createClient();
  const t = T[idioma];

  const [ejecuciones, setEjecuciones] = useState<EjecucionRow[]>(ejecucionesIniciales);
  const [lanzando, setLanzando] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string>("");
  const [peticionAbierta, setPeticionAbierta] = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [resultadosCache, setResultadosCache] = useState<Record<string, ResultadoRow[]>>({});
  const [cargandoResultado, setCargandoResultado] = useState<string | null>(null);

  const ejecucionesRef = useRef(ejecuciones);
  ejecucionesRef.current = ejecuciones;

  const refrescarEjecuciones = useCallback(async () => {
    const { data } = await supabase
      .from("ejecuciones")
      .select("id, plantilla, titulo, estado, presupuesto_agotado, error, encolada_at, terminada_at")
      .order("encolada_at", { ascending: false })
      .limit(20);
    if (data) setEjecuciones(data as EjecucionRow[]);
  }, [supabase]);

  useEffect(() => {
    if (!HAY_TRABAJO_ACTIVO(ejecuciones)) return;
    const id = setInterval(() => {
      if (HAY_TRABAJO_ACTIVO(ejecucionesRef.current)) refrescarEjecuciones();
    }, 4000);
    return () => clearInterval(id);
  }, [ejecuciones, refrescarEjecuciones]);

  async function lanzar(slug: string | null, peticion: string | null) {
    const clave = slug ?? "campo_abierto";
    setLanzando(clave);
    setMensajeError("");
    try {
      const resp = await fetch("/api/manager/ejecutar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantilla: slug, peticion }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setMensajeError(t.errores[data.error] ?? data.error ?? t.errores.ERROR_INTERNO);
        return;
      }
      if (slug === null) setPeticionAbierta("");
      await refrescarEjecuciones();
    } catch {
      setMensajeError(t.errores.ERROR_INTERNO);
    } finally {
      setLanzando(null);
    }
  }

  async function verResultado(id: string) {
    if (expandido === id) {
      setExpandido(null);
      return;
    }
    setExpandido(id);
    if (resultadosCache[id]) return;
    setCargandoResultado(id);
    const { data } = await supabase
      .from("resultados")
      .select("tipo, titulo, contenido, fuentes, created_at")
      .eq("ejecucion_id", id)
      .order("created_at", { ascending: true });
    setResultadosCache((prev) => ({ ...prev, [id]: (data as ResultadoRow[]) ?? [] }));
    setCargandoResultado(null);
  }

  const estadoTexto = (estado: EjecucionRow["estado"]) =>
    ({
      encolada: t.estadoEncolada,
      corriendo: t.estadoCorriendo,
      lista: t.estadoLista,
      fallida: t.estadoFallida,
      cancelada: t.estadoCancelada,
    })[estado];

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F6F2", padding: "40px 24px" }}>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 13,
          color: COLORS.piedra,
        }}
      >
        <span>{userEmail}</span>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/panel" style={{ color: COLORS.piedra, fontSize: 13, textDecoration: "underline" }}>
            {t.volver}
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={introTitleStyle}>Ponexo Manager</div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: COLORS.ambar,
              background: "rgba(201,150,44,0.1)",
              border: "1px solid rgba(201,150,44,0.3)",
              borderRadius: 6,
              padding: "3px 9px",
              textTransform: "uppercase",
            }}
          >
            {plan.nombre}
          </span>
        </div>

        {mensajeError && (
          <div
            style={{
              background: "rgba(192,57,43,0.08)",
              border: "1px solid rgba(192,57,43,0.3)",
              color: "#C0392B",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {mensajeError}
          </div>
        )}

        {/* Cuotas */}
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.jade, marginBottom: 8 }}>
          {t.cuotasTitulo}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {TIPOS_MOSTRADOS.map((tipo) => {
            const c = consumo[tipo] ?? { usado: 0, limite: 0 };
            const pct = c.limite > 0 ? Math.min(100, (c.usado / c.limite) * 100) : 0;
            return (
              <div
                key={tipo}
                style={{
                  border: `1px solid ${COLORS.piedraClaro}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  background: "#fff",
                }}
              >
                <div style={{ fontSize: 12, color: COLORS.piedra, marginBottom: 6 }}>{t[tipo]}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                  {c.usado} / {c.limite}
                </div>
                <div style={{ height: 5, background: "rgba(27,77,62,0.12)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: COLORS.jade }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Catálogo */}
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.jade, marginBottom: 8 }}>
          {t.catalogoTitulo}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {plantillas.map((p) => {
            const bloqueada = p.orden > plan.maxPlantillas;
            const perfilFalta = p.requierePerfil && perfilCompletitud < 40;
            const deshabilitada = bloqueada || perfilFalta || lanzando !== null;
            return (
              <div
                key={p.slug}
                style={{
                  border: `1px solid ${COLORS.piedraClaro}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  background: bloqueada ? "rgba(0,0,0,0.02)" : "#fff",
                  opacity: bloqueada ? 0.6 : 1,
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icono}</div>
                <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>
                  {p.nombre[idioma]}
                </div>
                <p style={{ ...subtitleSmallStyle, fontStyle: "normal", marginTop: 0, marginBottom: 10 }}>
                  {p.descripcion[idioma]}
                </p>
                {bloqueada && (
                  <div style={{ fontSize: 12, color: COLORS.piedra, marginBottom: 8 }}>{t.bloqueada}</div>
                )}
                {!bloqueada && perfilFalta && (
                  <div style={{ fontSize: 12, color: "#C0392B", marginBottom: 8 }}>{t.perfilIncompleto}</div>
                )}
                <button
                  style={{
                    ...primaryButtonStyle,
                    padding: "8px 16px",
                    fontSize: 13,
                    opacity: deshabilitada ? 0.5 : 1,
                    cursor: deshabilitada ? "not-allowed" : "pointer",
                  }}
                  disabled={deshabilitada}
                  onClick={() => lanzar(p.slug, null)}
                >
                  {lanzando === p.slug ? t.lanzando : t.lanzar}
                </button>
              </div>
            );
          })}
        </div>

        {/* Campo abierto */}
        {plan.campoAbierto && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.jade, marginBottom: 8 }}>
              {t.campoAbiertoTitulo}
            </div>
            <textarea
              style={textareaStyle}
              placeholder={t.campoAbiertoPlaceholder}
              value={peticionAbierta}
              onChange={(e) => setPeticionAbierta(e.target.value)}
            />
            <button
              style={{
                ...primaryButtonStyle,
                marginTop: 10,
                opacity: lanzando !== null || !peticionAbierta.trim() ? 0.5 : 1,
                cursor: lanzando !== null || !peticionAbierta.trim() ? "not-allowed" : "pointer",
              }}
              disabled={lanzando !== null || !peticionAbierta.trim()}
              onClick={() => lanzar(null, peticionAbierta.trim())}
            >
              {lanzando === "campo_abierto" ? t.lanzando : t.campoAbiertoBoton}
            </button>
          </div>
        )}

        {/* Historial */}
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.jade, marginBottom: 8 }}>
          {t.historialTitulo}
        </div>
        {ejecuciones.length === 0 && (
          <p style={subtitleSmallStyle}>{t.sinHistorial}</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ejecuciones.map((e) => (
            <div
              key={e.id}
              style={{
                border: `1px solid ${COLORS.piedraClaro}`,
                borderRadius: 10,
                padding: "12px 14px",
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{e.titulo}</div>
                  <div style={{ fontSize: 12, color: COLORS.piedra, marginTop: 2 }}>
                    {new Date(e.encolada_at).toLocaleString(idioma === "es" ? "es-MX" : "en-US")}
                    {e.presupuesto_agotado && ` · ${t.presupuestoAgotado}`}
                  </div>
                  {e.estado === "fallida" && e.error && (
                    <div style={{ fontSize: 12, color: "#C0392B", marginTop: 2 }}>{e.error}</div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: ESTADO_COLOR[e.estado],
                      whiteSpace: "nowrap",
                    }}
                  >
                    ● {estadoTexto(e.estado)}
                  </span>
                  {e.estado === "lista" && (
                    <button
                      style={{ ...secondaryButtonStyle, whiteSpace: "nowrap" }}
                      onClick={() => verResultado(e.id)}
                    >
                      {expandido === e.id ? t.ocultar : t.verResultado}
                    </button>
                  )}
                </div>
              </div>

              {expandido === e.id && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${COLORS.piedraClaro}`, paddingTop: 12 }}>
                  {cargandoResultado === e.id && <span style={{ fontSize: 13 }}>…</span>}
                  {(resultadosCache[e.id] ?? []).map((r, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      {r.titulo && <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>{r.titulo}</div>}
                      <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.6 }}>{r.contenido}</div>
                      {r.fuentes?.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, color: COLORS.piedra }}>
                          {t.fuentes}:{" "}
                          {r.fuentes.map((f, j) => (
                            <a
                              key={j}
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: COLORS.jade, marginRight: 8 }}
                            >
                              {f.titulo || f.url}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
