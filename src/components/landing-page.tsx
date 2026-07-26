"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ChevronDown,
  LineChart,
  Target,
  Users,
  Sparkles,
  FileText,
  Search,
  Zap,
  Compass,
  Repeat,
} from "lucide-react";
import type { Lang } from "@/lib/config";
import { LANGS } from "@/lib/config";
import {
  BRAND_NAME,
  hero,
  whatItDoes,
  howItWorks,
  whyUseIt,
  finalCta,
  nav,
} from "@/lib/landing-content";
import { LoginForm } from "./login-form";

/**
 * Landing page pública de Ponexo (antes "Diagnóstico de Marketing").
 *
 * Deliberadamente separada de la identidad visual del wizard/panel interno
 * (jade/ámbar/hueso, ver lib/config.ts COLORS) -- esta es la puerta de
 * entrada pública, con la nueva marca oscura/premium pedida por Carlos
 * (brief en vault/1-desk, estilo Vercel/Linear/Stripe). El wizard y el
 * login (una vez que el usuario empieza su diagnóstico) se quedan con su
 * paleta clara actual, ya probada -- rediseñarlos es una tarea aparte.
 *
 * No hay imagen de fondo generada por IA en el hero: el "dashboard flotante"
 * del brief se construye con HTML/CSS real (más nítido, sin riesgo de
 * typos de IA en el texto, y más ligero de cargar).
 */

const CARD_ICONS = [Search, Target, LineChart, Users, Sparkles, FileText];
const STEP_ICONS = [Search, Compass, ArrowRight, Repeat];

export function LandingPage() {
  const [lang, setLang] = useState<Lang>("es");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const currentLang = LANGS.find((l) => l.code === lang)!;

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div style={{ background: "#090B0F", color: "#F2F5F7" }} className="min-h-dvh">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-[#222831] bg-[#090B0F]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Image src="/ponexo-logo.png" alt={BRAND_NAME} width={28} height={28} className="rounded-md" />
            <span className="text-lg font-semibold tracking-tight">{BRAND_NAME}</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setLangMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-[#222831] px-3 py-1.5 text-sm text-[#9BA4AE] transition-colors hover:border-[#3B82F6]/40 hover:text-[#F2F5F7]"
              aria-label={nav.langLabel[lang]}
            >
              <span>{currentLang.flag}</span>
              <span>{currentLang.code.toUpperCase()}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-lg border border-[#222831] bg-[#11151A] shadow-xl">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setLangMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[#222831] ${
                      l.code === lang ? "text-[#22D3EE]" : "text-[#9BA4AE]"
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-5 pb-24 pt-16 md:pt-24">
        {/* Grid de fondo muy sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow suave detrás del contenido */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 text-xs font-medium text-[#22D3EE]">
              <Sparkles className="h-3.5 w-3.5" />
              {hero.eyebrow[lang]}
            </span>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
              {hero.headline[lang]}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#9BA4AE] md:text-lg">
              {hero.subheadline[lang]}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => scrollTo("start")}
                className="flex items-center gap-2 rounded-lg bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3B82F6]/90"
              >
                {hero.ctaPrimary[lang]}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="rounded-lg border border-[#222831] px-5 py-3 text-sm font-semibold text-[#F2F5F7] transition-colors hover:border-[#3B82F6]/40"
              >
                {hero.ctaSecondary[lang]}
              </button>
            </div>
          </div>

          {/* Dashboard flotante — construido en HTML/CSS, no imagen generada */}
          <div className="relative hidden h-[420px] md:block">
            <FloatingCard className="left-4 top-2 w-64 rotate-[-3deg]">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#9BA4AE]">Marketing Score</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-[#F2F5F7]">78</span>
                <span className="text-xs text-[#22C55E]">▲ 12</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#222831]">
                <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#3B82F6] to-[#22D3EE]" />
              </div>
            </FloatingCard>

            <FloatingCard className="right-2 top-24 w-56 rotate-[2deg]">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#9BA4AE]">Growth signals</p>
              <div className="flex items-end gap-1.5 h-16">
                {[40, 65, 45, 80, 60, 95, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-[#3B82F6] to-[#22D3EE]"
                    style={{ height: `${h}%`, opacity: 0.5 + i * 0.07 }}
                  />
                ))}
              </div>
            </FloatingCard>

            <FloatingCard className="bottom-6 left-10 w-72 rotate-[1.5deg]">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#9BA4AE]">Diagnostic</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-[#F2F5F7]">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#22C55E]/20 text-[10px] text-[#22C55E]">✓</span>
                  Website reviewed
                </li>
                <li className="flex items-center gap-2 text-[#F2F5F7]">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#22C55E]/20 text-[10px] text-[#22C55E]">✓</span>
                  Competitors analyzed
                </li>
                <li className="flex items-center gap-2 text-[#9BA4AE]">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#3B82F6] text-[10px]" />
                  Strategy in progress
                </li>
              </ul>
            </FloatingCard>
          </div>
        </div>
      </section>

      {/* WHAT IT DOES */}
      <section className="border-t border-[#222831] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-lg">
            <h2 className="text-2xl font-bold md:text-3xl">{whatItDoes.title[lang]}</h2>
            <p className="mt-2 text-[#9BA4AE]">{whatItDoes.subtitle[lang]}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whatItDoes.cards.map((card, i) => {
              const Icon = CARD_ICONS[i % CARD_ICONS.length];
              return (
                <div
                  key={i}
                  className="rounded-xl border border-[#222831] bg-[#11151A] p-5 transition-colors hover:border-[#3B82F6]/30"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#22D3EE]">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="mb-1.5 font-semibold text-[#F2F5F7]">{card.title[lang]}</h3>
                  <p className="text-sm leading-relaxed text-[#9BA4AE]">{card.description[lang]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-t border-[#222831] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-2xl font-bold md:text-3xl">{howItWorks.title[lang]}</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.steps.map((step, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length];
              return (
                <div key={i} className="relative">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#22D3EE]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#9BA4AE]">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mb-1.5 text-lg font-semibold">{step.title[lang]}</h3>
                  <p className="text-sm leading-relaxed text-[#9BA4AE]">{step.description[lang]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="border-t border-[#222831] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-2xl font-bold md:text-3xl">{whyUseIt.title[lang]}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyUseIt.benefits.map((b, i) => (
              <div key={i}>
                <div className="mb-3 h-px w-8 bg-[#3B82F6]" />
                <h3 className="mb-1.5 font-semibold text-[#F2F5F7]">{b.title[lang]}</h3>
                <p className="text-sm leading-relaxed text-[#9BA4AE]">{b.description[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA + LOGIN */}
      <section id="start" className="border-t border-[#222831]">
        <LoginForm heading={finalCta.headline[lang]} subheading={finalCta.subheadline[lang]} />
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#222831] bg-[#090B0F] px-5 py-8 text-center text-xs text-[#9BA4AE]">
        © {new Date().getFullYear()} {BRAND_NAME}. Creativa Balam.
      </footer>
    </div>
  );
}

function FloatingCard({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div
      className={`absolute rounded-xl border border-[#222831] bg-[#11151A]/90 p-4 shadow-2xl backdrop-blur-sm ${className}`}
      style={{ boxShadow: "0 20px 60px -15px rgba(0,0,0,0.6)" }}
    >
      {children}
    </div>
  );
}
