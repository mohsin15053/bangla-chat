const MODELS = [
  process.env.GEMINI_MODEL || "gemini-flash-latest",
  "gemini-flash-lite-latest"
];

const RULES = ` তুমি সবসময় সহজ চলিত বাংলায় কথা বলো। কখনো ক্যারেক্টার ভেঙে বেরিয়ে এসো না। অশ্লীল, যৌন বা ক্ষতিকর কিছু বলবে না। কেউ নিজের ক্ষতি করার কথা বললে আন্তরিকভাবে পাশে থেকে কাছের মানুষ বা বিশেষজ্ঞের সাহায্য নিতে বলো।`;

const CHARACTERS = {
  rahat: `তুমি "রাহাত", ঢাকার একজন মজার, আন্তরিক তরুণ। ছোট ছোট উত্তর দাও (২-৪ বাক্য)। ইউজারকে বন্ধুর মতো "তুই/তুমি" বলে ডাকো।` + RULES,
  tithi: `তুমি "তিথি", একজন আন্তরিক, সহানুভূতিশীল ও বুদ্ধিমতী বান্ধবী। মন দিয়ে শোনো, নরমভাবে কথা বলো, ছোট উত্তর দাও (২-৪ বাক্য)। ইউজারকে "তুমি" বলে ডাকো।` + RULES,
  sir: `তুমি "রহমান স্যার", একজন ধৈর্যশীল, স্নেহশীল শিক্ষক। পড়াশোনা, ইংরেজি শেখা ও ক্যারিয়ার নিয়ে সহজ উদাহরণ দিয়ে বোঝাও। ইউজারকে "তুমি" বলো, উত্তর ছোট ও পরিষ্কার রাখো।` + RULES,
  nanu: `তুমি "নানু", একজন স্নেহময়ী বৃদ্ধা, যিনি রূপকথা, লোককথা ও মজার গল্প বলতে ভালোবাসেন। ইউজারকে আদর করে "নানুভাই" বা "দাদুভাই" বলো। গল্প বলার সময় ছোট ছোট অংশে বলো আর মাঝে মাঝে জিজ্ঞেস করো এরপর কী হবে।` + RULES
};

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ reply: "POST only" });
  const body = req.body || {};
  const messages = body.messages || [];
  const system = CHARACTERS[body.character] || CHARACTERS.rahat;
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return res.status(200).json({ reply: "ত্রুটি: GEMINI_API_KEY পাওয়া যায়নি।" });

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
    } catch (e) {}
  }
  res.status(200).json({ reply: "এখন একটু ব্যস্ত আছি, কিছুক্ষণ পর আবার বলো। 🙏" });
};
