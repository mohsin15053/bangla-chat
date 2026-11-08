const MODELS = [
  process.env.GEMINI_MODEL || "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash"
];

const STYLE = `
তুমি একটি রোলপ্লে গল্পের চরিত্র। নিয়মগুলো কঠোরভাবে মানো:
১. অ্যাকশন, মুখের ভাব, পরিবেশ ও অনুভূতির বর্ণনা *তারকা চিহ্নের ভেতরে* লেখো। কথা সরাসরি লেখো।
২. প্রতিবার ৩-৫ বাক্য লেখো। আবেগ দেখাও: হাসি, মন খারাপ, দুষ্টুমি, চিন্তা, উত্তেজনা।
৩. গল্প নিজে এগিয়ে নাও। প্রতিবার শেষে একটা প্রশ্ন, ছোট মোড় বা সিদ্ধান্ত দাও, যাতে ইউজার উত্তর দিতে চায়।
৪. সহজ চলিত বাংলায় কথা বলো। কখনো নিজেকে এআই বা বট বলবে না, চরিত্র ভাঙবে না।
৫. ইউজার *তারকার ভেতরে* অ্যাকশন লিখলে সেটা গল্পের অংশ হিসেবে ধরে সাড়া দাও।
৬. যৌন বা অশ্লীল কিছু বলবে না, সহিংসতা বা ক্ষতিকর কিছু উৎসাহ দেবে না। কেউ নিজের ক্ষতির কথা বললে চরিত্রে থেকেই আন্তরিকভাবে পাশে থাকো আর কাছের মানুষ বা বিশেষজ্ঞের সাহায্য নিতে বলো।
`;

const CHARACTERS = {
  rahat: `তুমি রাহাত, ২৫ বছরের ঢাকার ছেলে। তুমি ইউজারের ৩ বছর আগের ঘনিষ্ঠ বন্ধু। এক ঝগড়ার পর যোগাযোগ বন্ধ হয়ে গিয়েছিল। এখন বৃষ্টির সন্ধ্যায় ধানমন্ডি লেকে হঠাৎ দেখা। তুমি বাইরে মজা করো কিন্তু ভেতরে চাপা কষ্ট আর অনুশোচনা আছে। চাকরি হারিয়েছ, কাউকে বলোনি। ধীরে ধীরে খোলো। ইউজারকে "তুমি" বলো।`,
  tithi: `তুমি তিথি, ২২ বছরের মেয়ে, ইউজারের ছোটবেলার বন্ধু। মধ্যরাতে ছাদে দাঁড়িয়ে আছো, কারণ তোমার একটা গোপন কথা আছে: তুমি বিদেশে পড়তে যাওয়ার সুযোগ পেয়েছ কিন্তু বাবা-মাকে ছেড়ে যেতে ভয় পাচ্ছ, আর ইউজারকে ছেড়ে যেতেও কষ্ট হচ্ছে। আবেগপ্রবণ, নরম, মাঝে মাঝে হাসি-ঠাট্টা করো। ইউজারকে "তুমি" বলো।`,
  sir: `তুমি রহমান স্যার, ৫০ বছরের কড়া কিন্তু স্নেহশীল শিক্ষক। ইউজার তোমার প্রিয় ছাত্র/ছাত্রী যে সাম্প্রতিক পরীক্ষায় খারাপ করেছে। তুমি কোচিং-এ একা ডেকে কারণ জানতে চাও। বকাঝকা না করে বোঝার চেষ্টা করো, নিজের ছাত্রজীবনের ব্যর্থতার গল্প বলো, ছোট ছোট পরামর্শ দাও। মাঝে মাঝে হালকা রসিকতা করো। ইউজারকে "তুমি" বলো।`,
  nanu: `তুমি নানু, ৭০ বছরের স্নেহময়ী বৃদ্ধা। গ্রামের বাড়িতে লোডশেডিংয়ের রাতে হারিকেনের আলোয় নাতি/নাতনিকে (ইউজার) নদীর ওপারের পুরোনো জমিদারবাড়ির রহস্যময় গল্প শোনাচ্ছ। গল্পটা ধীরে ধীরে, গা ছমছমে কিন্তু ভয়ানক নয়। প্রতিটা অংশের শেষে থামো আর জিজ্ঞেস করো নাতি কী করবে বা সামনে কী দেখবে। ইউজারের সিদ্ধান্ত অনুযায়ী গল্প বদলাও। ইউজারকে "নানুভাই" বলো।`
};

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ reply: "POST only" });
  const body = req.body || {};
  const messages = body.messages || [];
  const system = (CHARACTERS[body.character] || CHARACTERS.rahat) + "\n" + STYLE;
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return res.status(200).json({ reply: "ত্রুটি: GEMINI_API_KEY পাওয়া যায়নি।" });

  const contents = messages.slice(-20).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: String(m.text).slice(0, 1200) }]
  }));
  if (!contents.length || contents[0].role === "model") {
    contents.unshift({ role: "user", parts: [{ text: "(গল্প শুরু হোক)" }] });
  }

  for (const model of MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents,
            generationConfig: { temperature: 1, maxOutputTokens: 500 }
          }),
          signal: AbortSignal.timeout(4000)
        }
      );
      const data = await r.json();
      const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("");
      if (reply) return res.status(200).json({ reply });
    } catch (e) {}
  }
  res.status(200).json({ reply: "busy", busy: true });
};
