import { NextResponse } from "next/server";
import getAssistantReply from "@/lib/assistant";

export const dynamic = "force-dynamic";

// ======================
// SESSION STORE (RAM)
// ======================
const chatSession = new Map<number, "MENU" | "ADMIN_CHAT" | "AI_CHAT">();

const ADMIN_TAG = "MBG_FROM_USER";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = body?.message;
    const chatId = message?.chat?.id;
    const userText = message?.text || "";

    if (!chatId) {
      return NextResponse.json({ ok: false });
    }

    const TELE_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID);

    if (!TELE_TOKEN) throw new Error("TOKEN MISSING");

    // ======================
    // SEND FUNCTION
    // ======================
    async function send(
      chat_id: number,
      text: string,
      reply_markup?: any
    ) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id, text, reply_markup }),
          }
        );

        return await res.json();
      } catch (err) {
        console.error("SEND ERROR:", err);
      }
    }

    // ======================
    // KEYBOARD MENU
    // ======================
    const menuKeyboard = {
      keyboard: [
        [{ text: "1. Kualitas Makanan" }, { text: "2. Daerah MBG" }],
        [{ text: "3. Penanggung Jawab" }, { text: "4. Hubungi AI" }],
        [{ text: "5. Hubungi Admin" }],
      ],
      resize_keyboard: true,
    };

    const closeKeyboard = {
      keyboard: [[{ text: "✔ Selesai / Tutup Chat" }]],
      resize_keyboard: true,
    };

    // ======================
    // INIT STATE
    // ======================
    const state = chatSession.get(chatId) || "MENU";

    console.log("STATE:", state, "USER:", userText);

    // ======================
    // CLOSE CHAT
    // ======================
    if (userText === "✔ Selesai / Tutup Chat") {
      chatSession.set(chatId, "MENU");

      await send(chatId, "Chat ditutup.");
      await send(chatId, "Silakan pilih menu:", menuKeyboard);

      return NextResponse.json({ status: "closed" });
    }

    // ======================
    // ADMIN MODE HANDLER
    // ======================
    if (chatId === ADMIN_CHAT_ID) {
      const replied = message?.reply_to_message?.text;

      if (replied?.includes(ADMIN_TAG)) {
        const targetChatId = replied
          .split(ADMIN_TAG + ":")[1]
          ?.split("\n")[0];

        if (targetChatId) {
          await send(Number(targetChatId), userText);
          await send(
            Number(targetChatId),
            "Jika sudah selesai, tekan tombol di bawah:",
            closeKeyboard
          );
        }

        return NextResponse.json({ status: "admin-replied" });
      }

      return NextResponse.json({ status: "admin-ignore" });
    }

    // ======================
    // MENU 5 (ADMIN REQUEST)
    // ======================
    if (userText === "5" || userText.includes("admin")) {
      chatSession.set(chatId, "ADMIN_CHAT");

      await send(
        ADMIN_CHAT_ID,
        `🚨 TIKET BARU\n\n${ADMIN_TAG}:${chatId}\n\nPesan:\n${userText}`
      );

      await send(chatId, "Permintaan Anda sudah dikirim ke admin.");

      return NextResponse.json({ status: "admin-sent" });
    }

    // ======================
    // MENU 4 (AI MODE)
    // ======================
    if (userText === "4" || userText.includes("ai")) {
      chatSession.set(chatId, "AI_CHAT");

      const intro = await getOpenRouterReply(
        "Sapa user sebagai AI MBG secara singkat"
      );

      await send(chatId, intro);

      return NextResponse.json({ status: "ai-start" });
    }

    // ======================
    // AI CHAT MODE
    // ======================
    if (state === "AI_CHAT") {
      const aiReply = await getOpenRouterReply(userText);

      await send(chatId, aiReply);
      return NextResponse.json({ status: "ai-chat" });
    }

    // ======================
    // NORMAL MODE
    // ======================
    const reply = await getAssistantReply(userText);

    await send(chatId, reply, menuKeyboard);

    return NextResponse.json({ status: "ok" });

    // ======================
    // OPENROUTER AI
    // ======================
    async function getOpenRouterReply(message: string) {
      try {
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
                    "You are MBG assistant. Answer short and helpful.",
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
          "AI tidak dapat menjawab."
        );
      } catch (err) {
        console.error(err);
        return "AI error.";
      }
    }
  } catch (err) {
    console.error("FATAL:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}