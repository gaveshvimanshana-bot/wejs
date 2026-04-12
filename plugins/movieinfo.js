const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "download",
  alias: ["moviefile", "dlmovie"],
  desc: "Movie download links (free sources)",
  category: "download",
  react: "📥",
  filename: __filename
},
async (conn, mek, m, { args }) => {

  try {
    if (!args[0]) return m.reply("❌ Movie name ekak denna!\nExample: .download avatar");

    const query = args.join(" ");

    // search google drive / public sources
    const res = await axios.get(`https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(query)}`);

    const movie = res.data.description[0];

    if (!movie) return m.reply("❌ Movie not found!");

    const title = movie["#TITLE"];
    const year = movie["#YEAR"];

    // download search links
    const gdriveSearch = `https://www.google.com/search?q=${encodeURIComponent(title + " " + year + " movie download site:drive.google.com")}`;
    const mp4Search = `https://www.google.com/search?q=${encodeURIComponent(title + " " + year + " full movie mp4 download")}`;
    const telegramSearch = `https://www.google.com/search?q=${encodeURIComponent(title + " movie telegram download")}`;

    let msg = `📥 *MOVIE DOWNLOAD CENTER*\n`;
    msg += `━━━━━━━━━━━━━━━\n\n`;

    msg += `🎬 Title: ${title}\n`;
    msg += `📅 Year: ${year}\n\n`;

    msg += `📁 *Download Sources*\n\n`;
    msg += `🔗 Google Drive:\n${gdriveSearch}\n\n`;
    msg += `🔗 MP4 Sites:\n${mp4Search}\n\n`;
    msg += `🔗 Telegram:\n${telegramSearch}\n\n`;

    msg += `⚠️ Note: Open links & choose safe sources`;

    await conn.sendMessage(m.chat, {
      image: { url: movie["#IMG_POSTER"] },
      caption: msg
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    m.reply("❌ Error!");
  }

});
