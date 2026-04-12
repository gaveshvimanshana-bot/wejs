const axios = require("axios");
const { cmd } = require("../command");

const API_KEY = "646eae85127d7d99"; // ⚠️ direct key

cmd(
  {
    pattern: "ai",
    alias: ["gpt", "ask"],
    react: "✨",
    desc: "AI Chat",
    category: "ai",
    filename: __filename,
  },
  async (conn, mek, m, { q, reply }) => {
    try {
      if (!q) return reply("❌ ප්‍රශ්නයක් දෙන්න.\nඋදා: .ai hi");

      const url = `https://api-dark-shan-yt.koyeb.app/ai/perplexity`;

      const res = await axios.get(url, {
        params: {
          q: q,
          apikey: API_KEY,
        },
      });

      const answer = res.data?.data?.response?.answer;

      if (!answer) return reply("❌ AI response නැහැ");

      reply(`🤖 *AI:*\n\n${answer}`);

    } catch (e) {
      console.log(e);
      reply("❌ AI error ආවා");
    }
  }
);
