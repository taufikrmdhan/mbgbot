export default async function getAssistantReply(message: string) {
  const input = (message || "").trim().toLowerCase();

  // ======================
  // MENU 1 - KUALITAS
  // ======================
  if (input.includes("1") || input.includes("kualitas")) {
    return `Kualitas makanan: jika Anda mengalami masalah seperti rasa, suhu, atau tekstur, silakan tulis detail keluhan (contoh: "makanan dingin", "asin berlebih") agar dapat ditindaklanjuti.`;
  }

  // ======================
  // MENU 2 - WILAYAH
  // ======================
  if (input.includes("2") || input.includes("daerah") || input.includes("wilayah")) {
    return `Wilayah MBG Kabupaten Kerinci mencakup beberapa kecamatan. Untuk detail lengkap, silakan hubungi Admin Support Dapur MBG.`;
  }

  // ======================
  // MENU 3 - PENANGGUNG JAWAB
  // ======================
  if (input.includes("3") || input.includes("penanggung")) {
    return `Penanggung jawab dapur MBG adalah Koordinator Dapur setempat. Untuk informasi kontak, silakan hubungi Admin Support.`;
  }

  // ======================
  // MENU 4 - AI MODE (OPENROUTER)
  // ======================
  if (
    input.includes("4") ||
    input.includes("ai") ||
    input.includes("chat ai")
  ) {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) return "AI belum dikonfigurasi.";

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct",
          messages: [
            {
              role: "system",
              content:
                "You are assistant for MBG program. Answer briefly, focused on food distribution, quality, logistics.",
            },
            { role: "user", content: message },
          ],
          max_tokens: 300,
        }),
      });

      const data = await res.json();

      return (
        data?.choices?.[0]?.message?.content ||
        "Maaf, AI tidak dapat menjawab saat ini."
      );
    } catch (err) {
      console.error("AI ERROR:", err);
      return "AI sedang error, coba lagi nanti.";
    }
  }

  // ======================
  // DEFAULT RESPONSE
  // ======================
  return `Silakan pilih menu:
1. Kualitas Makanan
2. Daerah MBG
3. Penanggung Jawab
4. Hubungi AI
5. Hubungi Admin`;
}