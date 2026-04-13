const { cmd } = require("../command");
const getFbVideoInfo = require("@xaviabot/fb-downloader");

// HTML decode function 🔥
function decodeHtml(html) {
  return html
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

cmd(
  {
    pattern: "fb",
    alias: ["facebook"],
    react: "📥",
    desc: "Download Facebook Video",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Please provide a Facebook video URL!");

      const fbRegex = /(https?:\/\/)?(www\.)?(facebook|fb)\.com\/.+/;
      if (!fbRegex.test(q)) {
        return reply("❌ Invalid Facebook URL!");
      }

      await reply("📥 Fetching video info...");

      const result = await getFbVideoInfo(q);

      if (!result || (!result.sd && !result.hd)) {
        return reply("❌ Failed to fetch video.");
      }

      let { title, sd, hd } = result;

      // decode title 🔥
      title = decodeHtml(title || "Unknown");

      //================== LIST MESSAGE ==================
      const listMsg = {
        text:
          `╭━━〔 *FB VIDEO INFO* 〕━━╮\n\n` +
          `👻 *Title* : ${title}\n\n` +
          `🔘 Select Quality Below 👇\n\n` +
          `╰━━━━━━━━━━━━━━━━━━━━╯`,
        footer: "VIMA-✘-MD",
        title: "FB DOWNLOADER",
        buttonText: "Choose Quality",
        sections: [
          {
            title: "Quality Options",
            rows: [
              { title: "🎥 HD Quality", rowId: "fb_hd" },
              { title: "📉 SD Quality", rowId: "fb_sd" },
            ],
          },
        ],
      };

      const sentMsg = await conn.sendMessage(from, listMsg, {
        quoted: mek,
      });

      const msgId = sentMsg.key.id;

      //================== HANDLER ==================
      const handler = async (update) => {
        const msg = update?.messages?.[0];
        if (!msg?.message) return;

        const selected =
          msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId;

        const isReply =
          msg.message?.listResponseMessage?.contextInfo?.stanzaId === msgId;

        if (!isReply) return;
        if (!selected) return;

        let videoUrl;
        let quality;

        if (selected === "fb_hd") {
          videoUrl = hd || sd;
          quality = "HD";
        } else if (selected === "fb_sd") {
          videoUrl = sd;
          quality = "SD";
        } else {
          return;
        }

        // remove listener 🔥
        conn.ev.off("messages.upsert", handler);

        //================== SEND VIDEO ==================
        await conn.sendMessage(
          from,
          {
            video: { url: videoUrl },
            caption:
              `╭━━〔 📥 VIDEO DOWNLOADED 〕━━╮\n` +
              `📡 Quality : ${quality}\n` +
              `🎬 ${title}\n\n` +
              `⚡ VIMA-✘-MD BOT\n` +
              `╰━━━━━━━━━━━━━━━━━━━━╯`,
          },
          { quoted: msg }
        );
      };

      conn.ev.on("messages.upsert", handler);

    } catch (e) {
      console.error(e);
      reply(`❌ Error: ${e.message || e}`);
    }
  }
);
