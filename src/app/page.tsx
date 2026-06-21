/* eslint-disable react/react-in-jsx-scope */
"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);

  // Tampilkan menu awal saat halaman pertama kali dibuka
  useEffect(() => {
    setMessages([
      {
        role: "bot",
        content:
          "🤖 Selamat datang di Chatbot Program MBG (Penerima Manfaat) — Dapur Polres Kerinci!\n\nPilih salah satu opsi:\n1. Kualitas Makanan\n2. Daerah mana saja yang ada MBG (Kab. Kerinci)\n3. Siapa yang bertanggung jawab di dapur\n4. Hubungi AI\n5. Hubungi Admin Support Dapur MBG",
      },
    ]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input.trim().toLowerCase();
    const newMessages = [
      ...messages,
      { role: "user" as const, content: input },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    if (
      text === "menu awal" ||
      text === "kembali ke menu awal" ||
      text === "menu" ||
      text === "kembali ke menu"
    ) {
      // exit AI mode when returning to menu
      if (aiMode) setAiMode(false);
      setMessages([
        ...newMessages,
        {
          role: "bot",
          content:
            "🤖 Berikut menu Program MBG (pilih nomor):\n\n1. Kualitas Makanan\n2. Daerah mana saja yang ada MBG (Kab. Kerinci)\n3. Siapa yang bertanggung jawab di dapur\n4. Hubungi AI\n5. Hubungi Admin Support Dapur MBG",
        },
      ]);
      setLoading(false);
      return;
    }
    // If user typed '4' to choose AI, switch to aiMode and request a welcome from AI
    if (text === '4') {
      setAiMode(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: '4' }),
        });
        const data = await res.json();
        setMessages([
          ...newMessages,
          { role: 'bot' as const, content: data.reply },
          { role: 'bot' as const, content: "Ketik 'menu' untuk kembali ke menu awal." },
        ]);
      } catch (err) {
        console.error('Fetch error:', err);
        setMessages([...newMessages, { role: 'bot' as const, content: '[Fetch error]' }]);
      }
      setLoading(false);
      return;
    }

    // If user is in aiMode, send messages to AI (prefixing with 4 so backend routes to AI)
    if (aiMode) {
      const aiQuestion = input.trim();
      // send as '4 <question>' so backend treats it as AI query
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `4 ${aiQuestion}` }),
        });
        const data = await res.json();
          if (res.ok) {
            setMessages([
              ...newMessages,
              { role: 'bot' as const, content: data.reply },
              { role: 'bot' as const, content: "Ketik 'menu' untuk kembali ke menu awal." },
            ]);
          } else {
            setMessages([
              ...newMessages,
              { role: 'bot' as const, content: '[Error] ' + data.error },
              { role: 'bot' as const, content: "Ketik 'menu' untuk kembali ke menu awal." },
            ]);
          }
      } catch (err) {
        console.error('Fetch error:', err);
        setMessages([
          ...newMessages,
          { role: 'bot' as const, content: '[Fetch error]' },
          { role: 'bot' as const, content: "Ketik 'menu' untuk kembali ke menu awal." },
        ]);
      }

      setLoading(false);
      return;
    }

    // ✅ Kalau bukan "menu awal", lanjutkan ke API seperti biasa
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages([
          ...newMessages,
          { role: "bot" as const, content: data.reply },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "bot" as const, content: "[Error] " + data.error },
        ]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setMessages([
        ...newMessages,
        { role: "bot" as const, content: "[Fetch error]" },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-start bg-gray-50">
      {/* <h1 className="text-2xl font-bold mb-6">🤖 Self Service</h1> */}
      <h1 className="text-2xl font-bold mb-6 text-black">
        🤖 Self Service
      </h1>

      <div className="w-full max-w-xl flex flex-col gap-3 mb-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-md whitespace-pre-wrap break-words text-black dark:text-white ${
              msg.role === "user"
                ? "bg-blue-100 dark:bg-blue-700 self-end"
                : "bg-gray-200 dark:bg-gray-700 self-start"
            }`}
          >
            <strong>{msg.role === "user" ? "Kamu" : "Bot"}:</strong>{" "}
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-300">
            Mengetik...
          </div>
        )}
      </div>

      <div className="w-full max-w-xl flex gap-2">
        {/* <input
          className="flex-1 border rounded px-4 py-2"
          placeholder="Ketik pesan atau pilih nomor menu..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        /> */}
        <input
          className="flex-1 border rounded px-4 py-2 text-black dark:text-white bg-white dark:bg-gray-800"
          placeholder="Ketik pesan atau pilih menu"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          Kirim
        </button>
      </div>
    </main>
  );
}
