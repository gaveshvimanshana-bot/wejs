const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const pendingPahe = {};

/* ================= SEARCH ================= */

async function searchPahe(query) {
const url = `https://pahe.li/?s=${encodeURIComponent(query)}`;

const { data } = await axios.get(url);
const $ = cheerio.load(data);

const results = [];

$("article").each((i, el) => {
const title = $(el).find("h2.entry-title a").text().trim();
const link = $(el).find("h2.entry-title a").attr("href");

if (title && link) {
results.push({
id: i + 1,
title,
link
});
}
});

return results.slice(0, 10);
}

/* ================= GET DOWNLOAD LINKS ================= */

async function getPaheLinks(url) {
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();

await page.goto(url, { waitUntil: "networkidle2" });

await new Promise(r => setTimeout(r, 5000));

const links = await page.$$eval("a", as =>
as
.map(a => a.href)
.filter(h => h.includes("kwik") || h.includes("drive") || h.includes("pixeldrain"))
);

await browser.close();

return links.slice(0, 5);
}

/* ================= COMMAND ================= */

cmd({
pattern: "pahe",
desc: "Download movies from Pahe",
category: "download",
filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {

if (!q) return reply("🎬 Use: .pahe movie name");

reply("🔍 Searching Pahe...");

const results = await searchPahe(q);

if (!results.length) return reply("❌ No results found");

pendingPahe[sender] = results;

let text = "🎬 *Pahe Results*\n\n";

results.forEach((r, i) => {
text += `*${i + 1}.* ${r.title}\n`;
});

text += "\n📌 Reply with number";

await conn.sendMessage(from, { text }, { quoted: mek });

});

/* ================= SELECT ================= */

cmd({
filter: (text, { sender }) =>
pendingPahe[sender] &&
!isNaN(text) &&
parseInt(text) > 0 &&
parseInt(text) <= pendingPahe[sender].length
}, async (conn, mek, m, { body, sender, reply, from }) => {

const index = parseInt(body) - 1;
const selected = pendingPahe[sender][index];

delete pendingPahe[sender];

reply("🔗 Fetching download links...");

const links = await getPaheLinks(selected.link);

if (!links.length) return reply("❌ No links found");

let msg = `🎬 *${selected.title}*\n\n`;

links.forEach((l, i) => {
msg += `*${i + 1}.* ${l}\n\n`;
});

msg += "📥 Copy link and download";

await conn.sendMessage(from, { text: msg }, { quoted: mek });

});
