const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "in",
  desc: "Movie info (no api + trailer + description fix)",
  category: "search",
  react: "🎬",
  filename: __filename
},
async (conn, mek, m, { args }) => {

  try {
    if (!args[0]) return m.reply("❌ Movie name ekak denna!");

    const query = args.join(" ");

    // SEARCH MOVIE
    const res = await axios.get(`https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(query)}`);
    const movie = res.data.description[0];

    if (!movie) return m.reply("❌ Movie hoyaganna ba!");

    const title = movie["#TITLE"];
    const year = movie["#YEAR"];
    const imdbID = movie["#IMDB_ID"];

    // TRAILER LINK
    const trailer = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " " + year + " trailer")}`;

    // ================= DESCRIPTION FIX =================
    let description = "No description available 😢";

    try {
      const more = await axios.get(`https://imdb.iamidiotareyoutoo.com/title/${imdbID}`);

      if (more.data?.short?.description) {
        description = more.data.short.description;
      } else if (more.data?.description) {
        description = more.data.description;
      }

    } catch (e) {
      console.log("desc error", e);
    }

    // fallback (always show something)
    if (!description || description.length < 10) {
      description = `${title} (${year}) movie ekak. Full description unavailable 😅`;
    }
    // ==================================================

    let msg = `🎬 *MOVIE INFO*\n`;
    msg += `━━━━━━━━━━━━━━━\n\n`;

    msg += `📌 *Title:* ${title}\n`;
    msg += `📅 *Year:* ${year}\n`;
    msg += `⭐ *Rating:* ${movie["#IMDB_RATING"] || "N/A"}\n`;
    msg += `🎭 *Actors:* ${movie["#ACTORS"] || "N/A"}\n\n`;

    msg += `📝 *Description:*\n${description}\n\n`;

    msg += `🎥 *Trailer:*\n${trailer}\n`;

    msg += `━━━━━━━━━━━━━━━`;

    await conn.sendMessage(m.chat, {
      image: { url: movie["#IMG_POSTER"] },
      caption: msg
    }, { quoted: mek });

  } catch (err) {
    console.log(err);
    m.reply("❌ Error ekak awaa!");
  }

});
