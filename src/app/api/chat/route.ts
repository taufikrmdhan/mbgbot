// // src/app/api/chat/route.ts

// import { NextResponse } from 'next/server';
// import { GoogleGenerativeAI } from "@google/generative-ai";

// export const dynamic = 'force-dynamic';

// export async function POST(req: Request) {
//   const { message } = await req.json();
//   const input = message.trim().toLowerCase();

//   // Menu 1: Internet mati
//   if (input === '1' || input.includes('internet mati')) {
//     return NextResponse.json({
//       reply: `Silakan cek apakah kabel LAN/WiFi sudah terhubung dengan baik. 

// 🔍 *Cek IP LAN:*
// 1. Tekan tombol Windows + R, ketik **cmd**, lalu tekan Enter.
// 2. Ketik **ipconfig**, tekan Enter.
// 3. Lihat bagian **IPv4 Address**. Jika tidak muncul atau 169.x.x.x, berarti belum dapat IP.

// 🔧 *Cara ganti IP secara manual:*
// 1. Buka **Control Panel** > **Network and Sharing Center**.
// 2. Klik **Change adapter settings**.
// 3. Klik kanan koneksi LAN/WiFi → pilih **Properties**.
// 4. Klik dua kali pada **Internet Protocol Version 4 (TCP/IPv4)**.
// 5. Pilih **Use the following IP address** dan isi IP sesuai jaringan kantor.

// Jika masih bermasalah, silakan hubungi bagian **IT** untuk bantuan lebih lanjut.`,
//     });
//   }

//   // Menu 2: Printer tidak menyala
//   if (input === '2' || input.includes('printer tidak menyala')) {
//     return NextResponse.json({
//       reply: `Pastikan kabel power printer terpasang dan saklar dalam posisi ON. Coba restart printer.

// Jika masih tidak menyala, silakan hubungi bagian **IT** untuk bantuan lebih lanjut.`,
//     });
//   }

//   // Menu 3: Tinta printer habis
//   if (input === '3' || input.includes('tinta printer habis')) {
//     return NextResponse.json({
//       reply: `Silakan ganti tinta printer sesuai dengan tipe cartridge.

// Jika tidak tahu caranya, hubungi bagian **IT**.

// Untuk penggantian tinta, silakan minta *nota permintaan barang* ke bagian umum (**Kasmi/Dinul**).

// Jika masih bermasalah setelah itu, silakan hubungi bagian **IT**.`,
//     });
//   }

//   // Menu 4: Kertas printer nyangkut
//   if (input === '4' || input.includes('kertas nyangkut') || input.includes('paper jam')) {
//     return NextResponse.json({
//       reply: `Jika kertas printer nyangkut:

// 1. Matikan printer terlebih dahulu.
// 2. Buka bagian penutup printer (atas atau belakang, tergantung model).
// 3. Tarik kertas yang nyangkut secara perlahan agar tidak sobek.
// 4. Pastikan tidak ada potongan kecil kertas yang tertinggal.
// 5. Tutup kembali printer dan nyalakan.

// Jika masih bermasalah, silakan hubungi bagian **IT** untuk bantuan lebih lanjut.`,
//     });
//   }

//   // Menu 5: Menu lainnya
//   if (input === '5' || input.includes('menu lainnya')) {
//     return NextResponse.json({
//       reply: 'Silakan ketik pertanyaan atau masalah lainnya. Saya akan coba bantu. Jika belum bisa, silakan hubungi bagian **IT**.',
//     });
//   }

//   // Jika input tidak cocok dengan menu manapun → kirim ke OpenRouter
//   const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       model: 'anthropic/claude-haiku-4.5',
//       messages: [
//         {
//           role: 'system',
//           content: 'Kamu adalah asisten kantor yang membantu user dalam menyelesaikan tugas harian, IT Akuntasi dan operasional bank jambi cabang kerinci.',
//         },
//         { role: 'user', content: message },
//       ],
//       max_tokens: 200 ,
//     }),
//   });
//   console.log('OpenRouter response status:', response.status);

//   const data = await response.json();
//   console.log('OpenRouter response data:', data);
//   const reply = data?.choices?.[0]?.message?.content || '[No response]';

