"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LineChart,
  Target,
  Users,
  Sparkles,
  FileText,
  Search,
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
  swipeHint,
} from "@/lib/landing-content";
import { LoginForm } from "./login-form";

/**
 * Landing page pública de Ponexo — navegación tipo app, no scroll web normal.
 *
 * 26 julio 2026: Carlos pidió convertirla en pantallas completas deslizables
 * (como un onboarding de app móvil), no un scroll continuo. Cada sección es
 * su propia "pantalla" a ancho completo; se navega deslizando el dedo
 * (horizontal), con los puntos/flechas como alternativa para quien no
 * desliza. El botón "Start your diagnostic" queda fijo y siempre visible,
 * para saltar directo al formulario sin recorrer las demás pantallas.
 *
 * Paleta oscura premium separada del wizard/panel interno (jade/ámbar/hueso,
 * ver lib/config.ts COLORS) -- son identidades visuales deliberadamente
 * distintas, ver vault/sources/diagnostico-balam/marca/README.md.
 */

const CARD_ICONS = [Search, Target, LineChart, Users, Sparkles, FileText];
const STEP_ICONS = [Search, Compass, ArrowRight, Repeat];
const SWIPE_THRESHOLD_PX = 60;

export function LandingPage() {
  const [lang, setLang] = useState<Lang>("es");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [screen, setScreen] = useState(0);
  const currentLang = LANGS.find((l) => l.code === lang)!;

  const TOTAL_SCREENS = 5; // hero, what-it-does, how-it-works, why, login
  const dragStartX = useRef<number | null>(null);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);

  function goTo(index: number) {
    setScreen(Math.max(0, Math.min(TOTAL_SCREENS - 1, index)));
  }

  function handleTouchStart(e: React.TouchEvent) {
    dragStartX.current = e.touches[0].clientX;
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (dragStartX.current === null) return;
    let delta = e.touches[0].clientX - dragStartX.current;
    // Resistencia tipo "rubber band" en los extremos -- sin esto, arrastrar
    // más allá de la primera/última pantalla dejaba un hueco suelto (el
    // "juego" que reportó Carlos), en vez de sentirse como un límite real.
    const atFirstScreen = screen === 0 && delta > 0;
    const atLastScreen = screen === TOTAL_SCREENS - 1 && delta < 0;
    if (atFirstScreen || atLastScreen) {
      delta = delta * 0.3;
    }
    setDragOffsetPx(delta);
  }
  function handleTouchEnd() {
    if (Math.abs(dragOffsetPx) > SWIPE_THRESHOLD_PX) {
      goTo(dragOffsetPx < 0 ? screen + 1 : screen - 1);
    }
    setDragOffsetPx(0);
    dragStartX.current = null;
  }

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: "#090B0F", color: "#F2F5F7", overscrollBehavior: "none" }}
    >
      {/* NAV — fijo arriba, encima de las pantallas */}
      <header className="z-40 flex shrink-0 items-center justify-between border-b border-[#222831] bg-[#090B0F]/90 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Image src="/ponexo-logo.png" alt={BRAND_NAME} width={26} height={26} className="rounded-md" />
          <span className="text-base font-semibold tracking-tight">{BRAND_NAME}</span>
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
      </header>

      {/* PANTALLAS — carrusel horizontal a pantalla completa */}
      <div
        className="relative flex-1 touch-pan-y overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full"
          style={{
            width: `${TOTAL_SCREENS * 100}%`,
            transform: `translateX(calc(${-screen * (100 / TOTAL_SCREENS)}% + ${dragOffsetPx}px))`,
            transition: dragOffsetPx ? "none" : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <Screen>
            <HeroScreen lang={lang} showHint={screen === 0} onSeeHowItWorks={() => goTo(2)} />
          </Screen>
          <Screen>
            <WhatItDoesScreen lang={lang} />
          </Screen>
          <Screen>
            <HowItWorksScreen lang={lang} />
          </Screen>
          <Screen>
            <WhyScreen lang={lang} />
          </Screen>
          <Screen padded={false}>
            <LoginForm heading={finalCta.headline[lang]} subheading={finalCta.subheadline[lang]} lang={lang} />
          </Screen>
        </div>

        {/* Flechas (desktop / alternativa a deslizar) */}
        {screen > 0 && (
          <button
            onClick={() => goTo(screen - 1)}
            aria-label="Previous"
            className="absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full border border-[#222831] bg-[#11151A]/80 p-2 text-[#F2F5F7] backdrop-blur-sm transition-colors hover:border-[#3B82F6]/40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {screen < TOTAL_SCREENS - 1 && (
          <button
            onClick={() => goTo(screen + 1)}
            aria-label="Next"
            className="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full border border-[#222831] bg-[#11151A]/80 p-2 text-[#F2F5F7] backdrop-blur-sm transition-colors hover:border-[#3B82F6]/40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Puntos de paginación */}
        <div className="absolute bottom-[92px] left-1/2 z-30 flex -translate-x-1/2 gap-2">
          {Array.from({ length: TOTAL_SCREENS }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`${nav.langLabel[lang]} ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === screen ? "w-6 bg-[#3B82F6]" : "w-1.5 bg-[#9BA4AE]/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* BOTÓN FLOTANTE FIJO — salta directo al formulario desde cualquier pantalla.
          Forma asimétrica a propósito: redondo del lado izquierdo, más
          cuadrado (con un leve redondeo) del lado derecho -- como una
          "caja de flujo" que sugiere dirección hacia la flecha. Brillo
          pulsante debajo (animate-cta-glow, ver globals.css). */}
      {screen < TOTAL_SCREENS - 1 && (
        <button
          onClick={() => goTo(TOTAL_SCREENS - 1)}
          className="animate-cta-glow fixed bottom-6 right-5 z-40 flex items-center gap-2 bg-white px-6 py-3.5 text-sm font-semibold text-[#0B0D10] transition-transform hover:scale-[1.03] active:scale-[0.97]"
          style={{ borderRadius: "999px 12px 12px 999px" }}
        >
          {hero.ctaPrimary[lang]}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}

      {/* Crédito -- esquina inferior izquierda, discreto pero siempre visible */}
      <div className="pointer-events-none fixed bottom-6 left-5 z-30 text-[11px] text-[#9BA4AE]">
        by Creativa Balam
      </div>
    </div>
  );
}

function Screen({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <div className="h-full shrink-0 overflow-y-auto" style={{ width: `${100 / 5}%` }}>
      <div className={`mx-auto flex min-h-full max-w-3xl flex-col justify-center ${padded ? "px-6 py-16 pb-32" : ""}`}>
        {children}
      </div>
    </div>
  );
}

function HeroScreen({
  lang,
  showHint,
  onSeeHowItWorks,
}: {
  lang: Lang;
  showHint: boolean;
  onSeeHowItWorks: () => void;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-32 h-[420px] w-[420px] rounded-full opacity-20 blur-[100px]"
        style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }}
      />
      <span className="relative mb-5 inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 text-xs font-medium text-[#22D3EE]">
        <Sparkles className="h-3.5 w-3.5" />
        {hero.eyebrow[lang]}
      </span>
      <h1 className="relative text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
        {hero.headline[lang]}
      </h1>
      <p className="relative mt-5 max-w-md text-base leading-relaxed text-[#9BA4AE] md:text-lg">
        {hero.subheadline[lang]}
      </p>
      <button
        onClick={onSeeHowItWorks}
        className="relative mt-6 flex items-center gap-1.5 text-sm font-medium text-[#F2F5F7] underline decoration-[#3B82F6]/50 underline-offset-4 transition-colors hover:text-[#22D3EE]"
      >
        {hero.ctaSecondary[lang]}
      </button>

      <div className="relative mt-10 h-[220px] max-w-md">
        <FloatingCard className="left-0 top-0 w-56 rotate-[-3deg]">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#9BA4AE]">Marketing Score</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-[#F2F5F7]">78</span>
            <span className="text-xs text-[#22C55E]">▲ 12</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#222831]">
            <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#3B82F6] to-[#22D3EE]" />
          </div>
        </FloatingCard>

        <FloatingCard className="right-0 top-10 w-48 rotate-[2deg]">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#9BA4AE]">Growth</p>
          <div className="flex h-14 items-end gap-1.5">
            {[40, 65, 45, 80, 60, 95, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-t from-[#3B82F6] to-[#22D3EE]"
                style={{ height: `${h}%`, opacity: 0.5 + i * 0.07 }}
              />
            ))}
          </div>
        </FloatingCard>
      </div>

      {showHint && (
        <div className="relative mt-10 flex items-center gap-2 text-xs font-medium text-[#9BA4AE]">
          <span>{swipeHint[lang]}</span>
          <span className="inline-flex">
            <ChevronRight className="h-3.5 w-3.5 animate-swipe-hint" style={{ animationDelay: "0ms" }} />
            <ChevronRight className="-ml-2 h-3.5 w-3.5 animate-swipe-hint" style={{ animationDelay: "150ms" }} />
          </span>
        </div>
      )}
    </div>
  );
}

function WhatItDoesScreen({ lang }: { lang: Lang }) {
  return (
    <div>
      <h2 className="text-2xl font-bold md:text-3xl">{whatItDoes.title[lang]}</h2>
      <p className="mt-2 text-[#9BA4AE]">{whatItDoes.subtitle[lang]}</p>
      <div className="mt-8 grid gap-3.5 sm:grid-cols-2">
        {whatItDoes.cards.map((card, i) => {
          const Icon = CARD_ICONS[i % CARD_ICONS.length];
          return (
            <div key={i} className="rounded-xl border border-[#222831] bg-[#11151A] p-4">
              <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#22D3EE]">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-[#F2F5F7]">{card.title[lang]}</h3>
              <p className="text-xs leading-relaxed text-[#9BA4AE]">{card.description[lang]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HowItWorksScreen({ lang }: { lang: Lang }) {
  return (
    <div>
      <h2 className="mb-8 text-2xl font-bold md:text-3xl">{howItWorks.title[lang]}</h2>
      <div className="space-y-6">
        {howItWorks.steps.map((step, i) => {
          const Icon = STEP_ICONS[i % STEP_ICONS.length];
          return (
            <div key={i} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#22D3EE]">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9BA4AE]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mb-1 text-lg font-semibold">{step.title[lang]}</h3>
                <p className="text-sm leading-relaxed text-[#9BA4AE]">{step.description[lang]}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WhyScreen({ lang }: { lang: Lang }) {
  return (
    <div>
      <h2 className="mb-8 text-2xl font-bold md:text-3xl">{whyUseIt.title[lang]}</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {whyUseIt.benefits.map((b, i) => (
          <div key={i}>
            <div className="mb-3 h-px w-8 bg-[#3B82F6]" />
            <h3 className="mb-1.5 font-semibold text-[#F2F5F7]">{b.title[lang]}</h3>
            <p className="text-sm leading-relaxed text-[#9BA4AE]">{b.description[lang]}</p>
          </div>
        ))}
      </div>
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
