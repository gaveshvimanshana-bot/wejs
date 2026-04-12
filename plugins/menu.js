const { cmd, commands } = require("../command");

const pendingMenu = {};
const numberEmojis = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];

const headerImage = "https://raw.githubusercontent.com/gaveshvimanshana-bot/wejs/main/Image/thumb-1920-1238268.jpg";

/* ===================== MENU COMMAND ===================== */
cmd({
  pattern: "menu",
  react: "📋",
  desc: "Show command categories",
  category: "main",
  filename: __filename
}, async (conn, m, msg, { from, sender, reply }) => {

  await conn.sendMessage(from, { react: { text: "📋", key: m.key } });

  const commandMap = {};

  for (const command of commands) {
    if (command.dontAddCommandList) continue;

    const category = (command.category || "MISC").toUpperCase();

    if (!commandMap[category]) commandMap[category] = [];
    commandMap[category].push(command);
  }

  const categories = Object.keys(commandMap);

  let menuText =
`╭━━━〔 *🤖 MAIN MENU* 〕━━━⬣
┃ 👋 Hello!
┃ 📋 Select a category number below
┃ ⚡ Powered by VIMA-MD
╰━━━━━━━━━━━━━━━━⬣

*📂 CATEGORIES*
───────────────────────\n`;

  categories.forEach((cat, i) => {
    const emojiIndex = String(i + 1)
      .split("")
      .map(n => numberEmojis[n])
      .join("");

    menuText += `┃ ${emojiIndex} ${cat} (${commandMap[cat].length})\n`;
  });

  menuText += `───────────────────────\n💡 Reply with number to open category`;

  await conn.sendMessage(from, {
    image: { url: headerImage },
    caption: menuText
  }, { quoted: m });

  pendingMenu[sender] = {
    step: "category",
    commandMap,
    categories
  };
});


/* ===================== CATEGORY HANDLER ===================== */
cmd({
  pattern: null
}, async (conn, m, msg, { from, sender, body, reply }) => {

  if (!pendingMenu[sender]) return;
  if (pendingMenu[sender].step !== "category") return;

  const text = (body || "").trim();

  if (!/^[0-9]+$/.test(text)) return;

  const { commandMap, categories } = pendingMenu[sender];

  const index = parseInt(text) - 1;

  if (index < 0 || index >= categories.length) {
    return reply("❌ Invalid selection. Try again.");
  }

  const selectedCategory = categories[index];
  const cmdsInCategory = commandMap[selectedCategory];

  await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  let cmdText =
`╭━━━〔 *${selectedCategory} COMMANDS* 〕━━━⬣
\n`;

  cmdsInCategory.forEach(c => {
    const patterns = [c.pattern, ...(c.alias || [])]
      .filter(Boolean)
      .map(p => `.${p}`);

    cmdText += `┃ ${patterns.join(" | ")}\n┃ ➜ ${c.desc || "No description"}\n\n`;
  });

  cmdText +=
`───────────────────────
📦 Total: ${cmdsInCategory.length}
╰━━━━━━━━━━━━━━━━⬣`;

  await conn.sendMessage(from, {
    image: { url: headerImage },
    caption: cmdText
  }, { quoted: m });

  delete pendingMenu[sender];
});
