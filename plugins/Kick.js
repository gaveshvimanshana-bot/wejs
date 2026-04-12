const { cmd } = require('../command');

cmd({
    pattern: "forward",
    alias: ["fv", "fo"],
    desc: "Forward a quoted message to a given JID.",
    category: "owner",
    use: '.forward <JID address>',
    filename: __filename
},
async (conn, mek, m, { from, quoted, args, q, isOwner, reply }) => {
    try {
  
        if (!m.quoted) {
            return reply(`❌ *Error:* Please reply to the message you want to forward.\n\n> ® ɢʜᴏsᴛ ᴍᴅ`);
        }
        const targetJid = q.trim();
        if (!targetJid || !targetJid.includes('@')) {
            return reply(`❌ *Invalid JID!*\n\n▫️ *Usage:* .fv [target_jid]\n▫️ *Example:* .fv 947xxxxxxxxx@s.whatsapp.net`);
        }
        await conn.sendMessage(from, { react: { text: "📤", key: mek.key } });
        await conn.forwardMessage(targetJid, m.quoted.fakeObj, true);
        await conn.sendMessage(from, { 
            text: `✅ *Successfully Forwarded!*\n\n▫️ *Target:* \`${targetJid}\`\n\n> ® ɢʜᴏsᴛ ᴍᴅ ᴍɪɴɪ` 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error(error);
        return reply(`❌ *Forwarding Failed!*\n\n▫️ *Reason:* ${error.message}\n\n> ® ɢʜᴏsᴛ ᴍᴅ`);
    }
});
