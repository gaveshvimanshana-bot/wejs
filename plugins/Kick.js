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
        
        const quoted = m.quoted;
        const messageType = Object.keys(quoted.message)[0];
        if (messageType === 'conversation') {
            await conn.sendMessage(targetJid, { text: quoted.message.conversation });
        }
        else if (messageType === 'extendedTextMessage') {
            await conn.sendMessage(targetJid, { text: quoted.message.extendedTextMessage.text });
        }
        else if (messageType === 'imageMessage') {
            const media = await conn.downloadMediaMessage(quoted);
            await conn.sendMessage(targetJid, { 
                image: media, 
                caption: quoted.message.imageMessage.caption || "" 
            });
        }
        else if (messageType === 'videoMessage') {
            const media = await conn.downloadMediaMessage(quoted);
            await conn.sendMessage(targetJid, { 
                video: media, 
                caption: quoted.message.videoMessage.caption || "" 
            });
        }
        else if (messageType === 'audioMessage') {
            const media = await conn.downloadMediaMessage(quoted);
            await conn.sendMessage(targetJid, { 
                audio: media, 
                mimetype: 'audio/mpeg' 
            });
        }
        else if (messageType === 'documentMessage') {
            const media = await conn.downloadMediaMessage(quoted);
            await conn.sendMessage(targetJid, { 
                document: media, 
                mimetype: quoted.message.documentMessage.mimetype,
                fileName: quoted.message.documentMessage.fileName
            });
        }
        else if (messageType === 'stickerMessage') {
            const media = await conn.downloadMediaMessage(quoted);
            await conn.sendMessage(targetJid, { sticker: media });
        }
        else {
            await conn.sendMessage(targetJid, { text: "[Message cannot be forwarded]" });
        }
        
        await reply(`✅ Forwarded to: ${targetJid}`);
        await conn.sendMessage(sender, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
        try {
            await conn.sendMessage(targetJid, { text: "Original message could not be forwarded" });
        } catch(e) {}
    }
});
