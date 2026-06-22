import { NextResponse } from "next/server";
import getAssistantReply from "@/lib/assistant";

export const dynamic = "force-dynamic";

// ======================
// AI SESSION STORE (DEV)
// ======================
const aiSession = new Map<number, boolean>();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = body.message;
    const chatId = message?.chat?.id;
    const userText = message?.text || "";

    if (!chatId || !userText) {
      return NextResponse.json({ ok: false });
    }

    const TELE_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    // const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
    const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID); 

    const text = userText.trim().toLowerCase();

    console.log("USER:", userText);

    // ======================
    // SEND FUNCTION
    // ======================
    async function send(chat_id: number, text: string) {
      await fetch(
        `https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text }),
        }
      );
    }

    // ======================
    // ADMIN MODE
    // ======================
    if (String(chatId) === String(ADMIN_CHAT_ID)) {
      const replyTo = message?.reply_to_message?.text || "";
      const match = replyTo.match(/MBG_FROM_USER:(\d+)/);

      if (match) {
        const targetChatId = match[1];

        await send(targetChatId, userText);
        return NextResponse.json({ status: "forwarded" });
      }
    }

    // ======================
    // EXIT AI MODE
    // ======================
    if (text === "menu" || text === "exit") {
      aiSession.delete(chatId);
    }

    // ======================
    // MENU 5 - ADMIN
    // ======================
    if (text === "5" || text.includes("admin")) {
      aiSession.delete(chatId);

      if (ADMIN_CHAT_ID) {
        await send(
          ADMIN_CHAT_ID,
          `MBG_FROM_USER:${chatId}\n\n${userText}`
        );
      }

      await send(chatId, "Permintaan Anda dikirim ke Admin.");
      return NextResponse.json({ ok: true });
    }

    // ======================
    // MENU 4 - AI MODE ON
    // ======================
    if (text === "4" || text.includes("ai")) {
      aiSession.set(chatId, true);

      const aiIntro = await getOpenRouterReply(
        "Sapa user sebagai AI MBG dan tanyakan kebutuhan mereka secara singkat."
      );

      await send(chatId, aiIntro);
      return NextResponse.json({ ok: true });
    }

    // ======================
    // AI CONTINUATION MODE
    // ======================
    if (aiSession.get(chatId)) {
      const aiReply = await getOpenRouterReply(userText);

      await send(chatId, aiReply);
      return NextResponse.json({ ok: true });
    }

    // ======================
    // NORMAL MODE (MENU BOT)
    // ======================
    const reply = await getAssistantReply(userText);

    await send(chatId, reply);

    return NextResponse.json({ ok: true });

    // ======================
    // OPENROUTER AI
    // ======================
    async function getOpenRouterReply(message: string) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) return "AI belum aktif.";

      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.1-8b-instruct",
            messages: [
              {
                role: "system",
                content:
                  "You are MBG assistant. Answer short, helpful, focus on food distribution & quality.",
              },
              { role: "user", content: message },
            ],
            max_tokens: 300,
          }),
        }
      );

      const data = await res.json();

      return (
        data?.choices?.[0]?.message?.content ||
        "AI tidak bisa menjawab."
      );
    }
  } catch (err) {
    console.error("TELEGRAM ERROR:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}