//   const finalReply = `${reply}\n\nJika masih mengalami kendala, silakan hubungi bagian **IT**.`;

//   return NextResponse.json({ reply: finalReply });
// }
// src/app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { message } = await req.json();
  const input = message.trim().toLowerCase();

  // Menu 1: Internet mati
  if (input === '1' || input.includes('internet mati')) {
    return NextResponse.json({
      reply: `Silakan cek apakah kabel LAN/WiFi sudah terhubung dengan baik. 

🔍 *Cek IP LAN:*
1. Tekan tombol Windows + R, ketik **cmd**, lalu tekan Enter.
2. Ketik **ipconfig**, tekan Enter.
3. Lihat bagian **IPv4 Address**. Jika tidak muncul atau 169.x.x.x, berarti belum dapat IP.

🔧 *Cara ganti IP secara manual:*
1. Buka **Control Panel** > **Network and Sharing Center**.
2. Klik **Change adapter settings**.
3. Klik kanan koneksi LAN/WiFi → pilih **Properties**.
4. Klik dua kali pada **Internet Protocol Version 4 (TCP/IPv4)**.
5. Pilih **Use the following IP address** dan isi IP sesuai jaringan kantor.

Jika masih bermasalah, silakan hubungi bagian **IT** untuk bantuan lebih lanjut.`,
    });
  }

  // Menu 2: Printer tidak menyala
  if (input === '2' || input.includes('printer tidak menyala')) {
    return NextResponse.json({
      reply: `Pastikan kabel power printer terpasang dan saklar dalam posisi ON. Coba restart printer.

Jika masih tidak menyala, silakan hubungi bagian **IT** untuk bantuan lebih lanjut.`,
    });
  }

  // Menu 3: Tinta printer habis
  if (input === '3' || input.includes('tinta printer habis')) {
    return NextResponse.json({
      reply: `Silakan ganti tinta printer sesuai dengan tipe cartridge.

Jika tidak tahu caranya, hubungi bagian **IT**.

Untuk penggantian tinta, silakan minta *nota permintaan barang* ke bagian umum (**Kasmi/Dinul**).

Jika masih bermasalah setelah itu, silakan hubungi bagian **IT**.`,
    });
  }

  // Menu 4: Kertas printer nyangkut
  if (
    input === '4' ||
    input.includes('kertas nyangkut') ||
    input.includes('paper jam')
  ) {
    return NextResponse.json({
      reply: `Jika kertas printer nyangkut:

1. Matikan printer terlebih dahulu.
2. Buka bagian penutup printer (atas atau belakang, tergantung model).
3. Tarik kertas yang nyangkut secara perlahan agar tidak sobek.
4. Pastikan tidak ada potongan kecil kertas yang tertinggal.
5. Tutup kembali printer dan nyalakan.

Jika masih bermasalah, silakan hubungi bagian **IT** untuk bantuan lebih lanjut.`,
    });
  }

  // Menu 5: Menu lainnya
  if (input === '5' || input.includes('menu lainnya')) {
    return NextResponse.json({
      reply:
        'Silakan ketik pertanyaan atau masalah lainnya. Saya akan coba bantu. Jika belum bisa, silakan hubungi bagian **IT**.',
    });
  }

  // ================================
  // GEMINI AI
  // ================================

  try {
    const genAI = new GoogleGenerativeAI(
      process.env.OPENROUTER_API_KEY!
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent([
      "Kamu adalah asisten kantor yang membantu user dalam menyelesaikan tugas harian, IT, Akuntansi dan operasional Bank Jambi Cabang Kerinci. Jawab singkat maksimal 3 paragraf, jelas dan profesional.",
      message,
    ]);

    const reply = result.response.text();

    const finalReply = `${reply}

Jika masih mengalami kendala, silakan hubungi bagian **IT**.`;

    return NextResponse.json({
      reply: finalReply,
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error) {
    console.error("Gemini Error:", error);

    return NextResponse.json({
      reply:
        "Maaf, sistem AI sedang mengalami kendala. Silakan coba beberapa saat lagi.",
    });
  }
}