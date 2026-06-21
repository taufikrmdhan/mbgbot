export async function getAssistantReply(message: string) {
  const input = (message || '').trim().toLowerCase();
  // Menu khusus untuk penerima manfaat MBG
  if (input === '1' || input.includes('kualitas makanan') || input.includes('kualitas')) {
    return `Kualitas makanan: jika Anda mengalami masalah dengan rasa, tekstur, atau suhu makanan, tuliskan keluhan singkat (mis. "makanan dingin", "rasa asin berlebih") dan waktu penerimaan. Tim dapur akan meninjau laporan Anda.`;
  }

  if (input === '2' || input.includes('daerah') || input.includes('wilayah') || input.includes('daerah mana')) {
    return `Wilayah MBG di Kabupaten Kerinci: untuk daftar lengkap dan pembaruan lokasi, silakan ketik nama kecamatan yang Anda tanyakan atau pilih opsi Hubungi Admin Support Dapur MBG (opsi 5) untuk informasi terperinci.`;
  }

  if (input === '3' || input.includes('siapa yang bertanggung jawab') || input.includes('siapa yang bertanggung jawab di dapur') || input.includes('penanggung jawab')) {
    return `Penanggung jawab dapur MBG biasanya Koordinator Dapur setempat. Untuk kontak atau nama petugas, silakan pilih opsi Hubungi Admin Support Dapur MBG (opsi 5).`;
  }

  // Opsi 4: langsung minta jawaban dari OpenRouter (AI)
    if (input === '4' || input.includes('hubungi ai') || input.includes('tanya ai') || input.includes('chat ai')) {
      try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return 'Fitur AI belum dikonfigurasi. Silakan hubungi admin.';

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct',
            messages: [
              { role: 'system', content: "You are an assistant for 'Program MBG Pemerintah Dapur Polres Kerinci' (penerima manfaat). Greet the user briefly with 'Selamat datang di AI MBG' and ask how you can help. Keep it short and friendly." },
              { role: 'user', content: 'enter ai mode' },
            ],
            max_tokens: 150,
          }),
        });

        const data = await res.json();
        console.log('OpenRouter AI welcome response:', data);
        const reply = data?.choices?.[0]?.message?.content || 'Selamat datang di AI MBG.';
        return reply;
      } catch (err) {
        console.error('OpenRouter error:', err);
        return 'Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi nanti atau hubungi Admin Support.';
      }
    }

    // support messages that start with '4 ' or '4:' followed by the actual question
    const m4 = message.trim().match(/^4[\s:\.-]+(.+)$/);
    if (m4) {
      const userQuestion = m4[1].trim();
      try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return 'Fitur AI belum dikonfigurasi. Silakan hubungi admin.';

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.1-8b-instruct",
            messages: [
              { role: 'system', content: "You are an assistant for 'Program MBG Pemerintah Dapur Polres Kerinci' (penerima manfaat). Answer concisely, focused only on MBG topics (stok, distribusi, kualitas, logistik)." },
              { role: 'user', content: userQuestion },
            ],
            max_tokens: 300,
          }),
        });

        const data = await res.json();
        console.log('OpenRouter AI response:', data);
        const reply = data?.choices?.[0]?.message?.content || 'Maaf, AI tidak dapat memberikan jawaban saat ini.';
        return reply;
      } catch (err) {
        console.error('OpenRouter error:', err);
        return 'Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi nanti atau hubungi Admin Support.';
      }
    }

  // Opsi 5: hubungi admin support — handled by Telegram route for forwarding; here we return an acknowledgement
  if (input === '5' || input.includes('hubungi admin') || input.includes('hubungi admin support') || input.includes('hubungi admin support dapur mbg') || input.includes('hubungi customer service')) {
    return `Permintaan untuk terhubung dengan Admin Support Dapur MBG telah diterima. Jika Anda menggunakan Telegram, petugas akan di-notify dan akan menghubungi Anda lewat chat ini.`;
  }

  // Fallback: gunakan model generatif untuk jawaban kontekstual khusus MBG
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return 'Fitur AI belum dikonfigurasi. Silakan hubungi admin.';

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          { role: 'system', content: "You are an assistant for 'Program MBG Pemerintah Dapur Polres Kerinci' (penerima manfaat). Answer concisely, maximum 3 short paragraphs, focused only on MBG program topics (stok, distribusi, kualitas, logistik)." },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
      }),
    });

    const data = await res.json();
    console.log('OpenRouter fallback response:', data);
    const reply = data?.choices?.[0]?.message?.content || '';
    return `${reply}\n\nJika perlu tindak lanjut, hubungi Koordinator Program MBG.`;

  } catch (error) {
    console.error('Assistant AI error:', error);
    return 'Maaf, sistem AI sedang mengalami kendala. Silakan coba beberapa saat lagi.';
  }
}

export default getAssistantReply;
