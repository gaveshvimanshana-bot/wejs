const { cmd, commands } = require("../command");

const pendingMenu = {};
const numberEmojis = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];

const headerImage =
  "https://raw.githubusercontent.com/gaveshvimanshana-bot/wejs/main/Image/thumb-1920-1238268.jpg";

function formatRuntime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

// ================= MENU =================
cmd({
  pattern: "menu",
  react: "📋",
  category: "main",
  filename: __filename
}, async (client, m, msg, { from, sender, pushname }) => {

  const commandMap = {};

  for (const c of commands) {
    if (c.dontAddCommandList) continue;

    const cat = (c.category || "MISC").toUpperCase();
    if (!commandMap[cat]) commandMap[cat] = [];
    commandMap[cat].push(c);
  }

  const categories = Object.keys(commandMap);
  const uptime = process.uptime();

  let text = `╭━━━〔 *🤖 MAIN MENU* 〕━━━⬣
┃ 👋 Hello: *${pushname || "User"}*
┃ 👑 Owner: *VIMA-MD*
┃ ⏱ Runtime: *${formatRuntime(uptime)}*
┃ 📊 Total Cmds: *${commands.length}*
╰━━━━━━━━━━━━━━━━⬣
───────────────────────\n`;

  categories.forEach((cat, i) => {
    const num = (i + 1).toString().split("").map(n => numberEmojis[n]).join("");
    text += `┃ ${num} *${cat}* (${commandMap[cat].length})\n`;
  });

  text += `───────────────────────\n`;

  pendingMenu[sender] = {
    commandMap,
    categories,
    used: false
  };

  await client.sendMessage(from, {
    image: { url: headerImage },
    caption: text,
  }, { quoted: m });

});


// ================= CATEGORY HANDLER (FIXED) =================
cmd({
  filter: (text, { sender }) =>
    pendingMenu[sender] &&
    /^[1-9][0-9]*$/.test((text || "").trim())
}, async (client, m, msg, { from, sender, body, reply }) => {

  const session = pendingMenu[sender];
  if (!session) return;

  // 🔥 prevent double trigger
  if (session.used) return;
  session.used = true;

  const index = parseInt((body || "").trim()) - 1;

  if (index < 0 || index >= session.categories.length) {
    delete pendingMenu[sender];
    return reply("❌ Invalid selection.");
  }

  const category = session.categories[index];
  const cmds = session.commandMap[category];

  let out = `*${category} COMMANDS*\n\n`;

  cmds.forEach(c => {
    const patterns = [c.pattern, ...(c.alias || [])]
      .filter(Boolean)
      .map(p => `.${p}`);

    out += `${patterns.join(", ")} - ${c.desc || "No description"}\n`;
  });

  out += `\n📊 Total: ${cmds.length}`;

  await client.sendMessage(from, {
    image: { url: headerImage },
    caption: out,
  }, { quoted: m });

  // 🔥 reset properly (important)
  delete pendingMenu[sender];

});
