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

type Step = "email" | "otp";

interface LoginFormProps {
  /** Encabezado opcional mostrado arriba de la tarjeta (usado por la landing pública). */
  heading?: string;
  subheading?: string;
}

export function LoginForm({ heading, subheading }: LoginFormProps = {}) {
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
      setError("Ingresa un correo válido");
      return;
    }
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (otpError) {
      setError("No se pudo enviar el código. Intenta de nuevo.");
      return;
    }
    setStep("otp");
  }

  async function handleVerifyOtp() {
    setError("");
    if (!code || code.length < 6) {
      setError("Ingresa el código de 6 dígitos");
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
      setError("Código incorrecto o expirado");
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F8F6F2", padding: 24 }}>
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
          {step === "email" ? "Ingresa tu correo" : "Ingresa el código"}
        </div>
        {step === "otp" && (
          <p style={introSubtitleStyle}>Lo enviamos a {email}</p>
        )}

        {step === "email" && (
          <>
            <input
              style={{ ...inputStyle, marginBottom: 12 }}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              autoFocus
            />
            <button
              style={{ ...primaryButtonStyle, width: "100%", opacity: loading ? 0.6 : 1 }}
              onClick={handleSendOtp}
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar código"}
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
              placeholder="123456"
              maxLength={6}
              autoFocus
            />
            <button
              style={{ ...primaryButtonStyle, width: "100%", opacity: loading ? 0.6 : 1 }}
              onClick={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? "Verificando..." : "Verificar"}
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
