const { cmd } = require('../command');

cmd({
    pattern: "forward",
    desc: "forward messages with watermark",
    alias: ["fv"],
    category: "owner",
    filename: __filename
},

async (conn, mek, m, { from, q, isOwner, reply, sender, args }) => {
    
    if (!m.quoted) {
        return reply("❌ Please reply to the message you want to forward.");
    }
    
    const targetJid = args[0] || q;
    if (!targetJid || !targetJid.includes('@')) {
        return reply(`❌ Invalid JID!\n\nUsage: .forward [target_jid]\nExample: .forward 947xxxx@s.whatsapp.net`);
    }

    try {
        await conn.sendMessage(sender, { react: { text: "📤", key: mek.key } });
        await conn.sendMessage(targetJid, { 
            forward: m.quoted
        });
        
        await reply(`✅ Forwarded to: ${targetJid}`);
        await conn.sendMessage(sender, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});
