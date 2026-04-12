const { cmd } = require('../command');

cmd({
    pattern: "forward",
    desc: "forward messages (media + text)",
    alias: ["fv"],
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender, args }) => {

    if (!m.quoted) {
        return reply("❌ Reply to a message first.");
    }

    const targetJid = args[0] || q;

    if (!targetJid || !targetJid.includes("@")) {
        return reply("❌ Invalid JID!\nExample: .forward 947xxxx@s.whatsapp.net");
    }

    try {

        await conn.sendMessage(sender, { react: { text: "📤", key: mek.key } });

        // 🔥 PRO FIX: works for images/videos/docs/stickers/text
        await conn.copyNForward(targetJid, m.quoted, false, {
            readViewOnce: true
        });

        await reply(`✅ Successfully forwarded to:\n${targetJid}`);

        await conn.sendMessage(sender, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        reply(`❌ Error: ${error.message}`);
    }
});
