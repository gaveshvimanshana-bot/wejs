const { cmd, commands } = require("../command");  
const fs = require("fs");  
const path = require("path");  

const pendingMenu = {};  
const numberEmojis = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];  

const headerImage = "https://cloud.laksidunimsara.com/f/Gavesh/1776016994166-file_0000000029e871fab9c27ac6f4da761b.png";  

// ⏱ runtime function (UNCHANGED - just added)
function formatRuntime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

cmd({  
  pattern: "menu",  
  react: "📋",  
  desc: "Show command categories",  
  category: "main",  
  filename: __filename  
}, async (test, m, msg, { from, sender, reply, pushname }) => {  

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

  // 👑 owner (change if you want)
  const owner = "VIMA-MD";

  let menuText = `╭━━━〔 *VIMA MD MAIN MENU* 〕━━━◯...  
┃ 👋 Hello: *${pushname || "User"}*  
┃ 👑 Owner: *𝙶𝙰𝚅𝙴𝚂𝙷 𝚅𝙸𝙼𝙰𝙽𝚂𝙷𝙰𝙽𝙰*  
┃ ⏱ Runtime: *${formatRuntime(uptime)}*  
┃ 🔥 Total Cmds: *${commands.length}*  
╰━━━━━━━━━━━━━━━━◯.....  
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

  await test.sendMessage(from, {  
    image: { url: headerImage },  
    caption: menuText,  
  }, { quoted: m });  

  pendingMenu[sender] = { step: "category", commandMap, categories };  
});  


// ================= CATEGORY SELECT HANDLER =================

cmd({  
  filter: (text, { sender }) =>  
    pendingMenu[sender] &&  
    pendingMenu[sender].step === "category" &&  
    /^[1-9][0-9]*$/.test((text || "").trim())  
}, async (test, m, msg, { from, body, sender, reply }) => {  

  await test.sendMessage(from, { react: { text: "✅", key: m.key } });  

  const { commandMap, categories } = pendingMenu[sender];  
  const index = parseInt((body || "").trim()) - 1;  

  if (index < 0 || index >= categories.length)  
    return reply("❌ Invalid selection.");  

  const selectedCategory = categories[index];  
  const cmdsInCategory = commandMap[selectedCategory];  

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

  delete pendingMenu[sender];  
});
