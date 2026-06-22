import { NextResponse } from "next/server";
import getAssistantReply from "@/lib/assistant";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = body.message;
    if (!message) return NextResponse.json({ ok: false });

    const chatId = message?.chat?.id;
    const userText = message?.text || "";

    if (!chatId) return NextResponse.json({ ok: false });

    console.log("TELEGRAM:", userText);

    const replyText = await getAssistantReply(userText);

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
        }),
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("TELEGRAM ERROR:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}