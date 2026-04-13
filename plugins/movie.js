const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

const cineApiKey = "79653f59-d918-4a00-9143-bee74a6b4c82";

const hirux_footer = "> 𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 - 𝙑 1🤍💫";

cmd(
  {
    pattern: "cine",
    alias: ["cinesub", "cinesubz"],
    react: "🎬",
    desc: "Search and Download cinesub movie.",
    category: "movie",
    use: ".cine <movie name>",
    filename: __filename
  },

  async (conn, mek, m, { from, reply, q }) => {

    if (!cineApiKey) return reply("⚠️ API key missing.");
    if (!q) return reply("❌ Enter movie name.");

    const react = async (msgKey, emoji) => {
      try {
        await conn.sendMessage(from, { react: { text: emoji, key: msgKey } });
      } catch {}
    };

    try {

      const search = await fetchJson(
        `https://dark-yasiya-api-cine.vercel.app/api/cinesubz/search?q=${encodeURIComponent(q)}&apikey=test`
      );

      const mvDatas = search?.data?.data?.data || [];
      if (!mvDatas.length) return reply("❌ No results found.");

      let list = "*🎬 CINESUB RESULTS*\n\n";

      mvDatas.forEach((m, i) => {
        const title = (m.title || "No title")
          .replace(/Sinhala Subtitles \| සිංහල උපසිරැසි සමඟ/gi, "")
          .trim();

        list += `*${i + 1} | ${title}*\n`;
      });

      const listMsg = await conn.sendMessage(
        from,
        { text: list + "\n\nReply with number." + hirux_footer },
        { quoted: mek }
      );

      const listMsgId = listMsg.key.id;

      const handler = async (update) => {
        const msg = update.messages?.[0];
        if (!msg?.message) return;

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text;

        const replyTo =
          msg.message?.extendedTextMessage?.contextInfo?.stanzaId;

        if (replyTo !== listMsgId) return;

        const index = parseInt(text) - 1;
        if (isNaN(index) || index < 0 || index >= mvDatas.length)
          return reply("❌ Invalid number.");

        await react(msg.key, "✅");

        const chosen = mvDatas[index];

        const info = await fetchJson(
          `https://manojapi.infinityapi.org/api/v1/cinesubz-movie?url=${encodeURIComponent(chosen.link)}&apiKey=${cineApiKey}`
        );

        const mvInfo = info?.results;
        const dlLinks = mvInfo?.dl_links || [];

        if (!dlLinks.length) return reply("❌ No download links.");

        let qualityList = "";
        dlLinks.forEach((item, i) => {
          qualityList += `*${i + 1} | ${item.quality} - ${item.size}*\n`;
        });

        const qualityMsg = await conn.sendMessage(
          from,
          {
            image: { url: mvInfo?.thumb?.url || "" },
            caption: `
🎬 *Title:* ${mvInfo?.title}
🌟 *IMDb:* ${mvInfo?.IMDb_Rating || "N/A"}
📅 *Year:* ${mvInfo?.release_date || "N/A"}

🔽 Reply number to download:

${qualityList}
${hirux_footer}
            `
          },
          { quoted: msg }
        );

        const qualityMsgId = qualityMsg.key.id;

        const qualityHandler = async (tUpdate) => {
          const tMsg = tUpdate.messages?.[0];
          if (!tMsg?.message) return;

          const tText =
            tMsg.message.conversation ||
            tMsg.message.extendedTextMessage?.text;

          const replyTo2 =
            tMsg.message?.extendedTextMessage?.contextInfo?.stanzaId;

          if (replyTo2 !== qualityMsgId) return;

          const tIndex = parseInt(tText) - 1;
          if (isNaN(tIndex) || tIndex < 0 || tIndex >= dlLinks.length)
            return reply("❌ Invalid number.");

          await react(tMsg.key, "⬇️");

          const downloadPage = dlLinks[tIndex].link;

          const dl = await fetchJson(
            `https://manojapi.infinityapi.org/api/v1/cinesubz-download?url=${encodeURIComponent(downloadPage)}&apiKey=${cineApiKey}`
          );

          const result = dl?.results;

          const fileUrl = result?.pix1 || result?.pix2;

          if (!fileUrl) return reply("❌ Download link not found.");

          await conn.sendMessage(from, {
            document: { url: fileUrl },
            mimetype: "video/mp4",
            fileName: `${result?.name || "movie"}.mp4`,
            caption: `🎬 ${result?.name}\n${hirux_footer}`
          });

          await conn.sendMessage(from, {
            text: "✅ Download completed!"
          });

          conn.ev.off("messages.upsert", qualityHandler);
        };

        conn.ev.on("messages.upsert", qualityHandler);
        conn.ev.off("messages.upsert", handler);
      };

      conn.ev.on("messages.upsert", handler);

    } catch (e) {
      console.log(e);
      reply("❌ Error: " + e.message);
    }
  }
);
