"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  containerStyle,
  inputStyle,
  primaryButtonStyle,
  introTitleStyle,
  introSubtitleStyle,
} from "@/lib/styles";
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
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F8F6F2", padding: 24 }}>
      {heading && (
        <div style={{ textAlign: "center", maxWidth: 560, marginBottom: 28 }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 800, color: "#1A1A1A", marginBottom: 10 }}>
            {heading}
          </h2>
          {subheading && (
            <p style={{ fontSize: 16, color: "#6B6B6B" }}>{subheading}</p>
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
              disabled={loading}
            >
              {loading ? t.verifyingButton[lang] : t.verifyButton[lang]}
            </button>
          </>
        )}

        {error && (
          <p style={{ color: "#C0392B", fontSize: 13, marginTop: 12 }}>{error}</p>
        )}
      </div>
    </div>
  );
}
