export default async function getAssistantReply(message: string) {
  const input = (message || "").trim().toLowerCase();

  if (input.includes("1") || input.includes("kualitas")) {
    return "Kualitas makanan: laporkan jika ada masalah rasa, suhu, atau tekstur.";
  }

  if (input.includes("2") || input.includes("daerah")) {
    return "Wilayah MBG berada di beberapa titik Kabupaten Kerinci.";
  }

  if (input.includes("3") || input.includes("penanggung")) {
    return "Penanggung jawab adalah Koordinator Dapur setempat.";
  }

  return `Silakan pilih menu:
1. Kualitas Makanan
2. Daerah MBG
3. Penanggung Jawab
4. Hubungi AI
5. Hubungi Admin`;
}