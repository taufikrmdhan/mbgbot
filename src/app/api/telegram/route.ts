import { NextResponse } from "next/server";
import getAssistantReply from "@/lib/assistant";

export const dynamic = "force-dynamic";

// =========================
// MEMORY (SIMPLE STATE)
// =========================
const tickets = new Map<string, number>(); // ticketId -> userId
const adminSession = new Map<number, string>(); // adminId -> ticketId
const userSession = new Map<number, string>(); // userId -> ticketId

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = body?.message;
    const chatId = message?.chat?.id;
    const text = message?.text || "";

    if (!chatId) return NextResponse.json({ ok: false });

    const TELE_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
    const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID);

    // =========================
    // SEND FUNCTION
    // =========================
    async function send(chat_id: number, text: string, reply_markup?: any) {
      return fetch(
        `https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text, reply_markup }),
        }
      );
    }

    // =========================
    // CLOSE TICKET (USER)
    // =========================
    if (text === "✔ Selesai / Tutup Chat") {
      const ticketId = userSession.get(chatId);

      if (ticketId) {
        tickets.delete(ticketId);
        userSession.delete(chatId);
      }

      await send(chatId, "Chat ditutup.");
      await send(chatId, "Silakan pilih menu:", menuKeyboard);

      return NextResponse.json({ status: "closed" });
    }

    // =========================
    // ADMIN MODE HANDLER
    // =========================
    if (chatId === ADMIN_CHAT_ID) {
      const sessionTicket = adminSession.get(chatId);

      // 1. ADMIN START LIVE CHAT
      if (text.startsWith("REPLY:")) {
        const ticketId = text.replace("REPLY:", "").trim();
        adminSession.set(chatId, ticketId);

        await send(chatId, `🟢 Live chat dimulai untuk ${ticketId}`);
        return NextResponse.json({ status: "admin-live-start" });
      }

      // 2. ADMIN SEND MESSAGE (LIVE CHAT)
      if (sessionTicket) {
        const userId = tickets.get(sessionTicket);

        if (userId) {
          await send(userId, `👨‍💼 Admin:\n${text}`);

          await send(userId, "Jika selesai, klik tombol:", closeKeyboard);
        }

        return NextResponse.json({ status: "admin-live-msg" });
      }

      return NextResponse.json({ status: "admin-idle" });
    }

    // =========================
    // MENU 5 → CREATE TICKET
    // =========================
    if (text === "5" || text.toLowerCase().includes("admin")) {
      const ticketId = `TICKET-${Date.now()}`;

      tickets.set(ticketId, chatId);
      userSession.set(chatId, ticketId);

      await send(
        ADMIN_CHAT_ID,
        `🚨 TICKET BARU

🎫 ${ticketId}
👤 User: ${chatId}

💬 ${text}

Balas:
REPLY:${ticketId}`
      );

      await send(chatId, "Permintaan Anda sudah dikirim ke admin.");

      return NextResponse.json({ status: "ticket-created" });
    }

    // =========================
    // NORMAL USER MESSAGE (NO SESSION)
    // =========================
    const reply = await getAssistantReply(text);

    await send(chatId, reply, menuKeyboard);

    return NextResponse.json({ status: "ok" });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// =========================
// KEYBOARDS
// =========================
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