const { cmd } = require('../command');

cmd({
    pattern: "getdp",
    alias: ["takedp"],
    react: "🖼️",
    desc: "Check user info - shows phone number and profile picture",
    category: "group",
    use: '.check [number]',
    filename: __filename
}, 
async (conn, mek, m, {
    from, args, reply
}) => {
    try {
        const number = args[0]?.replace(/[^0-9]/g, '');
        if (!number) return reply("❌ Please provide a valid number.\n*Example:* .check 9476xxxxxxx");
        const jid = number + "@s.whatsapp.net";

        // Get user profile picture
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(jid, 'image');
        } catch {
            ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png'; // default image
        }

        // Prepare caption with number only
        let caption = `*☘️ 𝙐𝙨𝙚𝙧 𝙄𝙣𝙛𝙤*\n\n*📱𝙋𝙝𝙤𝙣𝙚:* +${number}`;

        // Send DP image with caption
        await conn.sendMessage(from, { image: { url: ppUrl }, caption }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`❌ *Error Occurred!!*\n\n${e.message}`);
    }
});
