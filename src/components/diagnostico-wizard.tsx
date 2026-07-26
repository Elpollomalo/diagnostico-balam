"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ALL_STEPS,
  BLOCKS,
  LANGS,
  Q,
  UI,
  type Lang,
  type LangText,
} from "@/lib/config";
import { isStepValid } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { StepField } from "@/components/step-field";
import {
  containerStyle,
  badgeStyle,
  introTitleStyle,
  introSubtitleStyle,
  introBoxStyle,
  introListStyle,
  langButtonStyle,
  progressTrackStyle,
  progressFillStyle,
  blockLabelStyle,
  questionStyle,
  subtitleSmallStyle,
  navRowStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "@/lib/styles";

type Answers = Record<string, unknown>;

// Calcula en qué pregunta retomar un borrador: la primera que no tenga una
// respuesta válida (respeta las ramas condicionales showIf, igual que el
// resto del wizard). Si por algún motivo ya todo es válido, se queda en la
// última para que el usuario revise antes de terminar.
function resumeStepPos(answers: Answers): number {
  const steps = ALL_STEPS.filter((s) => !s.showIf || s.showIf(answers));
  const idx = steps.findIndex((s) => !isStepValid(s, answers));
  return idx === -1 ? Math.max(steps.length - 1, 0) : idx;
}

export function DiagnosticoWizard({
  userId,
  userEmail,
  initialAnswers = null,
  initialLang = null,
}: {
  userId: string;
  userEmail: string;
  /** Respuestas de un borrador previo (completado: false) -- si vienen, se
      retoma el formulario en la primera pregunta sin responder en vez de
      empezar desde cero. */
  initialAnswers?: Answers | null;
  initialLang?: Lang | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const hasDraft = !!initialAnswers && Object.keys(initialAnswers).length > 0;
  const [lang, setLang] = useState<Lang | null>(initialLang);
  const [started, setStarted] = useState(hasDraft);
  const [stepPos, setStepPos] = useState(() => (hasDraft ? resumeStepPos(initialAnswers!) : 0));
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {});
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const logoutBar = (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto 12px",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <button
        onClick={handleSignOut}
        style={{ background: "none", border: "none", color: "#6B6B6B", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
      >
        {UI.logoutButton[lang ?? "es"]}
      </button>
    </div>
  );

  if (!lang) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", background: "#F8F6F2", padding: 24 }}>
        {logoutBar}
        <div style={containerStyle}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
              {UI.langScreenTitle.es} / {UI.langScreenTitle.en} / {UI.langScreenTitle.zh} / {UI.langScreenTitle.hi}
            </div>
            <p style={{ ...introSubtitleStyle, marginBottom: 4 }}>{UI.langScreenSubtitle.es}</p>
            <p style={{ ...introSubtitleStyle, marginBottom: 20 }}>{UI.langScreenSubtitle.en}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {LANGS.map((l) => (
                <div key={l.code} style={langButtonStyle} onClick={() => setLang(l.code)}>
                  <span style={{ fontSize: 20, marginRight: 10 }}>{l.flag}</span>
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const t = (obj: LangText) => obj[lang];
  const setAnswer = (id: string, value: unknown) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const activeSteps = ALL_STEPS.filter((s) => !s.showIf || s.showIf(answers));
  const step = activeSteps[stepPos];
  const progress = ((stepPos + 1) / activeSteps.length) * 100;
  const qText = step ? Q[step.id] : null;

  function handleFileChange(f: File | null) {
    if (!f) return;
    const maxBytes = (step?.maxSizeMB || 10) * 1024 * 1024;
    if (f.size > maxBytes) {
      setFileError(t(UI.fileTooLarge));
      return;
    }
    setFileError("");
    setFile(f);
  }

  async function goNext() {
    if (stepPos < activeSteps.length - 1) {
      setStepPos(stepPos + 1);
      // Autoguardado silencioso del borrador -- si falla no interrumpe el
      // avance ni muestra error (solo importa de verdad al enviar el
      // formulario completo). Esto es lo que permite retomar el formulario
      // en /formulario si el usuario sale a medias.
      supabase
        .from("diagnosticos")
        .upsert(
          {
            user_id: userId,
            correo: userEmail,
            idioma: lang,
            respuestas: answers,
            completado: false,
          },
          { onConflict: "user_id" },
        )
        .then(() => {});
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      let documentoAdicional: { name: string; path: string } | null = null;
      if (file) {
        const path = `${userId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("diagnostico-documentos")
          .upload(path, file);
        if (!uploadError) {
          documentoAdicional = { name: file.name, path };
        }
      }

      const respuestas = { ...answers };
      if (documentoAdicional) {
        // Si no se subió un archivo nuevo en esta sesión, se conserva el que
        // ya estuviera en las respuestas (de un borrador anterior) en vez de
        // borrarlo -- antes se eliminaba aunque ya existiera uno guardado.
        respuestas.documentoAdicional = documentoAdicional;
      }

      const { error: dbError } = await supabase.from("diagnosticos").upsert(
        {
          user_id: userId,
          correo: userEmail,
          idioma: lang,
          respuestas,
          telefono_contacto: (answers.telefonoContacto as string) || null,
          quiere_revision: answers.quiereRevision === "yes",
          completado: true,
        },
        { onConflict: "user_id" },
      );

      if (dbError) throw dbError;

      // Dispara el webhook de n8n si ya está configurado — si no, no rompe nada.
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: userEmail,
          idioma: lang,
          respuestas,
        }),
      }).catch(() => {});

      setSubmitted(true);
    } catch {
      setSubmitError(t(UI.submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBack() {
    if (stepPos > 0) setStepPos(stepPos - 1);
  }

  if (!started) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", background: "#F8F6F2", padding: 24 }}>
        {logoutBar}
        <div style={containerStyle}>
          <div style={badgeStyle}>{t(UI.badgeFree)}</div>
          <div style={introTitleStyle}>{t(UI.introTitle)}</div>
          <p style={introSubtitleStyle}>{t(UI.introP1)}</p>
          <p style={introSubtitleStyle}>{t(UI.introP2)}</p>
          <p style={introSubtitleStyle}>{t(UI.introP3)}</p>

          <div style={introBoxStyle}>
            <strong>{t(UI.expectTitle)}</strong>
            <ul style={introListStyle}>
              {UI.expectList[lang].map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div style={introBoxStyle}>
            <strong>{t(UI.safeTitle)}</strong>
            <ul style={introListStyle}>
              {UI.safeList[lang].map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <button style={primaryButtonStyle} onClick={() => setStarted(true)}>
            {t(UI.startButton)}
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", background: "#F8F6F2", padding: 24 }}>
        {logoutBar}
        <div style={containerStyle}>
          <div style={badgeStyle}>{t(UI.doneBadge)}</div>
          <div style={introTitleStyle}>{t(UI.doneTitle)}</div>
          <p style={introSubtitleStyle}>{t(UI.doneP1)}</p>
          <p style={introSubtitleStyle}>{t(UI.doneP2)}</p>
          {answers.quiereRevision === "yes" && (
            <p style={introSubtitleStyle}>{t(UI.doneP3)}</p>
          )}
          <p style={introSubtitleStyle}>{t(UI.doneP4)}</p>
          <Link
            href="/panel"
            style={{ fontSize: 13, color: "#1B4D3E", display: "inline-block", marginTop: 8 }}
          >
            Ver o editar mis respuestas →
          </Link>
        </div>
      </div>
    );
  }

  const valid = isStepValid(step, answers);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", background: "#F8F6F2", padding: 24 }}>
      {logoutBar}
      <div style={containerStyle}>
        <div style={progressTrackStyle}>
          <div style={{ ...progressFillStyle, width: `${progress}%` }} />
        </div>
        {step.blockKey && <div style={blockLabelStyle}>{t(BLOCKS[step.blockKey])}</div>}

        <div style={questionStyle}>{t(qText!.question)}</div>
        {qText!.subtitle && <p style={subtitleSmallStyle}>{t(qText!.subtitle)}</p>}

        <div style={{ marginTop: 20, marginBottom: 28 }}>
          <StepField
            step={step}
            lang={lang}
            answers={answers}
            setAnswer={setAnswer}
            onFileChange={handleFileChange}
            fileError={fileError}
            existingFileName={file?.name}
          />
        </div>

        <div style={navRowStyle}>
          {stepPos > 0 && !isSubmitting ? (
            <button style={secondaryButtonStyle} onClick={goBack}>
              {t(UI.backButton)}
            </button>
          ) : (
            <div />
          )}
          <button
            style={
              valid && !isSubmitting
                ? primaryButtonStyle
                : { ...primaryButtonStyle, opacity: 0.5, cursor: "default" }
            }
            onClick={() => valid && !isSubmitting && goNext()}
          >
            {isSubmitting
              ? t(UI.submitting)
              : stepPos === activeSteps.length - 1
                ? t(UI.submitButton)
                : t(UI.nextButton)}
          </button>
        </div>
        {submitError && (
          <div style={{ color: "#C0392B", fontSize: 12, marginTop: 10, textAlign: "right" }}>
            {submitError}
          </div>
        )}
      </div>
    </div>
  );
}
