const axios = require("axios");
const { cmd } = require("../command");

// store user selections
global.movieSelection = global.movieSelection || {};

// ================= SEARCH COMMAND =================
cmd({
  pattern: "moviein",
  desc: "Pro Movie Info (no api + trailer)",
  category: "search",
  react: "🎬",
  filename: __filename
},
async (conn, mek, m, { args }) => {

  try {
    if (!args[0]) return m.reply("❌ Movie name ekak denna!");

    const query = args.join(" ");
    const res = await axios.get(`https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(query)}`);

    const list = res.data.description;

    if (!list || !list.length) {
      return m.reply("❌ Movie hoyaganna ba!");
    }

    let msg = `🎬 *MOVIE SEARCH RESULTS*\n`;
    msg += `━━━━━━━━━━━━━━━\n\n`;

    // top 3 results
    for (let i = 0; i < Math.min(3, list.length); i++) {
      let mv = list[i];

      msg += `🔢 *${i + 1}.* ${mv["#TITLE"]}\n`;
      msg += `📅 Year: ${mv["#YEAR"]}\n`;
      msg += `⭐ Rating: ${mv["#IMDB_RATING"] || "N/A"}\n`;
      msg += `━━━━━━━━━━━━━━━\n`;
    }

    msg += `\n💡 Reply 1 / 2 / 3 for full info`;

    // save list
    global.movieSelection[m.sender] = list;

    await conn.sendMessage(m.chat, {
      image: { url: list[0]["#IMG_POSTER"] },
      caption: msg
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    m.reply("❌ Error ekak awaa!");
  }

});


// ================= SELECT (REPLY NUMBER) =================
cmd({
  on: "text"
}, async (conn, mek, m) => {

  try {
    if (!global.movieSelection[m.sender]) return;

    const num = parseInt(m.body);

    if (isNaN(num) || num < 1 || num > 3) return;

    const movie = global.movieSelection[m.sender][num - 1];

    let title = movie["#TITLE"];
    let year = movie["#YEAR"];

    // trailer link
    let trailer = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " " + year + " trailer")}`;

    let msg = `🎬 *FULL MOVIE INFO*\n\n`;
    msg += `📌 Title: ${title}\n`;
    msg += `📅 Year: ${year}\n`;
    msg += `⭐ Rating: ${movie["#IMDB_RATING"] || "N/A"}\n`;
    msg += `🎭 Actors: ${movie["#ACTORS"] || "N/A"}\n`;
    msg += `🆔 IMDb ID: ${movie["#IMDB_ID"]}\n\n`;

    msg += `🎥 Trailer:\n${trailer}`;

    await conn.sendMessage(m.chat, {
      image: { url: movie["#IMG_POSTER"] },
      caption: msg
    }, { quoted: mek });

    // clear session
    delete global.movieSelection[m.sender];

  } catch (e) {
    console.log(e);
  }

});
