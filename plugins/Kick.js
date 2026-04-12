const { cmd } = require('../lib/command');
cmd({
    pattern: "forward",
    alias: ["fo"],
    category: "owner",
    use: '.forward < Jid address >',
    filename: __filename
},
async (conn, mek, m, { from, q, isOwner, reply }) => {
if (!isOwner) {
    return reply("❌ Owner Only");
}
if (!q || !m.quoted) {
    return reply("❌ Please reply to a message/file and provide a JID\n\nExample: .forward 947xxxxx@s.whatsapp.net");
}
try {
    await conn.forwardMessage(q, m.quoted, true);
    reply(`✅ Message forwarded to: ${q}`);
} catch (error) {
    reply(`❌ Failed: ${error.message}`);
}
})
