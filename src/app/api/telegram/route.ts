import { NextResponse } from "next/server";
import getAssistantReply from "../../../lib/assistant";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("TELEGRAM BODY:", JSON.stringify(body, null, 2));

    const message = body.message;

    const chatId = message?.chat?.id;

    const userText = message?.text || "";

    if (!chatId) {
      return NextResponse.json({
        status: "ignored",
      });
    }

    const TELE_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

    const menuKeyboard = {
      keyboard: [
        [
          { text: "1. Kualitas Makanan" },
          { text: "2. Daerah Mana Saja MBG (Kab. Kerinci)" },
        ],

        [
          { text: "3. Siapa Penanggung Jawab Dapur" },
          { text: "4. Hubungi AI" },
        ],

        [{ text: "5. Hubungi Admin Support Dapur MBG" }],
      ],

      resize_keyboard: true,
      one_time_keyboard: false,
    };

    // ==========================================
    // ADMIN REPLY FORWARD
    // ==========================================

    if (String(chatId) === String(ADMIN_CHAT_ID)) {
      const replyTo = message.reply_to_message?.text || "";

      const match = replyTo.match(/MBG_FROM_USER:(\d+)/);

      if (match) {
        const targetChatId = match[1];

        await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            chat_id: targetChatId,

            text: message.text || "(media tidak didukung)",

            reply_markup: menuKeyboard,
          }),
        });

        return NextResponse.json({
          status: "forwarded",
        });
      }

      return NextResponse.json({
        status: "ignored-admin",
      });
    }

    // ==========================================
    // NORMALIZE INPUT
    // ==========================================

    let inputRaw = userText || "";

    const commandMap: Record<string, string> = {
      menu: "menu",

      kualitas: "1",

      daerah: "2",

      penanggungjawab: "3",

      ai: "4",

      admin: "5",
    };

    // /command

    if (inputRaw.trim().startsWith("/")) {
      const cmd = inputRaw
        .trim()
        .split(" ")[0]
        .replace("/", "")
        .split("@")[0]
        .toLowerCase();

      if (commandMap[cmd]) {
        inputRaw = commandMap[cmd];
      }
    }

    let trimmed = inputRaw.trim();

    // BUTTON TELEGRAM

    if (trimmed.startsWith("1.")) trimmed = "1";

    if (trimmed.startsWith("2.")) trimmed = "2";

    if (trimmed.startsWith("3.")) trimmed = "3";

    if (trimmed.startsWith("4.")) trimmed = "4";

    if (trimmed.startsWith("5.")) trimmed = "5";

    // TEXT MANUAL

    const manualMap: Record<string, string> = {
      kualitas: "1",

      "kualitas makanan": "1",

      daerah: "2",

      wilayah: "2",

      "penanggung jawab": "3",

      penanggungjawab: "3",

      "hubungi ai": "4",

      "tanya ai": "4",

      ai: "4",

      "hubungi admin": "5",

      admin: "5",
    };

    const lowerInput = trimmed.toLowerCase();

    if (manualMap[lowerInput]) {
      trimmed = manualMap[lowerInput];
    }

    const lower = trimmed.toLowerCase();

    console.log("USER TEXT:", userText);

    console.log("PROCESSED:", trimmed);

    // ==========================================
    // HUBUNGI ADMIN
    // ==========================================

    if (trimmed === "5" || lower.includes("hubungi admin")) {
      if (!ADMIN_CHAT_ID) {
        await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            chat_id: chatId,

            text: "Admin belum dikonfigurasi.",

            reply_markup: menuKeyboard,
          }),
        });

        return NextResponse.json({
          status: "no-admin",
        });
      }

      const adminMsg = `Permintaan bantuan MBG

MBG_FROM_USER:${chatId}

Pesan:
${userText}`;

      await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,

          text: adminMsg,
        }),
      });

      await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          chat_id: chatId,

          text: "Permintaan Anda sudah diteruskan ke Admin Support.",

          reply_markup: menuKeyboard,
        }),
      });

      return NextResponse.json({
        status: "admin-notified",
      });
    }

    // ==========================================
    // MENU
    // ==========================================

    if (trimmed === "" || lower === "menu" || lower.startsWith("/start")) {
      await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          chat_id: chatId,

          text: "Selamat datang di Program MBG Dapur Polres Kerinci. Silakan pilih layanan:",

          reply_markup: menuKeyboard,
        }),
      });

      return NextResponse.json({
        status: "menu",
      });
    }

    // ==========================================
    // AI / ASSISTANT
    // ==========================================

    const replyText = await getAssistantReply(trimmed);

    await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        chat_id: chatId,

        text: replyText,

        parse_mode: "Markdown",

        reply_markup: menuKeyboard,
      }),
    });

    return NextResponse.json({
      status: "success",
    });
  } catch (error) {
    console.error("TELEGRAM ERROR:", error);

    return NextResponse.json(
      {
        status: "error",
      },
      {
        status: 500,
      },
    );
  }
}
