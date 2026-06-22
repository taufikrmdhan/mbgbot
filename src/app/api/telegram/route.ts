import { NextResponse } from "next/server";
import getAssistantReply from "../../../lib/assistant";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("TELEGRAM BODY:", JSON.stringify(body, null, 2));

    const message = body.message;

    if (!message) {
      return NextResponse.json({ status: "no-message" });
    }

    const chatId = message?.chat?.id;
    const userText = message?.text || "";

    if (!chatId) {
      return NextResponse.json({ status: "no-chat-id" });
    }

    console.log("CHAT ID:", chatId);
    console.log("USER TEXT:", userText);

    const TELE_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

    console.log("TOKEN ADA:", !!TELE_TOKEN);

    // ==========================
    // SEND FUNCTION
    // ==========================
    async function tgSend(bodyObj: any, method = "sendMessage", note = "") {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${TELE_TOKEN}/${method}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyObj),
          }
        );

        const data = await res.json();
        console.log("TG SEND:", note, data);
        return data;
      } catch (err) {
        console.error("TG ERROR:", err);
        return null;
      }
    }

    // ==========================
    // KEYBOARD
    // ==========================
    const menuKeyboard = {
      keyboard: [
        [
          { text: "1. Kualitas Makanan" },
          { text: "2. Daerah MBG" },
        ],
        [
          { text: "3. Penanggung Jawab" },
          { text: "4. Hubungi AI" },
        ],
        [
          { text: "5. Hubungi Admin" },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    };

    // ==========================
    // ADMIN MODE
    // ==========================
    if (String(chatId) === String(ADMIN_CHAT_ID)) {
      const replyTo = message.reply_to_message?.text || "";
      const match = replyTo.match(/MBG_FROM_USER:(\d+)/);

      if (match) {
        const targetChatId = match[1];

        await tgSend({
          chat_id: targetChatId,
          text: message.text || "(media tidak didukung)",
          reply_markup: menuKeyboard,
        });

        return NextResponse.json({ status: "forwarded" });
      }

      return NextResponse.json({ status: "admin-ignore" });
    }

    // ==========================
    // NORMALIZE INPUT (FIX UTAMA)
    // ==========================
    let inputRaw = (userText || "")
      .trim()
      .toLowerCase()
      .replace(/@\w+/g, "");

    console.log("AFTER NORMALIZE:", inputRaw);

    // ==========================
    // COMMAND HANDLER
    // ==========================
    const commandMap: Record<string, string> = {
      menu: "menu",
      kualitas: "1",
      daerah: "2",
      penanggungjawab: "3",
      ai: "4",
      admin: "5",
    };

    // handle /command
    if (inputRaw.startsWith("/")) {
      const parts = inputRaw.split(" ");
      const cmd = parts[0].replace("/", "");

      if (commandMap[cmd]) {
        inputRaw =
          parts.length === 1
            ? commandMap[cmd]
            : `${commandMap[cmd]} ${parts.slice(1).join(" ")}`;
      }
    }

    let processed = inputRaw.trim();

    // ==========================
    // BUTTON CLEAN
    // ==========================
    if (processed.startsWith("1.")) processed = "1";
    if (processed.startsWith("2.")) processed = "2";
    if (processed.startsWith("3.")) processed = "3";
    if (processed.startsWith("4.")) processed = "4";
    if (processed.startsWith("5.")) processed = "5";

    console.log("PROCESSED:", processed);

    // ==========================
    // ADMIN REQUEST
    // ==========================
    if (processed === "5" || processed.includes("admin")) {
      if (!ADMIN_CHAT_ID) {
        await tgSend({
          chat_id: chatId,
          text: "Admin belum dikonfigurasi.",
          reply_markup: menuKeyboard,
        });

        return NextResponse.json({ status: "no-admin" });
      }

      await tgSend({
        chat_id: ADMIN_CHAT_ID,
        text: `Permintaan bantuan MBG\n\nMBG_FROM_USER:${chatId}\n\nPesan:\n${userText}`,
      });

      await tgSend({
        chat_id: chatId,
        text: "Permintaan Anda sudah diteruskan ke Admin Support.",
        reply_markup: menuKeyboard,
      });

      return NextResponse.json({ status: "admin-sent" });
    }

    // ==========================
    // MENU
    // ==========================
    const isStart =
      inputRaw === "/start" ||
      inputRaw.startsWith("/start") ||
      inputRaw === "start";

    if (processed === "" || processed === "menu" || isStart) {
      await tgSend({
        chat_id: chatId,
        text: "Selamat datang di Program MBG Dapur Polres Kerinci.",
        reply_markup: menuKeyboard,
      });

      return NextResponse.json({ status: "menu" });
    }

    // ==========================
    // ASSISTANT (FIX FINAL)
    // ==========================
    console.log("KIRIM KE ASSISTANT:", inputRaw);

    const replyText = await getAssistantReply(inputRaw);

    await tgSend({
      chat_id: chatId,
      text: replyText,
      reply_markup: menuKeyboard,
    });

    return NextResponse.json({ status: "success" });

  } catch (error) {
    console.error("TELEGRAM ERROR:", error);

    return NextResponse.json(
      { status: "error" },
      { status: 500 }
    );
  }
}