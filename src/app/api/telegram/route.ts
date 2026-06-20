import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Data dari Telegram
    const chatId = body.message?.chat?.id;
    const userText = body.message?.text;

    // Abaikan jika bukan pesan teks
    if (!chatId || !userText) {
      return NextResponse.json({ status: 'ignored' });
    }

    const input = userText.trim().toLowerCase();
    let replyText = "";

    // --- 1. LOGIKA MENU LOKAL (Sama dengan Apps Chatbot kamu) ---
    if (input === '1' || input.includes('internet mati')) {
      replyText = "🔍 *Cek IP LAN:*\n1. Tekan Win+R, ketik **cmd**.\n2. Ketik **ipconfig**.\n\nJika IP 169.x.x.x, berarti belum dapat IP. Hubungi IT.";
    } 
    else if (input === '2' || input.includes('printer mati')) {
      replyText = "Pastikan kabel power printer terpasang dan saklar ON. Coba restart printer.";
    }
    else if (input === '3' || input.includes('tinta habis')) {
      replyText = "Silakan ganti tinta sesuai tipe cartridge. Minta *nota permintaan barang* ke bagian umum (**Kasmi/Dinul**).";
    }
    else if (input === '4' || input.includes('kertas nyangkut')) {
      replyText = "Matikan printer, buka penutup, tarik kertas perlahan agar tidak sobek. Pastikan tidak ada serpihan kertas tertinggal.";
    }
    // --- 2. JIKA BUKAN MENU, LEMPAR KE OPENROUTER ---
    else {
      const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://bankjambi.co.id',
          'X-Title': 'Asisten Bank Jambi',
        },
        body: JSON.stringify({
          model: 'google/gemini-flash-1.5',
          messages: [
            { role: 'system', content: 'Kamu adalah asisten IT & Operasional Bank Jambi Cabang Kerinci.' },
            { role: 'user', content: userText },
          ],
          max_tokens: 200,
        }),
      });

      const aiData = await aiResponse.json();
      replyText = aiData?.choices?.[0]?.message?.content || "Maaf, AI sedang mengalami kendala.";
    }

    // Tambahkan footer standar
    const finalReply = `${replyText}\n\n_Hubungi IT jika kendala berlanjut._`;

    // --- 3. KIRIM BALIK KE TELEGRAM ---
    const TELE_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${TELE_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: finalReply,
        parse_mode: 'Markdown', // Biar teks tebal/miring tampil bagus
        // TAMBAHAN: Tombol Menu otomatis di bawah layar Telegram
        reply_markup: {
          keyboard: [
            [{ text: "1. Internet Mati" }, { text: "2. Printer Mati" }],
            [{ text: "3. Tinta Habis" }, { text: "4. Kertas Nyangkut" }]
          ],
          resize_keyboard: true,
          one_time_keyboard: false
        }
      }),
    });

    return NextResponse.json({ status: 'success' });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error('Telegram Bot Error:', msg);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}