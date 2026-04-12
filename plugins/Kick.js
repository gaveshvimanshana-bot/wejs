const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "forward",
    desc: "forward messages & files",
    alias: ["fo"],
    category: "owner",
    filename: __filename
},

async (conn, mek, m, { from, q, isOwner, reply }) => {

  
    if (!q || !m.quoted) return reply("❌ Reply to a message" );

    try {
       
        const quoted = m.quoted;
        let mediaBuffer = null;
        if (quoted.type === 'imageMessage' || quoted.type === 'videoMessage' || 
            quoted.type === 'audioMessage' || quoted.type === 'documentMessage') {
            mediaBuffer = await quoted.download();
            await conn.sendMessage(q, {
                [quoted.type.replace('Message', '')]: mediaBuffer,
                caption: quoted.caption || '',
                mimetype: quoted.mimetype
            });
        } 
        else if (quoted.text) {
            await conn.sendMessage(q, {
                text: `📨 Forwarded:\n\n${quoted.text}`
            });
        }
        else if (quoted.type === 'stickerMessage') {
            mediaBuffer = await quoted.download();
            await conn.sendMessage(q, {
                sticker: mediaBuffer
            });
        }
        
        reply(`✅ Forwarded successfully to: ${q}`);
        
    } catch (error) {
        reply(`❌ Error: ${error.message}`);
    }
});
