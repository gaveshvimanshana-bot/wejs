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
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Please provide a Facebook video URL!");

      const fbRegex = /(https?:\/\/)?(www\.)?(facebook|fb)\.com\/.+/;
      if (!fbRegex.test(q)) {
        return reply("❌ Invalid Facebook URL!");
      }

      const react = async (msgKey, emoji) => {
        try {
          await conn.sendMessage(from, {
            react: { text: emoji, key: msgKey },
          });
        } catch {}
      };

      await reply("📥 Fetching video info...");

      const result = await getFbVideoInfo(q);

      if (!result || (!result.sd && !result.hd)) {
        return reply("❌ Failed to fetch video.");
      }

      const { title, sd, hd } = result;

      //================== BUTTON MESSAGE ==================
      const buttons = [
        { buttonId: "fb_hd", buttonText: { displayText: "🎥 HD Quality" }, type: 1 },
        { buttonId: "fb_sd", buttonText: { displayText: "📉 SD Quality" }, type: 1 }
      ];

      const buttonMsg = await conn.sendMessage(
        from,
        {
          image: {
            url: "https://raw.githubusercontent.com/gaveshvimanshana-bot/Dinu-md-/refs/heads/main/Imqge/file_0000000025707208a5167eff51d93f68%20(1).png",
          },
          caption:
            `╭━━〔 *FB VIDEO INFO* 〕━━╮\n\n` +
            `👻 *Title* : ${title || "Unknown"}\n\n` +
            `🔘 *Select Quality Below*\n\n` +
            `╰━━━━━━━━━━━━━━━━━━━━╯`,
          buttons: buttons,
          headerType: 4,
        },
        { quoted: mek }
      );

      const msgId = buttonMsg.key.id;

      //================== LISTENER ==================
      const handler = async (update) => {
        const msg = update?.messages?.[0];
        if (!msg?.message) return;

        const btnId =
          msg.message?.buttonsResponseMessage?.selectedButtonId;

        const isReply =
          msg?.message?.buttonsResponseMessage?.contextInfo?.stanzaId === msgId;

        if (!isReply) return;
        if (!btnId) return;

        await react(msg.key, "🎥");

        let videoUrl;
        let quality;

        if (btnId === "fb_hd") {
          videoUrl = hd || sd;
          quality = "HD";
        } else if (btnId === "fb_sd") {
          videoUrl = sd;
          quality = "SD";
        } else {
          return;
        }

        // remove listener ✅
        conn.ev.off("messages.upsert", handler);

        //================== SEND VIDEO ==================
        await conn.sendMessage(
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

      conn.ev.on("messages.upsert", handler);

    } catch (e) {
      console.error(e);
      reply(`❌ Error: ${e.message || e}`);
    }
  }
);
