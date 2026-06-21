import { NextResponse } from 'next/server';
import getAssistantReply from '../../../lib/assistant';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = body.message;
    const chatId = message?.chat?.id;
    const fromId = message?.from?.id;
    const userText = message?.text || '';

    if (!chatId) return NextResponse.json({ status: 'ignored' });

    const TELE_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // set this in env to the admin/group chat id

    // 1) If message is from admin (admin chat), and it's a reply to a bot message containing marker => forward admin reply to original user
    if (String(chatId) === String(ADMIN_CHAT_ID)) {
      const replyTo = message.reply_to_message?.text || '';
      const m = replyTo.match(/MBG_FROM_USER:(\d+)/);
      if (m) {
        const targetChatId = m[1];
        // forward admin's reply text to the user
        const forwardText = message.text || '(gambar/meda tidak didukung dalam demo)';
        await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: targetChatId, text: forwardText })
        });

        // ack to admin
        await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: 'Pesan telah diteruskan ke penerima manfaat.' })
        });

        return NextResponse.json({ status: 'forwarded' });
      }

      return NextResponse.json({ status: 'ignored-admin' });
    }

    // 2) If user requests to contact admin – support both textual triggers and numeric '5' (no DB needed)
    const trimmed = userText.trim();
    const lower = trimmed.toLowerCase();

    // match '5' or '5 <message>' formats
    const m5 = trimmed.match(/^5[\s:\.-]*(.*)$/);
    const isAdminTrigger = Boolean(m5) || lower.includes('hubungi admin') || lower.includes('chat admin') || lower === 'hubungi admin';

    if (isAdminTrigger) {
      if (!ADMIN_CHAT_ID) {
        // fallback reply to user if admin chat not configured
        await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: 'Permintaan diterima, namun belum ada petugas terdaftar. Coba lagi nanti.' })
        });
        return NextResponse.json({ status: 'no-admin-config' });
      }

      // Use message after '5' if present, otherwise use the whole userText
      const userProvided = (m5 && m5[1] && m5[1].trim()) ? m5[1].trim() : userText;

      // notify admin/group — include marker MBG_FROM_USER:<chatId> so admin replies can be routed back
      const adminMsg = `Permintaan bantuan dari penerima manfaat MBG\nMBG_FROM_USER:${chatId}\nPesan asli: ${userProvided}`;
      await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: adminMsg })
      });

      // notify user that request is received
      await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: 'Permintaan Anda telah diteruskan ke petugas. Petugas akan menghubungi Anda melalui chat ini.' })
      });

      return NextResponse.json({ status: 'notified-admin' });
    }

    // 3) Default: normal assistant reply
    const replyText = await getAssistantReply(userText);

    await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: "1. Kualitas Makanan" }, { text: "2. Daerah Mana Saja MBG (Kab. Kerinci)" }],
            [{ text: "3. Siapa Penanggung Jawab Dapur" }, { text: "4. Hubungi AI" }],
            [{ text: "5. Hubungi Admin Support Dapur MBG" }]
          ],
          resize_keyboard: true,
          one_time_keyboard: false
        }
      }),
    });

    return NextResponse.json({ status: 'success' });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Telegram Bot Error:', msg);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}