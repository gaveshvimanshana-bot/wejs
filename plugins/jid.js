const { cmd } = require("../command");

cmd({
  pattern: "jid",
  desc: "Get JID of user or chat",
  react: "🆔",
  category: "utility",
  filename: __filename
},
async (conn, mek, m, { from, quoted, sender }) => {

  try {

    let target = quoted ? quoted.sender : sender;

    let text = `
🆔 *JID*

👤 ${target}
💬 ${from}

━━━━━━━━━━━━━━━━━━
® 𝚅𝙸𝙼𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 🔸🛡️🔸
`;

    await conn.sendMessage(from, { text }, { quoted: mek });

  } catch (e) {
    console.log(e);
    await conn.sendMessage(from, { text: "❌ Error getting JID" }, { quoted: mek });
  }

});
