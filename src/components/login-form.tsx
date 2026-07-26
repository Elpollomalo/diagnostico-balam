"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
// Paleta oscura -- la misma de la landing y el formulario, no la clara de
// styles.ts (esta tarjeta vive en la última pantalla de la landing, que
// ahora también es oscura; ver landing-page.tsx).
import {
  containerStyle,
  inputStyle,
  primaryButtonStyle,
  introTitleStyle,
  introSubtitleStyle,
} from "@/lib/styles-dark";
import type { Lang } from "@/lib/config";
import { loginForm as t } from "@/lib/landing-content";

type Step = "email" | "otp";

interface LoginFormProps {
  /** Encabezado opcional mostrado arriba de la tarjeta (usado por la landing pública). */
  heading?: string;
  subheading?: string;
  /** Idioma activo -- por defecto "es" para no romper otros usos futuros sin landing. */
  lang?: Lang;
}

export function LoginForm({ heading, subheading, lang = "es" }: LoginFormProps = {}) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp() {
    setError("");
    if (!email || !email.includes("@")) {
      setError(t.errorInvalidEmail[lang]);
      return;
    }
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (otpError) {
      setError(t.errorSendFailed[lang]);
      return;
    }
    setStep("otp");
  }

  async function handleVerifyOtp() {
    setError("");
    if (!code || code.length < 6) {
      setError(t.errorInvalidOtp[lang]);
      return;
    }
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setLoading(false);
    if (verifyError) {
      setError(t.errorVerifyFailed[lang]);
      return;
    }
    // La raíz ("/") ahora siempre muestra la landing -- entrar de verdad al
    // formulario (o al panel, si ya lo tiene completo) pasa por /formulario,
    // que decide cuál de las dos según el estado real del usuario.
    router.push("/formulario");
  }

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#090B0F", padding: 24 }}>
      {heading && (
        <div style={{ textAlign: "center", maxWidth: 560, marginBottom: 28 }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 800, color: "#F2F5F7", marginBottom: 10 }}>
            {heading}
          </h2>
          {subheading && (
            <p style={{ fontSize: 16, color: "#9BA4AE" }}>{subheading}</p>
          )}
        </div>
      )}
      <div style={containerStyle}>
        <div style={introTitleStyle}>
          {step === "email" ? t.emailTitle[lang] : t.otpTitle[lang]}
        </div>
        {step === "otp" && (
          <p style={introSubtitleStyle}>{t.otpSubtitle[lang]} {email}</p>
        )}

        {step === "email" && (
          <>
            <input
              style={{ ...inputStyle, marginBottom: 12 }}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder[lang]}
              autoFocus
            />
            <button
              style={{ ...primaryButtonStyle, width: "100%", opacity: loading ? 0.6 : 1 }}
              onClick={handleSendOtp}
              className="animate-cta-glow"
              disabled={loading}
            >
              {loading ? t.sendingButton[lang] : t.sendButton[lang]}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <input
              style={{ ...inputStyle, marginBottom: 12 }}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t.otpPlaceholder[lang]}
              maxLength={6}
              autoFocus
            />
            <button
              style={{ ...primaryButtonStyle, width: "100%", opacity: loading ? 0.6 : 1 }}
              onClick={handleVerifyOtp}
              className="animate-cta-glow"
              disabled={loading}
            >
              {loading ? t.verifyingButton[lang] : t.verifyButton[lang]}
            </button>
          </>
        )}

        {error && (
          <p style={{ color: "#F87171", fontSize: 13, marginTop: 12 }}>{error}</p>
        )}
      </div>
    </div>
  );
}
