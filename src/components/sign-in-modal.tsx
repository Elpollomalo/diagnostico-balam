"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lang } from "@/lib/config";
import { loginForm as t, signIn as s } from "@/lib/landing-content";

type Step = "email" | "otp";
type ErrorKind = "" | "invalidEmail" | "notRegistered" | "sendFailed" | "invalidOtp" | "verifyFailed";

/**
 * Modal de "Iniciar sesión" del header de la landing -- para quien YA se
 * registró antes (a diferencia del LoginForm embebido en la última pantalla,
 * que es el registro en sí y sí crea cuentas nuevas). Aquí se usa
 * shouldCreateUser:false a propósito: un correo sin cuenta debe rechazarse
 * con un mensaje + enlace a registrarse, no crear una cuenta silenciosa.
 */
export function SignInModal({
  lang,
  onClose,
  onGoToRegister,
}: {
  lang: Lang;
  onClose: () => void;
  onGoToRegister: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorKind>("");

  async function handleSendOtp() {
    setError("");
    if (!email || !email.includes("@")) {
      setError("invalidEmail");
      return;
    }
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (otpError) {
      // shouldCreateUser:false falla precisamente cuando el correo no tiene
      // cuenta -- es el caso dominante de error en este flujo, así que se
      // trata como "no registrado" (con su enlace a registro) en vez de un
      // error genérico.
      setError("notRegistered");
      return;
    }
    setStep("otp");
  }

  async function handleVerifyOtp() {
    setError("");
    if (!code || code.length < 6) {
      setError("invalidOtp");
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
      setError("verifyFailed");
      return;
    }
    router.push("/formulario");
  }

  const errorText: Record<Exclude<ErrorKind, "">, string> = {
    invalidEmail: t.errorInvalidEmail[lang],
    notRegistered: s.errorNotRegistered[lang],
    sendFailed: t.errorSendFailed[lang],
    invalidOtp: t.errorInvalidOtp[lang],
    verifyFailed: t.errorVerifyFailed[lang],
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[#222831] bg-[#11151A] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#F2F5F7]">{s.title[lang]}</h2>
            <p className="mt-1 text-sm text-[#9BA4AE]">{s.subtitle[lang]}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={s.close[lang]}
            className="shrink-0 text-[#9BA4AE] transition-colors hover:text-[#F2F5F7]"
          >
            ✕
          </button>
        </div>

        {step === "email" && (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder[lang]}
              autoFocus
              className="mb-3 w-full rounded-lg border border-[#222831] bg-[#090B0F] px-3.5 py-2.5 text-sm text-[#F2F5F7] outline-none placeholder:text-[#9BA4AE]/60 focus:border-[#3B82F6]/50"
            />
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full rounded-lg bg-[#3B82F6] py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {loading ? t.sendingButton[lang] : t.sendButton[lang]}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <p className="mb-3 text-xs text-[#9BA4AE]">
              {t.otpSubtitle[lang]} {email}
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t.otpPlaceholder[lang]}
              maxLength={6}
              autoFocus
              className="mb-3 w-full rounded-lg border border-[#222831] bg-[#090B0F] px-3.5 py-2.5 text-sm text-[#F2F5F7] outline-none placeholder:text-[#9BA4AE]/60 focus:border-[#3B82F6]/50"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full rounded-lg bg-[#3B82F6] py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {loading ? t.verifyingButton[lang] : t.verifyButton[lang]}
            </button>
          </>
        )}

        {error && (
          <div className="mt-3 text-xs text-[#F87171]">
            {errorText[error]}
            {error === "notRegistered" && (
              <>
                {" "}
                <button
                  onClick={onGoToRegister}
                  className="font-semibold text-[#22D3EE] underline underline-offset-2"
                >
                  {s.registerLink[lang]}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
