// Lightweight rule-based responder. Not a real LLM — no API key required.
// Swap this out for a real AI API call later if you get a free key (e.g. Groq, OpenRouter).

const patterns = [
  { test: /\b(hi|hello|hey|mhoro)\b/i, replies: ["Hey there! 👋", "Hello! How's it going?", "Hi! Chaplin MD at your service."] },
  { test: /\b(how are you|how're you)\b/i, replies: ["I'm running smooth, thanks for asking! 😎", "All systems good on my end!"] },
  { test: /\bthank/i, replies: ["Anytime! 🙌", "You're welcome!", "No problem at all."] },
  { test: /\b(bye|goodbye)\b/i, replies: ["Later! 👋", "See you around!"] },
  { test: /\?$/, replies: ["That's a good question — I'm a simple bot so I can't fully answer that, but I'm listening!", "Hmm, not sure about that one, but tell me more!"] }
];

const fallback = [
  "Interesting, tell me more.",
  "I hear you! 🤖",
  "Noted!",
  "Haha, fair point.",
  "I'm just a lightweight bot brain, but that's cool!"
];

function generateReply(text = '') {
  for (const p of patterns) {
    if (p.test.test(text)) return p.replies[Math.floor(Math.random() * p.replies.length)];
  }
  return fallback[Math.floor(Math.random() * fallback.length)];
}

module.exports = { generateReply };
