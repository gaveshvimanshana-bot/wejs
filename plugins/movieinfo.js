const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "in",
  desc: "Single Movie Info (no api + trailer + plot)",
  category: "search",
  react: "🎬",
  filename: __filename
},
async (conn, mek, m, { args }) => {

  try {
    if (!args[0]) return m.reply("❌ Movie name ekak denna!");

    const query = args.join(" ");

    // SEARCH
    const res = await axios.get(`https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(query)}`);
    const movie = res.data.description[0];

    if (!movie) return m.reply("❌ Movie hoyaganna ba!");

    const title = movie["#TITLE"];
    const year = movie["#YEAR"];
    const imdbID = movie["#IMDB_ID"];

    // TRAILER LINK
    const trailer = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " " + year + " trailer")}`;

    // FAKE DESCRIPTION (fallback)
    let description = "No description available 😢";

    // try get more details (optional API)
    try {
      const more = await axios.get(`https://imdb.iamidiotareyoutoo.com/title/${imdbID}`);
      description = more.data.short?.description || description;
    } catch (e) {}

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
