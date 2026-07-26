"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ChevronDown,
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
} from "@/lib/landing-content";
import { LoginForm } from "./login-form";

/**
 * Landing page pública de Ponexo — navegación tipo app, pantallas completas.
 *
 * 26 julio 2026: REDISEÑO completo (no parche) tras varios intentos fallidos
 * con un carrusel manual (translateX + touch tracking a mano) que terminaba
 * en layout roto (pantallas apiladas verticalmente en vez de una por una).
 *
 * Este rediseño usa scroll-snap NATIVO del navegador en vez de JS manual:
 * - overflow-x-auto + snap-x snap-mandatory + snap-start en cada pantalla.
 * - El navegador maneja el gesto de deslizar, el rebote en los bordes y el
 *   "enganche" a cada pantalla -- nada de eso se calcula a mano, por eso no
 *   hay "juego" ni desalineación.
 * - La pantalla actual se detecta escuchando el evento 'scroll' nativo
 *   (scrollLeft / ancho = índice), y navegar por botón/punto simplemente
 *   llama scrollTo() -- el navegador anima el resto.
 */

const CARD_ICONS = [Search, Target, LineChart, Users, Sparkles, FileText];
const STEP_ICONS = [Search, Compass, ArrowRight, Repeat];
const TOTAL_SCREENS = 5; // hero, what-it-does, how-it-works, why, login

export function LandingPage() {
  const [lang, setLang] = useState<Lang>("es");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [screen, setScreen] = useState(0);
  const currentLang = LANGS.find((l) => l.code === lang)!;
  const scrollerRef = useRef<HTMLDivElement>(null);

  function goTo(index: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(TOTAL_SCREENS - 1, index));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setScreen(idx);
  }

  // Si la ventana cambia de tamaño (rotar el teléfono, teclado abre/cierra),
  // recalcular la posición para seguir alineado con la pantalla actual --
  // scrollLeft en px queda obsoleto si el ancho cambió.
  useEffect(() => {
    function onResize() {
      goTo(screen);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#090B0F", color: "#F2F5F7" }}>
      {/* NAV */}
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

      {/* PANTALLAS — scroll-snap horizontal nativo */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="scrollbar-none flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
      >
        <ScreenWrap padding="tight">
          <HeroScreen lang={lang} onSeeHowItWorks={() => goTo(2)} />
        </ScreenWrap>
        <ScreenWrap>
          <WhatItDoesScreen lang={lang} />
        </ScreenWrap>
        <ScreenWrap>
          <HowItWorksScreen lang={lang} />
        </ScreenWrap>
        <ScreenWrap>
          <WhyScreen lang={lang} />
        </ScreenWrap>
        <ScreenWrap padding="none" background="#F8F6F2">
          <LoginForm heading={finalCta.headline[lang]} subheading={finalCta.subheadline[lang]} lang={lang} />
        </ScreenWrap>
      </div>

      {/* Puntos de paginación -- clic para saltar directo a esa pantalla.
          paddingBottom con safe-area-inset: en un wrapper nativo (WebView)
          o PWA a pantalla completa, esto evita quedar tapado por el home
          indicator de iOS. */}
      <div
        className="z-30 flex shrink-0 items-center justify-center gap-2 bg-[#090B0F] pt-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >

        {Array.from({ length: TOTAL_SCREENS }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`${i + 1}/${TOTAL_SCREENS}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === screen ? "w-6 bg-[#3B82F6]" : "w-1.5 bg-[#9BA4AE]/40"
            }`}
          />
        ))}
      </div>

      {/* Flecha "siguiente" -- grande y clara, la indicación real de avanzar.
          No aparece en la última pantalla (ya no hay a dónde avanzar). */}
      {screen < TOTAL_SCREENS - 1 && (
        <button
          onClick={() => goTo(screen + 1)}
          aria-label="Next screen"
          className="fixed right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[#3B82F6]/40 bg-[#11151A] text-[#F2F5F7] shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Botón flotante fijo -- salta directo al formulario. Brillo del
          color de marca (azul/cyan del logo), no blanco. */}
      {screen < TOTAL_SCREENS - 1 && (
        <button
          onClick={() => goTo(TOTAL_SCREENS - 1)}
          className="animate-cta-glow fixed right-5 z-40 flex items-center gap-2 bg-white px-6 py-3.5 text-sm font-semibold text-[#0B0D10] transition-transform hover:scale-[1.03] active:scale-[0.97]"
          style={{ borderRadius: "12px 999px 999px 12px", bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        >
          {hero.ctaPrimary[lang]}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}

      {/* Crédito */}
      <div
        className="pointer-events-none fixed left-5 z-30 text-[11px] text-[#9BA4AE]"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        by Creativa Balam
      </div>
    </div>
  );
}

const SCREEN_PADDING = {
  normal: "px-6 py-14 pb-10",
  // Pantalla del héroe: contenido más corto, menos margen para que quepa
  // completa sin scroll interno (pedido explícito de Carlos).
  tight: "px-6 py-6 pb-4",
  none: "",
};

function ScreenWrap({
  children,
  padding = "normal",
  background,
}: {
  children: React.ReactNode;
  padding?: keyof typeof SCREEN_PADDING;
  /** Fondo propio de esta pantalla -- si no se pasa, se ve el fondo oscuro
      del contenedor raíz (comportamiento normal de la landing). La pantalla
      de login lo usa para ser blanca de borde a borde, sin franjas oscuras
      arriba/abajo del formulario. */
  background?: string;
}) {
  return (
    <div className="h-full w-full shrink-0 snap-start overflow-y-auto" style={background ? { background } : undefined}>
      <div className={`mx-auto flex min-h-full max-w-3xl flex-col justify-center ${SCREEN_PADDING[padding]}`}>
        {children}
      </div>
    </div>
  );
}

function HeroScreen({ lang, onSeeHowItWorks }: { lang: Lang; onSeeHowItWorks: () => void }) {
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

      <div className="relative mt-6 h-[190px] max-w-md">
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
