import { NextResponse } from "next/server";

// Bot de dudas de Ponexo — proxya al Chat API self-hosted de Dify, mismo
// patrón que balam-website: la API key se queda solo del lado servidor
// (DIFY_PONEXO_CHAT_API_KEY, sin prefijo NEXT_PUBLIC_).
const DIFY_API_URL = "https://dify.tourbrain.creativabalam.com.mx/v1/chat-messages";

type ChatRequestBody = {
  message?: string;
  conversationId?: string;
  user?: string;
};

export async function POST(request: Request) {
  const { message, conversationId, user } =
    (await request.json()) as ChatRequestBody;

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "empty message" }, { status: 400 });
  }

  const apiKey = process.env.DIFY_PONEXO_CHAT_API_KEY;

  // Aun no configurada — se degrada sin romper el formulario.
  if (!apiKey) {
    return NextResponse.json({ configured: false });
  }

  try {
    const res = await fetch(DIFY_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: "blocking",
        conversation_id: conversationId || undefined,
        user: user || "ponexo-visitor",
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { configured: true, error: "upstream error" },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      answer?: string;
      conversation_id?: string;
    };

    return NextResponse.json({
      configured: true,
      answer: data.answer ?? "",
      conversationId: data.conversation_id,
    });
  } catch {
    return NextResponse.json(
      { configured: true, error: "network error" },
      { status: 502 },
    );
  }
}
