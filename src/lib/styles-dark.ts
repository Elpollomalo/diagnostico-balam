import type { CSSProperties } from "react";
import type { FieldStyleTokens } from "./styles";

// Paleta oscura del formulario -- la misma de la landing pública
// (src/lib/landing-content.ts / landing-page.tsx), NO la jade/ámbar/hueso
// de styles.ts. Mismos nombres de export que styles.ts a propósito, para
// que diagnostico-wizard.tsx solo tenga que cambiar de dónde importa.
// login-form.tsx y panel-editor.tsx siguen usando styles.ts (claro) sin
// cambios -- ver vault/sources/diagnostico-balam/marca/README.md para el
// porqué de dos paletas coexistiendo.

const DARK = {
  bg: "#090B0F",
  card: "#11151A",
  border: "#222831",
  text: "#F2F5F7",
  muted: "#9BA4AE",
  blue: "#3B82F6",
  cyan: "#22D3EE",
  green: "#22C55E",
  red: "#F87171",
};

export const containerStyle: CSSProperties = {
  background: DARK.card,
  borderRadius: "20px",
  padding: "32px 24px",
  fontFamily: "'Inter', 'Arial', sans-serif",
  color: DARK.text,
  maxWidth: "480px",
  margin: "0 auto",
  border: `1px solid ${DARK.border}`,
  boxShadow: "0 20px 60px -15px rgba(0,0,0,0.6)",
};

export const badgeStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.16em",
  color: DARK.cyan,
  background: "rgba(34, 211, 238, 0.1)",
  border: "1px solid rgba(34, 211, 238, 0.3)",
  borderRadius: "6px",
  padding: "4px 12px",
  marginBottom: "14px",
};

export const introTitleStyle: CSSProperties = { fontSize: "22px", fontWeight: 800, marginBottom: "10px", color: DARK.text };
export const introSubtitleStyle: CSSProperties = { fontSize: "13.5px", color: DARK.muted, lineHeight: 1.6, marginBottom: "10px" };
export const introBoxStyle: CSSProperties = {
  background: "rgba(59, 130, 246, 0.08)",
  border: "1px solid rgba(59, 130, 246, 0.2)",
  borderRadius: "10px",
  padding: "14px 16px",
  marginBottom: "14px",
  fontSize: "13px",
  color: DARK.text,
};
export const introListStyle: CSSProperties = { margin: "8px 0 0", paddingLeft: "18px", color: DARK.muted, lineHeight: 1.6 };

export const langButtonStyle: CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "14px 16px", borderRadius: "12px", border: `1.5px solid ${DARK.border}`,
  fontSize: "15px", fontWeight: 700, cursor: "pointer",
  background: DARK.bg, color: DARK.text, transition: "border-color 0.15s ease",
};

export const progressTrackStyle: CSSProperties = {
  width: "100%", height: "5px", background: DARK.border, borderRadius: "4px", overflow: "hidden", marginBottom: "10px",
};
export const progressFillStyle: CSSProperties = {
  height: "100%", background: `linear-gradient(90deg, ${DARK.blue}, ${DARK.cyan})`, borderRadius: "4px", transition: "width 0.3s ease",
};
export const blockLabelStyle: CSSProperties = { fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: DARK.cyan, marginBottom: "6px" };
export const questionStyle: CSSProperties = { fontSize: "18px", fontWeight: 700, lineHeight: 1.4, color: DARK.text };
export const subtitleSmallStyle: CSSProperties = { fontSize: "12.5px", color: DARK.muted, marginTop: "6px", fontStyle: "italic" };

export const inputStyle: CSSProperties = {
  width: "100%", boxSizing: "border-box", fontSize: "15px", padding: "12px 14px", borderRadius: "10px",
  border: `1.5px solid ${DARK.border}`, outline: "none", fontFamily: "inherit",
  background: DARK.bg, color: DARK.text,
};
export const textareaStyle: CSSProperties = { ...inputStyle, minHeight: "100px", resize: "vertical" };

export const optionCardStyle: CSSProperties = {
  padding: "12px 14px", borderRadius: "10px", border: `1.5px solid ${DARK.border}`,
  marginBottom: "10px", fontSize: "14px", cursor: "pointer", transition: "all 0.15s ease",
  background: DARK.bg, color: DARK.text,
};
export const optionCardActiveStyle: CSSProperties = {
  border: `1.5px solid ${DARK.blue}`, background: "rgba(59, 130, 246, 0.12)", fontWeight: 700, color: DARK.text,
};

export const scaleCardStyle: CSSProperties = {
  flex: 1, textAlign: "center", padding: "10px 4px", borderRadius: "10px",
  border: `1.5px solid ${DARK.border}`, cursor: "pointer", background: DARK.bg,
};

export const navRowStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center" };
export const primaryButtonStyle: CSSProperties = {
  background: `linear-gradient(90deg, ${DARK.blue}, ${DARK.cyan})`, color: "#0B0D10", border: "none", borderRadius: "10px",
  padding: "13px 22px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
};
export const secondaryButtonStyle: CSSProperties = { background: "transparent", color: DARK.muted, border: "none", fontSize: "13px", cursor: "pointer" };

// Tokens para StepField (el mismo componente lo usa el wizard y el panel
// interno con su paleta clara -- ver step-field.tsx) -- errorColor usa un
// rojo más claro que el "#C0392B" de la paleta clara porque ese es casi
// invisible sobre fondo oscuro.
export const fieldStyleTokens: FieldStyleTokens = {
  inputStyle,
  textareaStyle,
  optionCardStyle,
  optionCardActiveStyle,
  scaleCardStyle,
  mutedTextColor: DARK.muted,
  successColor: DARK.green,
  errorColor: DARK.red,
};
