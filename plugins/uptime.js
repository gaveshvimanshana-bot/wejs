const { cmd } = require("../command");
const os = require("os");

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

cmd(
  {
    pattern: "uptime",
    react: "⏱️", // WhatsApp react emoji
    desc: "Show bot uptime & system info",
    category: "main",
    filename: __filename,
  },
  async (danuwa, mek, m, { reply }) => {
    const uptime = process.uptime();
    const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalRam = Math.round(os.totalmem() / 1024 / 1024);

    // Send react emoji
    await danuwa.sendMessage(m.key.remoteJid, { react: { text: "⏱️", key: m.key } });

    // Send full info reply
    const infoMessage = `───────────────────◉▷
┝ ✨ *Runtime :-  ${formatUptime(uptime)}*    
┝ 🎁 *Ram usage :- ${ramUsage}MB / ${totalRam}MB*
┝ 🦕 *Platform :- ${os.hostname()}*
┝ 🥀 *Owner :- Mr Gavesh </>*
┝ 👾 *Version :- 1.0.0*`;

    reply(infoMessage);
  }
);
