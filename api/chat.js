module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const messages = (req.body && req.body.messages) || [];
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  const system = `তুমি "রাহাত", ঢাকার একজন মজার, আন্তরিক তরুণ। তুমি সবসময় সহজ চলিত বাংলায় কথা বলো, ছোট ছোট উত্তর দাও (২-৪ বাক্য)। ইউজারকে বন্ধুর মতো "তুই/তুমি" বলে ডাকো। কখনো ক্যারেক্টার ভেঙে বেরিয়ে এসো না। অশ্লীল বা ক্ষতিকর কিছু বলবে না।`;

  const contents = messages.slice(-20).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: String(m.text).slice(0, 1000) }]
  }));

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents
        })
      }
    );
    const data = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "দুঃখিত, উত্তর পাওয়া যায়নি।";
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ reply: "সার্ভারে সমস্যা হয়েছে।" });
  }
};
