const { cmd, commands } = require("../command");  
const fs = require("fs");  
const path = require("path");  

const pendingMenu = {};  
const numberEmojis = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];  

const headerImage =
  "https://raw.githubusercontent.com/gaveshvimanshana-bot/wejs/main/Image/thumb-1920-1238268.jpg";

// ⏱ runtime
function formatRuntime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

// ================= MENU COMMAND =================
cmd({
  pattern: "menu",
  react: "📋",
  desc: "Show command categories",
  category: "main",
  filename: __filename
}, async (test, m, msg, { from, sender, pushname }) => {

  await test.sendMessage(from, { react: { text: "📋", key: m.key } });

  const commandMap = {};

  for (const command of commands) {
    if (command.dontAddCommandList) continue;

    const category = (command.category || "MISC").toUpperCase();

    if (!commandMap[category]) commandMap[category] = [];
    commandMap[category].push(command);
  }

  const categories = Object.keys(commandMap);
  const uptime = process.uptime();

  let menuText = `╭━━━〔 *🤖 MAIN MENU* 〕━━━⬣
┃ 👋 Hello: *${pushname || "User"}*
┃ 👑 Owner: *VIMA-MD*
┃ ⏱ Runtime: *${formatRuntime(uptime)}*
┃ 📊 Total Cmds: *${commands.length}*
╰━━━━━━━━━━━━━━━━⬣
───────────────────────\n`;

  categories.forEach((cat, i) => {
    const emojiIndex = (i + 1)
      .toString()
      .split("")
      .map(n => numberEmojis[n])
      .join("");

    menuText += `┃ ${emojiIndex} *${cat}* (${commandMap[cat].length})\n`;
  });

  menuText += `───────────────────────\n`;

  // store session
  pendingMenu[sender] = {
    step: "category",
    commandMap,
    categories,
    lastMsgId: null
  };

  await test.sendMessage(from, {
    image: { url: headerImage },
    caption: menuText,
  }, { quoted: m });

});


// ================= CATEGORY HANDLER =================
cmd({
  filter: (text, { sender }) =>
    pendingMenu[sender] &&
    pendingMenu[sender].step === "category" &&
    /^[1-9][0-9]*$/.test((text || "").trim())
}, async (test, m, msg, { from, body, sender, reply }) => {

  const session = pendingMenu[sender];
  if (!session) return;

  // 🔥 prevent duplicate triggers (safe fix)
  if (session.lastMsgId === m.key.id) return;
  session.lastMsgId = m.key.id;

  const index = parseInt((body || "").trim()) - 1;

  if (index < 0 || index >= session.categories.length) {
    delete pendingMenu[sender];
    return reply("❌ Invalid selection.");
  }

  const selectedCategory = session.categories[index];
  const cmdsInCategory = session.commandMap[selectedCategory];

  let cmdText = `*${selectedCategory} COMMANDS*\n\n`;

  cmdsInCategory.forEach(c => {
    const patterns = [c.pattern, ...(c.alias || [])]
      .filter(Boolean)
      .map(p => `.${p}`);

    cmdText += `${patterns.join(", ")} - ${c.desc || "No description"}\n`;
  });

  cmdText += `\n───────────────────────\n`;
  cmdText += `📊 Total Commands: ${cmdsInCategory.length}\n`;

  await test.sendMessage(from, {
    image: { url: headerImage },
    caption: cmdText,
  }, { quoted: m });

  // cleanup session (important)
  delete pendingMenu[sender];

});
