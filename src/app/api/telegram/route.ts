import { NextResponse } from "next/server";
import getAssistantReply from "@/lib/assistant";

export const dynamic = "force-dynamic";

const aiSession = new Map<number, boolean>();

export async function POST(req: Request) {
  try {
    console.log("STEP 0 - WEBHOOK HIT");

    const body = await req.json();

    const message = body?.message;
    const chatId = message?.chat?.id;
    const userText = message?.text || "";

    if (!chatId || !userText) {
      console.log("NO CHAT OR TEXT");
      return NextResponse.json({ ok: false });
    }

    console.log("USER:", userText);

    const TELE_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID);

    if (!TELE_TOKEN) {
      throw new Error("TELEGRAM TOKEN MISSING");
    }

    // ======================
    // SEND FUNCTION (SAFE)
    // ======================
    async function send(chat_id: number, text: string) {
      try {
        console.log("SEND TO:", chat_id);

        const res = await fetch(
          `https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id, text }),
          }
        );

        const data = await res.json();
        console.log("TG RESPONSE:", data);

        return data;
      } catch (err) {
        console.error("SEND ERROR:", err);
      }
    }

    // ======================
    // EXIT AI MODE
    // ======================
    if (userText.toLowerCase() === "menu") {
      aiSession.delete(chatId);
      await send(chatId, "Keluar dari AI mode. Silakan pilih menu.");
      return NextResponse.json({ ok: true });
    }

    // ======================
    // ADMIN MODE
    // ======================
    if (chatId === ADMIN_CHAT_ID) {
      const replyTo = message?.reply_to_message?.text || "";
      const match = replyTo.match(/MBG_FROM_USER:(\d+)/);

      if (match) {
        await send(Number(match[1]), userText);
        return NextResponse.json({ ok: true });
      }
    }

    // ======================
    // MENU 5 - ADMIN REQUEST
    // ======================
    if (
      userText === "5" ||
      userText.toLowerCase().includes("admin")
    ) {
      aiSession.delete(chatId);

      if (ADMIN_CHAT_ID) {
        await send(
          ADMIN_CHAT_ID,
          `MBG_FROM_USER:${chatId}\n\n${userText}`
        );
      }

      await send(chatId, "Permintaan dikirim ke admin.");
      return NextResponse.json({ ok: true });
    }

    // ======================
    // MENU 4 - AI MODE ON
    // ======================
    if (
      userText === "4" ||
      userText.toLowerCase().includes("ai")
    ) {
      aiSession.set(chatId, true);

      const intro = await getOpenRouterReply(
        "Sapa user sebagai AI MBG secara singkat dan ramah"
      );

      await send(chatId, intro);
      return NextResponse.json({ ok: true });
    }

    // ======================
    // AI CONTINUATION MODE
    // ======================
    if (aiSession.get(chatId)) {
      console.log("AI MODE ACTIVE");

      const aiReply = await getOpenRouterReply(userText);

      await send(chatId, aiReply || "AI tidak menjawab.");
      return NextResponse.json({ ok: true });
    }

    // ======================
    // NORMAL BOT MODE
    // ======================
    const reply = await getAssistantReply(userText);

    await send(chatId, reply);

    return NextResponse.json({ ok: true });

    // ======================
    // OPENROUTER AI SAFE
    // ======================
    async function getOpenRouterReply(message: string) {
      try {
        console.log("AI REQUEST:", message);

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
                    "You are MBG assistant. Answer short, helpful, focus on food, logistics, and quality.",
                },
                { role: "user", content: message },
              ],
              max_tokens: 300,
            }),
          }
        );

        const data = await res.json();

        console.log("AI RESPONSE:", data);

        return (
          data?.choices?.[0]?.message?.content ||
          "AI tidak dapat menjawab saat ini."
        );
      } catch (err) {
        console.error("AI ERROR:", err);
        return "AI sedang error, coba lagi nanti.";
      }
    }
  } catch (err) {
    console.error("FATAL ERROR:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}