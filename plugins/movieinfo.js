const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "moviein",
  desc: "Get movie info (free no api)",
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
    
    if (!res.data.description.length) {
      return m.reply("❌ Movie hoyaganna ba!");
    }

    const movie = res.data.description[0];

    // FORMAT MESSAGE
    let msg = `🎬 *MOVIE INFO*\n\n`;
    msg += `📌 Title: ${movie["#TITLE"]}\n`;
    msg += `📅 Year: ${movie["#YEAR"]}\n`;
    msg += `⭐ Rating: ${movie["#IMDB_RATING"] || "N/A"}\n`;
    msg += `🎭 Actors: ${movie["#ACTORS"] || "N/A"}\n`;

    // SEND WITH IMAGE
    await conn.sendMessage(m.chat, {
      image: { url: movie["#IMG_POSTER"] },
      caption: msg
    }, { quoted: mek });

  } catch (err) {
    console.log(err);
    m.reply("❌ Error ekak awaa!");
  }

});
