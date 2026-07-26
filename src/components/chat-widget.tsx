"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import type { Lang } from "@/lib/config";
import { chatWidget as t } from "@/lib/landing-content";

type Message = { role: "user" | "bot"; text: string };

/**
 * Widget de chat flotante -- solo se monta en la landing pública
 * (landing-page.tsx), nunca en /formulario ni /panel. Habla con
 * /api/chat (ya construido, proxya a Dify) -- si DIFY_PONEXO_CHAT_API_KEY
 * todavía no está configurada en Vercel, la API responde
 * {configured:false} y esto se degrada mostrando notConfigured en vez de
 * romper.
 */
export function ChatWidget({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId, user: "ponexo-visitor" }),
      });
      const data = await res.json();

      if (!data.configured) {
        setMessages((prev) => [...prev, { role: "bot", text: t.notConfigured[lang] }]);
      } else if (data.error) {
        setMessages((prev) => [...prev, { role: "bot", text: t.errorGeneric[lang] }]);
      } else {
        if (data.conversationId) setConversationId(data.conversationId);
        setMessages((prev) => [...prev, { role: "bot", text: data.answer || t.errorGeneric[lang] }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: t.errorGeneric[lang] }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-[#222831] bg-[#11151A] shadow-2xl"
          style={{
            // El botón vive en bottom:6rem (arriba de la barra de puntos y
            // el crédito "by Creativa Balam", que también están abajo a la
            // izquierda) -- el panel abre todavía más arriba que el botón.
            bottom: "calc(10.5rem + env(safe-area-inset-bottom))",
            left: "calc(1.25rem + env(safe-area-inset-left))",
            width: "min(340px, calc(100vw - 2.5rem))",
            height: 420,
            maxHeight: "55vh",
          }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[#222831] px-4 py-3">
            <span className="text-sm font-semibold text-[#F2F5F7]">{t.title[lang]}</span>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-[#9BA4AE] hover:text-[#F2F5F7]">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
            <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-[#090B0F] px-3 py-2 text-sm text-[#F2F5F7]">
              {t.welcome[lang]}
            </div>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto rounded-tr-sm bg-[#3B82F6] text-white"
                    : "rounded-tl-sm bg-[#090B0F] text-[#F2F5F7]"
                }`}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-[#090B0F] px-3 py-2 text-sm text-[#9BA4AE]">
                ···
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-[#222831] p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t.placeholder[lang]}
              className="min-w-0 flex-1 rounded-lg border border-[#222831] bg-[#090B0F] px-3 py-2 text-sm text-[#F2F5F7] outline-none placeholder:text-[#9BA4AE]/60 focus:border-[#3B82F6]/50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6] text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t.title[lang]}
        className="fixed z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/45 text-[#0B0D10] shadow-lg backdrop-blur-xl transition-transform hover:scale-105 active:scale-95"
        style={{
          // Arriba de la barra de puntos/crédito (que también están abajo a
          // la izquierda) para no encimarse -- el CTA "Iniciar mi
          // diagnóstico" es el único botón fijo que sí vive en bottom:1.5rem,
          // del lado derecho.
          bottom: "calc(6rem + env(safe-area-inset-bottom))",
          left: "calc(1.25rem + env(safe-area-inset-left))",
        }}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </>
  );
}
