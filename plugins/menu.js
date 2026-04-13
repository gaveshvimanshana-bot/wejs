const config = require('../settings');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const axios = require('axios');

cmd({
    pattern: "menu",
    desc: "Show interactive menu system",
    category: "menu",
    react: "🧾",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Get Sri Lanka time
        const date = new Date();
        const timeString = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Colombo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);

        // Greeting in Sinhala based on Sri Lanka time
        const hourNumber = parseInt(new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Colombo',
            hour: '2-digit',
            hour12: false
        }).format(date));

        let greeting = "Good Night !";
        if (hourNumber < 12) greeting = "Good Morning !";
        else if (hourNumber < 18) greeting = "Good Afternoon!";

        const senderName = m.pushName || "User";

        // Menu caption with dynamic info
        const menuCaption = `*◄●●━━𝗛𝗜𝗥𝗨 𝗫 𝗠𝗗 𝗩𝟭━━●●►*

*╭─「 ʙᴏᴛ ᴅᴇᴛᴀɪʟꜱ  ──●●►*
*│*🙋 *𝘜𝘴𝘦𝘳 =* ${senderName}
*│⏰ 𝘓𝘰𝘤𝘢𝘭 𝘛𝘪𝘮𝘦 =* ${timeString}
*│💬 𝘎𝘳𝘦𝘦𝘵𝘪𝘯𝘨 =* ${greeting}
*│*👾 *𝘉𝘰𝘵 = ʜɪʀᴜ x ᴍᴅ ᴠ1*
*│*☎️ *𝘖𝘸𝘯𝘦𝘳 𝘕𝘣 = 94702529242*
*│*✒️ *𝘗𝘳𝘦𝘧𝘪𝘹 = .*
*╰──────────●●►*

🔢 *ʀᴇᴘʟʏ ᴛʜᴇ ɴᴜᴍʙᴇʀ ʙᴇʟᴏᴡ* 😼

*☘️ 1* ❱❱⦁ *_𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗠𝗘𝗡𝗨_*
*☘️ 2* ❱❱⦁ *_𝗚𝗥𝗢𝗨𝗣 𝗠𝗘𝗡𝗨_*
*☘️ 3* ❱❱⦁ *_𝗙𝗨𝗡 𝗠𝗘𝗡𝗨_*
*☘️ 4* ❱❱⦁ *_𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨_*
*☘️ 5* ❱❱⦁ *_𝗔𝗜 𝗠𝗘𝗡𝗨_*
*☘️ 6* ❱❱⦁ *_𝗔𝗡𝗜𝗠𝗘 𝗠𝗘𝗡𝗨_*
*☘️ 7* ❱❱⦁ *_𝗖𝗢𝗡𝗩𝗘𝗥𝗧 𝗠𝗘𝗡𝗨_*
*☘️ 8* ❱❱⦁ *_𝗢𝗧𝗛𝗘𝗥 𝗠𝗘𝗡𝗨_*
*☘️ 9* ❱❱⦁ *_𝗥𝗘𝗔𝗖𝗧𝗜𝗢𝗡 𝗠𝗘𝗡𝗨_*
*☘️ 10* ❱❱⦁ *_𝗠𝗔𝗜𝗡 𝗠𝗘𝗡𝗨_*
*☘️ 11* ❱❱⦁ *_𝗟𝗢𝗚𝗢 𝗠𝗘𝗡𝗨_*

> *𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 -  𝘽𝙊𝙏*`;

        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: false,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '',
                newsletterName: '',
                serverMessageId: 143
            }
        };

        // Function to send menu video with timeout
        const sendMenuVideo = async () => {
            try {
                return await conn.sendMessage(
                    from,
                    {
                        video: { url: 'https://files.catbox.moe/2wi6av.mp4' },
                        mimetype: 'video/mp4', // Correct property name
                        ptv: true // Set PTV to true for WhatsApp video message
                    },
                    { quoted: mek }
                );
            } catch (e) {
                console.log('Video send failed, continuing without it:', e);
                throw e; // Let the error propagate to fallback to image
            }
        };

        // Function to send menu image with timeout
        const sendMenuImage = async () => {
            try {
                return await conn.sendMessage(
                    from,
                    {
                        image: { url: 'https://files.catbox.moe/88ec05.jpg' },
                        caption: menuCaption,
                        contextInfo: contextInfo
                    },
                    { quoted: mek }
                );
            } catch (e) {
                console.log('Image send failed, falling back to text:', e);
                return await conn.sendMessage(
                    from,
                    { text: menuCaption, contextInfo: contextInfo },
                    { quoted: mek }
                );
            }
        };

        // Function to send menu audio with timeout
        const sendMenuAudio = async () => {
            try {
                return await conn.sendMessage(
                    from,
                    {
                        audio: { url: 'https://files.catbox.moe/8d3t7v.mp3' },
                        mimetype: 'audio/mp4',
                        ptt: true
                    },
                    { quoted: mek }
                );
            } catch (e) {
                console.log('Audio send failed, continuing without it:', e);
            }
        };

        // Send video, then image, then audio sequentially
        let sentMsg;
        try {
            // Send video with 12s timeout
            await Promise.race([
                sendMenuVideo(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Video send timeout')), 12000))
            ]);

            // Send image with 10s timeout
            sentMsg = await Promise.race([
                sendMenuImage(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Image send timeout')), 10000))
            ]);

            // Then send audio with 1s delay and 8s timeout
            await new Promise(resolve => setTimeout(resolve, 1000));
            await Promise.race([
                sendMenuAudio(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Audio send timeout')), 8000))
            ]);
        } catch (e) {
            console.log('Menu send error:', e);
            if (!sentMsg) {
                sentMsg = await conn.sendMessage(
                    from,
                    { text: menuCaption, contextInfo: contextInfo },
                    { quoted: mek }
                );
            }
        }

        const messageID = sentMsg.key.id;

        // Menu data (complete version)
        const menuData = {
            '1': {
                title: "📥 *Download Menu* 📥",
                content: `*◄●●━━𝗛𝗜𝗥𝗨 𝗫 𝗠𝗗 𝗩𝟭━━●●►*

☘️ *_𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗠𝗘𝗡𝗨_* ☘️

*●𝘚𝘰𝘯𝘨*
*●𝘝𝘪𝘥𝘦𝘰*
*●𝘈𝘱𝘬*
*●𝘛𝘪𝘬𝘵𝘰𝘬*
*●𝘍𝘢𝘤𝘦𝘣𝘰𝘰𝘬*
*●𝘗𝘥𝘧*
*●𝘊𝘪𝘯𝘦𝘴𝘶𝘣𝘻*
*●𝘚𝘪𝘯𝘩𝘢𝘭𝘢𝘴𝘶𝘣*
*●𝘛𝘸𝘪𝘵𝘵𝘦𝘳*
*●𝘐𝘮𝘢𝘨𝘦*
*●𝘗𝘪𝘯𝘵𝘳𝘦𝘴𝘵*
*●𝘈𝘶𝘥𝘰*
*●𝘠𝘵𝘮𝘱3*
*●𝘓𝘺𝘳𝘪𝘤*
*●𝘊𝘴𝘰𝘯𝘨*
*●𝘗𝘭𝘢𝘺*
*●𝘗𝘰𝘳𝘯𝘩𝘶𝘣*
*●𝘗𝘪𝘯𝘵𝘳𝘦𝘴𝘵𝘴𝘦𝘢𝘳𝘤𝘩*
*●𝘈𝘯𝘪𝘮𝘢𝘱𝘰𝘳𝘯*
*●𝘟𝘯𝘹𝘹*
*●𝘛𝘵𝘴*
*●𝘞𝘢𝘭𝘭𝘱𝘢𝘱𝘦𝘳*
*●𝘠𝘵𝘴*

*➥ 𝘛𝘰𝘵𝘢𝘭 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴 𝘐𝘯 𝘋𝘰𝘸𝘯𝘭𝘰𝘢𝘥 23*

> *𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 -  𝘽𝙊𝙏*`,
                image: true
            },
            '2': {
                title: "👥 *Group Menu* 👥",
                content: `*◄●●━━𝗛𝗜𝗥𝗨 𝗫 𝗠𝗗 𝗩𝟭━━●●►*

☘️ *_𝗚𝗥𝗢𝗨𝗣 𝗠𝗘𝗡𝗨_* ☘️

*●𝘎𝘳𝘰𝘶𝘱𝘭𝘪𝘯𝘬*
*●𝘒𝘪𝘤𝘬𝘢𝘭𝘭*
*●𝘈𝘥𝘥*
*●𝘙𝘦𝘮𝘰𝘷𝘦*
*●𝘗𝘳𝘰𝘮𝘰𝘵𝘦*
*●𝘋𝘪𝘴𝘮𝘪𝘴𝘴*
*●𝘙𝘦𝘷𝘰𝘳𝘬*
*●𝘔𝘶𝘵𝘦*
*●𝘛𝘢𝘨*
*●𝘛𝘢𝘨𝘢𝘭𝘭*
*●𝘎𝘪𝘯𝘧𝘰*
*●𝘑𝘰𝘪𝘯*
*●𝘠𝘵𝘮𝘱3*
*●𝘋𝘭𝘦𝘵𝘦𝘭𝘪𝘯𝘬*
*●𝘐𝘯𝘷𝘪𝘵𝘦*
*●𝘏𝘪𝘥𝘦𝘵𝘢𝘨*
*●𝘛𝘢𝘨𝘢𝘥𝘮𝘪𝘯𝘴*

*➥ 𝘛𝘰𝘵𝘢𝘭 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴 𝘐𝘯 𝘎𝘳𝘰𝘶𝘱 17*

> *𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 -  𝘽𝙊𝙏*`,
                image: true
            },
            '3': {
                title: "😄 *Fun Menu* 😄",
                content: `*◄●●━━𝗛𝗜𝗥𝗨 𝗫 𝗠𝗗 𝗩𝟭━━●●►*

☘️ *_𝗙𝗨𝗡 𝗠𝗘𝗡𝗨_* ☘️

*●𝘈𝘶𝘳𝘢*
*●𝘙𝘰𝘢𝘴𝘵*
*●8𝘣𝘢𝘭𝘭*
*●𝘓𝘰𝘷𝘦𝘵𝘦𝘴𝘵*
*●𝘌𝘮𝘰𝘫𝘪*
*●𝘚𝘩𝘪𝘱*
*●𝘈𝘯𝘪𝘮𝘦𝘨𝘪𝘳𝘭 (1,2,3,4,5)*
*●𝘋𝘰𝘨*
*●𝘏𝘶𝘨*
*●𝘏𝘢𝘤𝘬*
*●𝘊𝘳𝘺*
*●𝘊𝘶𝘥𝘥𝘭𝘦*
*●𝘉𝘶𝘭𝘭𝘺*
*●𝘈𝘸𝘰𝘰*
*●𝘓𝘪𝘤𝘬*
*●𝘗𝘢𝘵*
*●𝘚𝘮𝘶𝘨*
*●𝘉𝘰𝘯𝘬*
*●𝘠𝘦𝘦𝘵*
*●𝘉𝘭𝘶𝘴𝘩*
*●𝘏𝘢𝘯𝘥𝘩𝘰𝘭𝘥*
*●𝘏𝘪𝘨𝘦𝘧𝘪𝘷𝘦*
*●𝘕𝘰𝘮*
*●𝘞𝘢𝘷𝘦*
*●𝘚𝘮𝘪𝘭𝘦*
*●𝘏𝘢𝘱𝘱𝘺*
*●𝘎𝘭𝘰𝘮𝘱*
*●𝘉𝘪𝘵𝘦*
*●𝘊𝘳𝘪𝘯𝘨𝘦*
*●𝘋𝘢𝘯𝘤𝘦*
*●𝘒𝘪𝘭𝘭*
*●𝘚𝘭𝘢𝘱*
*●𝘒𝘪𝘴𝘴*
*●𝘊𝘰𝘪𝘯𝘧𝘭𝘪𝘱*
*●𝘧𝘭𝘪𝘱*
*●𝘑𝘰𝘬𝘦*
*●𝘗𝘪𝘤𝘬*
*●𝘛𝘳𝘶𝘵𝘩*
*●𝘍𝘢𝘤𝘵*
*●𝘗𝘪𝘤𝘬𝘶𝘱𝘭𝘪𝘯𝘦*
*●𝘙𝘦𝘱𝘦𝘢𝘵*
*●𝘛𝘵𝘴 (2,3)*

*➥ 𝘛𝘰𝘵𝘢𝘭 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴 𝘐𝘯 𝘍𝘶𝘯 42*

> *𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 -  𝘽𝙊𝙏*`,
                image: true
            },
            '4': {
                title: "👑 *Owner Menu* 👑",
                content: `*◄●●━━𝗛𝗜𝗥𝗨 𝗫 𝗠𝗗 𝗩𝟭━━●●►*

☘️ *_𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨_* ☘️

*●𝘉𝘭𝘰𝘤𝘬*
*●𝘜𝘯𝘣𝘭𝘰𝘤𝘬*
*●𝘚𝘦𝘵𝘧𝘶𝘭𝘭𝘱𝘱*
*●𝘙𝘦𝘴𝘵𝘢𝘳𝘵*
*●𝘚𝘩𝘶𝘵𝘥𝘰𝘸𝘯*
*●𝘑𝘪𝘥*
*●𝘎𝘫𝘪𝘥*
*●𝘝𝘷*
*●𝘍𝘰𝘳𝘸𝘢𝘳𝘥𝘦𝘥*
*●𝘓𝘦𝘢𝘷𝘦*
*●𝘊𝘫𝘪𝘥*
*●𝘎𝘦𝘵𝘥𝘱*
*●𝘊𝘰𝘶𝘯𝘵𝘹*
*●𝘊𝘰𝘶𝘯𝘵*
*●𝘚𝘢𝘷𝘦*

*➥ 𝘛𝘰𝘵𝘢𝘭 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴 𝘐𝘯 𝘖𝘸𝘯𝘦𝘳 14*

> *𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 -  𝘽𝙊𝙏*`,
                image: true
            },
            '5': {
                title: "🤖 *AI Menu* 🤖",
                content: `*◄●●━━𝗛𝗜𝗥𝗨 𝗫 𝗠𝗗 𝗩𝟭━━●●►*

☘️ *_𝗔𝗜 𝗠𝗘𝗡𝗨_* ☘️

*●𝘈𝘪𝘪𝘮𝘨*
*●𝘎𝘦𝘮𝘪𝘯𝘪*
*●𝘋𝘦𝘦𝘱𝘴𝘦𝘦𝘬*
*●𝘤𝘩𝘢𝘵𝘨𝘱𝘵*
*●𝘈𝘪*

*➥ 𝘛𝘰𝘵𝘢𝘭 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴 𝘐𝘯 𝘈𝘪 5*

> *𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 -  𝘽𝙊𝙏*`,
                image: true
            },
            '6': {
                title: "🎎 *Anime Menu* 🎎",
                content: `*◄●●━━𝗛𝗜𝗥𝗨 𝗫 𝗠𝗗 𝗩𝟭━━●●►*

☘️ *_𝗔𝗡𝗜𝗠𝗘 𝗠𝗘𝗡𝗨_* ☘️

*●𝘞𝘢𝘪𝘧𝘶*
*●𝘕𝘦𝘬𝘰*
*●𝘔𝘦𝘨𝘶𝘮𝘪𝘯*
*●𝘔𝘢𝘪𝘥*
*●𝘈𝘸𝘰𝘰*
*●𝘍𝘢𝘤𝘬*
*●𝘈𝘯𝘪𝘮𝘦𝘨𝘪𝘳𝘭 (1,2,3,4,5)*
*●𝘋𝘰𝘨*
*●𝘎𝘢𝘳𝘭*
*●𝘍𝘰𝘹𝘨𝘪𝘳𝘭*

*➥ 𝘛𝘰𝘵𝘢𝘭 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴 𝘐𝘯 𝘈𝘯𝘪𝘮𝘦 10*

> *𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 -  𝘽𝙊𝙏*`,
                image: true
            },
            '7': {
                title: "🔄 *Convert Menu* 🔄",
                content: `*◄●●━━𝗛𝗜𝗥𝗨 𝗫 𝗠𝗗 𝗩𝟭━━●●►*

☘️ *_𝗖𝗢𝗡𝗩𝗘𝗥𝗧 𝗠𝗘𝗡𝗨_* ☘️

*●𝘚𝘵𝘤𝘬𝘦𝘳*
*●𝘛𝘢𝘬𝘦*
*●𝘛𝘵𝘴*
*●𝘍𝘢𝘯𝘤𝘺*
*●𝘕𝘱𝘮*
*●𝘛𝘪𝘯𝘺*
*●𝘈𝘵𝘵𝘱*

*➥ 𝘛𝘰𝘵𝘢𝘭 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴 𝘐𝘯 𝘊𝘰𝘯𝘷𝘦𝘳𝘵 7*

> *𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 -  𝘽𝙊𝙏*`,
                image: true
            },
            '8': {
                title: "📌 *Other Menu* 📌",
                content: `*◄●●━━𝗛𝗜𝗥𝗨 𝗫 𝗠𝗗 𝗩𝟭━━●●►*

☘️ *_𝗢𝗧𝗛𝗘𝗥 𝗠𝗘𝗡𝗨_* ☘️

*●𝘋𝘢𝘵𝘦*
*●𝘛𝘪𝘮𝘦𝘯𝘰𝘸 (2)*
*●𝘊𝘰𝘶𝘯𝘵*
*●𝘊𝘢𝘭𝘤𝘶𝘭𝘢𝘵𝘦*
*●𝘊𝘰𝘶𝘯𝘵𝘹*
*●𝘋𝘦𝘧𝘪𝘯𝘦*
*●𝘞𝘦𝘢𝘵𝘩𝘦𝘳*
*●𝘖𝘸𝘯𝘦𝘳 (1)*
*●𝘊𝘰𝘶𝘯𝘵𝘳𝘺𝘪𝘯𝘧𝘰*
*●𝘉𝘪𝘯𝘢𝘳𝘺*
*●𝘗𝘳𝘰𝘧𝘪𝘭𝘦*
*●𝘗𝘦𝘳𝘴𝘰𝘯*
*●𝘚𝘱𝘢𝘮*
*●𝘈𝘥𝘦𝘥𝘪𝘵*
*●𝘕𝘰𝘬𝘪𝘢*
*●𝘞𝘢𝘯𝘵𝘦𝘥*
*●𝘙𝘮𝘣𝘨*
*●𝘙𝘸*
*●𝘝𝘷*

*➥ 𝘛𝘰𝘵𝘢𝘭 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴 𝘐𝘯 𝘖𝘵𝘩𝘦𝘳 19*

> *𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 -  𝘽𝙊𝙏*`,
                image: true
            },
            '9': {
                title: "💞 *Reactions Menu* 💞",
                content: `*◄●●━━𝗛𝗜𝗥𝗨 𝗫 𝗠𝗗 𝗩𝟭━━●●►*

☘️ *_𝗥𝗜𝗔𝗖𝗧𝗜𝗢𝗡 𝗠𝗘𝗡𝗨_* ☘️

*●𝘏𝘢𝘱𝘱𝘺*
*●𝘊𝘶𝘥𝘥𝘭𝘦*
*●𝘏𝘶𝘨*
*●𝘒𝘪𝘴𝘴*
*●𝘓𝘪𝘤𝘬*
*●𝘗𝘢𝘵*
*●𝘉𝘶𝘭𝘭𝘺*
*●𝘉𝘰𝘯𝘬*
*●𝘠𝘦𝘦𝘵*
*●𝘚𝘭𝘢𝘱*
*●𝘒𝘪𝘭𝘭*
*●𝘉𝘭𝘶𝘴𝘩*
*●𝘚𝘮𝘪𝘭𝘦*
*●𝘏𝘢𝘱𝘱𝘺*
*●𝘞𝘪𝘯𝘬*
*●𝘗𝘰𝘬𝘦*

*➥ 𝘛𝘰𝘵𝘢𝘭 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴 𝘐𝘯 𝘙𝘦𝘢𝘤𝘵𝘪𝘰𝘯 16*

> *𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 -  𝘽𝙊𝙏*`,
                image: true
            },
            '10': {
                title: "🏠 *Main Menu* 🏠",
                content: `*◄●●━━𝗛𝗜𝗥𝗨 𝗫 𝗠𝗗 𝗩𝟭━━●●►*

☘️ *_𝗠𝗔𝗜𝗡 𝗠𝗘𝗡𝗨_* ☘️

*●𝘔𝘦𝘯𝘶*
*●𝘈𝘭𝘪𝘷𝘦*
*●𝘗𝘪𝘯𝘨*
*●𝘛𝘪𝘬𝘵𝘰*
*●𝘚𝘰𝘯𝘨*
*●𝘍𝘢𝘤𝘦𝘣𝘰𝘰𝘬*
*●𝘙𝘮𝘣𝘨*
*●𝘐𝘮𝘨2𝘶𝘳𝘭*
*●𝘝𝘪𝘥𝘦𝘰*
*●𝘖𝘸𝘯𝘦𝘳*
*●𝘙𝘦𝘱𝘰*

*➥ 𝘛𝘰𝘵𝘢𝘭 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴 𝘐𝘯 𝘔𝘢𝘪𝘯 12*

> *𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 -  𝘽𝙊𝙏*`,
                image: true
            },
            '11': {
                title: "🔳 *Logo Menu* 🔳",
                content: `*◄●●━━𝗛𝗜𝗥𝗨 𝗫 𝗠𝗗 𝗩𝟭━━●●►*

☘️  *_𝗟𝗢𝗚𝗢 𝗠𝗘𝗡𝗨_* ☘️

*●3𝘊𝘰𝘮𝘪𝘤*
*●𝘋𝘳𝘢𝘨𝘰𝘯𝘣𝘢𝘭𝘭*
*●𝘋𝘦𝘢𝘥𝘱𝘰𝘰𝘭*
*●𝘉𝘭𝘢𝘤𝘬𝘱𝘪𝘯𝘬*
*●𝘕𝘦𝘰𝘯𝘭𝘪𝘨𝘩𝘵*
*●𝘊𝘢𝘵*
*●𝘚𝘢𝘥𝘨𝘪𝘳𝘭*
*●𝘗𝘰𝘳𝘯𝘩𝘶𝘣*
*●𝘕𝘢𝘳𝘶𝘵𝘰*
*●𝘛𝘩𝘰𝘳*
*●𝘈𝘮𝘦𝘳𝘪𝘤𝘢*
*●𝘌𝘳𝘢𝘴𝘦𝘳*
*●3𝘋𝘱𝘢𝘱𝘦𝘳*
*●𝘍𝘶𝘵𝘶𝘳𝘪𝘴𝘵𝘪𝘤*
*●𝘊𝘭𝘰𝘶𝘥𝘴*
*●𝘚𝘢𝘯𝘴*
*●𝘎𝘢𝘭𝘢𝘹𝘺*
*●𝘓𝘦𝘢𝘧*
*●𝘚𝘶𝘯𝘴𝘦𝘵*
*●𝘕𝘪𝘨𝘦𝘳𝘪𝘢*
*●𝘋𝘦𝘷𝘪𝘭𝘸𝘪𝘯𝘨𝘴*
*●𝘏𝘢𝘤𝘬𝘦𝘳*
*●𝘉𝘰𝘰𝘮*
*●𝘓𝘶𝘹𝘶𝘳𝘺*
*●𝘡𝘰𝘥𝘪𝘢𝘤*
*●𝘈𝘯𝘨𝘦𝘭𝘸𝘪𝘯𝘨𝘴*
*●𝘉𝘶𝘭𝘣*
*●𝘛𝘢𝘵𝘰𝘰*
*●𝘊𝘢𝘴𝘵𝘭𝘦*
*●𝘍𝘰𝘳𝘻𝘦𝘯*
*●𝘗𝘢𝘪𝘯𝘵*
*●𝘉𝘪𝘳𝘵𝘩𝘥𝘢𝘺*
*●𝘛𝘺𝘱𝘰𝘨𝘳𝘢𝘱𝘩𝘺*
*●𝘉𝘦𝘢𝘳*
*●𝘝𝘢𝘭𝘰𝘳𝘢𝘯𝘵*

*➥ 𝘛𝘰𝘵𝘢𝘭 𝘊𝘰𝘮𝘮𝘢𝘯𝘥𝘴 𝘐𝘯 𝘓𝘰𝘨𝘰 36*

> *𝙃𝙄𝙍𝙐 - 𝙓 - 𝙈𝘿 - 𝘽𝙊𝙏*`,
                image: true
            }
            
        };

        // Message handler with improved error handling
        const handler = async (msgData) => {
            try {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

                const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                
                if (isReplyToMenu) {
                    const receivedText = receivedMsg.message.conversation || 
                                      receivedMsg.message.extendedTextMessage?.text;
                    const senderID = receivedMsg.key.remoteJid;

                    if (menuData[receivedText]) {
                        const selectedMenu = menuData[receivedText];
                        
                        try {
                            if (selectedMenu.image) {
                                await conn.sendMessage(
                                    senderID,
                                    {
                                        image: { url: 'https://files.catbox.moe/88ec05.jpg' },
                                        caption: selectedMenu.content,
                                        contextInfo: contextInfo
                                    },
                                    { quoted: receivedMsg }
                                );
                            } else {
                                await conn.sendMessage(
                                    senderID,
                                    { text: selectedMenu.content, contextInfo: contextInfo },
                                    { quoted: receivedMsg }
                                );
                            }

                            await conn.sendMessage(senderID, {
                                react: { text: '✅', key: receivedMsg.key }
                            });

                        } catch (e) {
                            console.log('Menu reply error:', e);
                            await conn.sendMessage(
                                senderID,
                                { text: selectedMenu.content, contextInfo: contextInfo },
                                { quoted: receivedMsg }
                            );
                        }

                    } else {
                        await conn.sendMessage(
                            senderID,
                            {
                                text: `❌ *Invalid Option!* ❌\n\nPlease reply with a number between 0-10 to select a menu.\n\n*Example:* Reply with "1" for Group Menu\n\n>*㋛ 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗕𝘆 𝗛𝗶𝗿𝘂 𝗫 𝗠𝗱 `,
                                contextInfo: contextInfo
                            },
                            { quoted: receivedMsg }
                        );
                    }
                }
            } catch (e) {
                console.log('Handler error:', e);
            }
        };

        // Add listener
        conn.ev.on("messages.upsert", handler);

        // Remove listener after 5 minutes
        setTimeout(() => {
            conn.ev.off("messages.upsert", handler);
        }, 300000);

    } catch (e) {
        console.error('Menu Error:', e);
        try {
            await conn.sendMessage(
                from,
                { text: `❌ Menu system is currently busy. Please try again later.\n\n> *㋛ 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗕𝘆 𝗛𝗶𝗿𝘂 𝗫 𝗠𝗱*` },
                { quoted: mek }
            );
        } catch (finalError) {
            console.log('Final error handling failed:', finalError);
        }
    }
});
