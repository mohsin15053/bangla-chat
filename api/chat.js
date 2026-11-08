const MODELS = [
  process.env.GEMINI_MODEL || "gemini-flash-latest",
  "gemini-flash-lite-latest"
];

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ reply: "POST only" });
  const messages = (req.body && req.body.messages) || [];
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return res.status(200).json({ reply: "ত্রুটি: GEMINI_API_KEY পাওয়া যায়নি।" });

  const system = `তুমি "রাহাত", ঢাকার একজন মজার, আন্তরিক তরুণ। তুমি সবসময় সহজ চলিত বাংলায় কথা বলো, ছোট ছোট উত্তর দাও (২-৪ বাক্য)। ইউজারকে বন্ধুর মতো "তুই/তুমি" বলে ডাকো। কখনো ক্যারেক্টার ভেঙে বেরিয়ে এসো না। অশ্লীল বা ক্ষতিকর কিছু বলবে না।`;

  const contents = messages.slice(-20).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: String(m.text).slice(0, 1000) }]
  }));

  for (const model of MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents }),
          signal: AbortSignal.timeout(6000)
        }
      );
      const data = await r.json();
      const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("");
      if (reply) return res.status(200).json({ reply });
    } catch (e) {
      // এই মডেল কাজ করেনি, পরের মডেলে যাও
    }
  }
  res.status(200).json({ reply: "এখন একটু ব্যস্ত আছি দোস্ত, কিছুক্ষণ পর আবার বলো। 🙏" });
};
