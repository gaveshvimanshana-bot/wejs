const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "cinesubz",
    alias: ["csz", "sinhalasub", "movie"],
    react: "🎬",
    desc: "Search Movies with Sinhala Subtitles from CineSubz",
    category: "search",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, q, reply }) => {
    try {

      if (!q) return reply("❌ Please provide a movie name to search!\n\n📌 *Usage:* .cinesubz <movie name>\n📌 *Example:* .cinesubz Dude 2025");

      reply("🔍 Searching CineSubz... Please wait");

      const apiUrl = `https://darkshanyt1-cinesubzapi.hf.space/search?query=${encodeURIComponent(q)}`;

      const { data } = await axios.get(apiUrl, { timeout: 15000 });

      if (!data || !data.status || !data.data || data.data.length === 0) {
        return reply(`❌ No results found for *"${q}"*\n\nTry with a different movie name!`);
      }

      const movies = data.data.slice(0, 5); // max 5 results

      //================== HEADER ==================
      let message = `╭━━〔 🎬 *CINESUBZ RESULTS* 〕━━╮\n`;
      message += `🔍 Query: *${q}*\n`;
      message += `📊 Found: *${data.data.length}* result(s)\n`;
      message += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

      //================== RESULTS ==================
      movies.forEach((movie, index) => {
        const qualityEmoji = getQualityEmoji(movie.quality);
        const typeEmoji = movie.type === "movies" ? "🎥" : "📺";
        const ratingStars = getRatingStars(parseFloat(movie.rating));

        message += `╭── ${typeEmoji} *Result ${index + 1}*\n`;
        message += `│\n`;
        message += `│ 🎞️ *Title:*\n│ ${movie.title}\n`;
        message += `│\n`;
        message += `│ ${qualityEmoji} *Quality:* ${movie.quality || "Unknown"}\n`;
        message += `│ ⭐ *Rating:* ${ratingStars} (${movie.rating || "N/A"})\n`;
        message += `│ 📂 *Type:* ${movie.type === "movies" ? "Movie" : "TV Series"}\n`;
        message += `│\n`;
        message += `│ 🔗 *Link:*\n│ ${movie.link}\n`;
        message += `╰──────────────────────\n\n`;
      });

      if (data.data.length > 5) {
        message += `📌 *Showing 5 of ${data.data.length} results.*\n`;
        message += `Refine your search for more accurate results.\n\n`;
      }

      message += `> ⚡ *𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗩𝗜𝗠𝗔-𝗠𝗗 𝗩1 💐💙*`;

      //================== SEND FIRST RESULT WITH IMAGE ==================
      const firstMovie = movies[0];

      if (firstMovie.image) {
        await danuwa.sendMessage(
          from,
          {
            image: { url: firstMovie.image },
            caption: message,
          },
          { quoted: mek }
        );
      } else {
        await danuwa.sendMessage(
          from,
          { text: message },
          { quoted: mek }
        );
      }

    } catch (e) {
      console.error("[CINESUBZ ERROR]", e);

      if (e.code === "ECONNABORTED" || e.message?.includes("timeout")) {
        return reply("⏳ Request timed out! The CineSubz API is slow right now. Try again later.");
      }

      if (e.response?.status === 404) {
        return reply("❌ No results found. Try a different search term.");
      }

      reply(`❌ Error: ${e.message || "Something went wrong. Please try again."}`);
    }
  }
);

//================== HELPER FUNCTIONS ==================

function getQualityEmoji(quality) {
  if (!quality) return "📀";
  const q = quality.toUpperCase();
  if (q.includes("4K") || q.includes("UHD")) return "🔷";
  if (q.includes("BLURAY") || q.includes("BLU-RAY")) return "🔵";
  if (q.includes("WEBDL") || q.includes("WEB-DL")) return "🟢";
  if (q.includes("WEBRIP")) return "🟡";
  if (q.includes("HDCAM") || q.includes("CAM")) return "🔴";
  if (q.includes("DVDRIP") || q.includes("DVD")) return "🟠";
  return "📀";
}

function getRatingStars(rating) {
  if (isNaN(rating)) return "☆☆☆☆☆";
  const stars = Math.round(rating / 2); // convert 10-scale to 5-star
  return "★".repeat(Math.min(stars, 5)) + "☆".repeat(Math.max(5 - stars, 0));
        }
