const { cmd } = require("../command");
const getFbVideoInfo = require("@xaviabot/fb-downloader");

cmd(
  {
    pattern: "fb",
    alias: ["facebook"],
    react: "📥",
    desc: "Download Facebook Video",
    category: "download",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, q, reply }) => {
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

      const { title, sd, hd } = result;

      //================== ASK QUALITY ==================
      const ask = await danuwa.sendMessage(
        from,
        {
          text:
            `╭━━〔 *FB VIDEO DOWNLOADER* 〕━━╮\n\n` +
            `👻 *Title* : ${title || "Unknown"}\n\n` +
            `🔢 *Reply below number:*\n\n` +
            `1 | 🎥 HD Quality\n` +
            `2 | 📉 SD Quality\n\n` +
            `╰━━━━━━━━━━━━━━━━━━━━╯`,
        },
        { quoted: mek }
      );

      const msgId = ask.key.id;

      //================== LISTENER ==================
      const handler = async (update) => {
        const msg = update?.messages?.[0];
        if (!msg?.message) return;

        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text;

        const isReply =
          msg?.message?.extendedTextMessage?.contextInfo?.stanzaId === msgId;

        if (!isReply) return;

        const choice = text.trim();

        let videoUrl;
        let quality;

        if (choice === "1") {
          videoUrl = hd || sd;
          quality = "HD";
        } else if (choice === "2") {
          videoUrl = sd;
          quality = "SD";
        } else {
          return reply("❌ Invalid choice! Reply 1 or 2");
        }

        // remove listener after use ✅
        danuwa.ev.off("messages.upsert", handler);

        //================== SEND VIDEO ==================
        await danuwa.sendMessage(
          from,
          {
            video: { url: videoUrl },
            caption:
              `╭━━〔 📥 VIDEO DOWNLOADED 〕━━╮\n` +
              `📡 Quality : ${quality}\n` +
              `🎬 ${title || ""}\n\n` +
              `⚡ VIMA-✘-MD BOT\n` +
              `╰━━━━━━━━━━━━━━━━━━━━╯`,
          },
          { quoted: msg }
        );
      };

      danuwa.ev.on("messages.upsert", handler);

    } catch (e) {
      console.error(e);
      reply(`❌ Error: ${e.message || e}`);
    }
  }
);
