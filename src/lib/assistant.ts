export default async function getAssistantReply(message: string) {
  const input = message.toLowerCase();

  if (input.includes("1") || input.includes("kualitas")) {
    return "Laporkan kualitas makanan jika ada masalah.";
  }

  if (input.includes("2")) {
    return "Wilayah MBG tersebar di Kerinci.";
  }

  if (input.includes("3")) {
    return "Penanggung jawab adalah koordinator dapur.";
  }

  return `Silakan pilih menu:
1. Kualitas
2. Daerah
3. Penanggung Jawab
4. AI
5. Admin`;
}