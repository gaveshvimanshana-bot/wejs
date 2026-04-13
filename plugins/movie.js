const { cmd } = require("../command");
const puppeteer = require("puppeteer");

/* ===================== HEADER ===================== */
const HEADER = `
▥ ░ 𝚅𝙸𝙼𝙰 𝙼𝙳 𝙼𝙾𝚅𝙸𝙴 ░▥

> ┅             ⫷𝐏𝐎𝐖𝐄𝐑𝐃 𝐁𝐘⫸
> 🔸┏𝐕𝐈𝐌𝐀 𝐌𝐃┚         ┅
`;

const pendingSearch = {};
const pendingQuality = {};

function normalizeQuality(text) {
if (!text) return null;
text = text.toUpperCase();
if (/1080|FHD/.test(text)) return "1080p";
if (/720|HD/.test(text)) return "720p";
if (/480|SD/.test(text)) return "480p";
return text;
}

function getDirectPixeldrainUrl(url) {
const match = url.match(/pixeldrain.com\/u\/(\w+)/);
if (!match) return null;
return `https://pixeldrain.com/api/file/${match[1]}?download`;
}

async function searchMovies(query) {
const searchUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(query)}&post_type=movies`;

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });

const results = await page.$$eval(".display-item .item-box", boxes =>
boxes.slice(0, 10).map((box, index) => {
const a = box.querySelector("a");
const img = box.querySelector(".thumb");
const lang = box.querySelector(".item-desc-giha .language")?.textContent || "";
const quality = box.querySelector(".item-desc-giha .quality")?.textContent || "";
const qty = box.querySelector(".item-desc-giha .qty")?.textContent || "";

return {
id: index + 1,
title: a?.title?.trim() || "",
movieUrl: a?.href || "",
thumb: img?.src || "",
language: lang.trim(),
quality: quality.trim(),
qty: qty.trim(),
};
}).filter(m => m.title && m.movieUrl)
);

await browser.close();
return results;
}

async function getMovieMetadata(url) {
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

const metadata = await page.evaluate(() => {
const getText = el => el?.textContent.trim() || "";
const getList = selector => Array.from(document.querySelectorAll(selector)).map(el => el.textContent.trim());

const title = getText(document.querySelector(".info-details .details-title h3"));

let language = "", directors = [], stars = [];

document.querySelectorAll(".info-col p").forEach(p => {
const strong = p.querySelector("strong");
if (!strong) return;

const txt = strong.textContent.trim();

if (txt.includes("Language:")) language = strong.nextSibling?.textContent?.trim() || "";
if (txt.includes("Director:")) directors = Array.from(p.querySelectorAll("a")).map(a => a.textContent.trim());
if (txt.includes("Stars:")) stars = Array.from(p.querySelectorAll("a")).map(a => a.textContent.trim());
});

const duration = getText(document.querySelector(".info-details .data-views[itemprop='duration']"));
const imdb = getText(document.querySelector(".info-details .data-imdb"))?.replace("IMDb:", "").trim();
const genres = getList(".details-genre a");
const thumbnail = document.querySelector(".splash-bg img")?.src || "";

return { title, language, duration, imdb, genres, directors, stars, thumbnail };
});

await browser.close();
return metadata;
}

async function getPixeldrainLinks(movieUrl) {
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(movieUrl, { waitUntil: "networkidle2", timeout: 30000 });

const linksData = await page.$$eval(".link-pixeldrain tbody tr", rows =>
rows.map(row => {
const a = row.querySelector(".link-opt a");
const quality = row.querySelector(".quality")?.textContent.trim() || "";
const size = row.querySelector("td:nth-child(3) span")?.textContent.trim() || "";
return { pageLink: a?.href || "", quality, size };
})
);

const directLinks = [];

for (const l of linksData) {
try {
const subPage = await browser.newPage();
await subPage.goto(l.pageLink, { waitUntil: "networkidle2", timeout: 30000 });

await new Promise(r => setTimeout(r, 12000));

const finalUrl = await subPage.$eval(
".wait-done a[href^='https://pixeldrain.com/']",
el => el.href
).catch(() => null);

if (finalUrl) {
let sizeMB = 0;
const sizeText = l.size.toUpperCase();

if (sizeText.includes("GB")) sizeMB = parseFloat(sizeText) * 1024;
else if (sizeText.includes("MB")) sizeMB = parseFloat(sizeText);

if (sizeMB <= 2048) {
directLinks.push({
link: finalUrl,
quality: normalizeQuality(l.quality),
size: l.size
});
}
}

await subPage.close();
} catch (e) {
continue;
}
}

await browser.close();
return directLinks;
}

/* ===================== MOVIE SEARCH ===================== */

cmd({
pattern: "movie",
alias: ["sinhalasub","films","cinema"],
react: "🎬",
desc: "Search movies",
category: "download",
filename: __filename
}, async (hansa, mek, m, { from, q, sender, reply }) => {

if (!q) return reply(`${HEADER}\n🎬 *Movie Search Plugin*\nUsage: movie name`);

reply("🔍 Searching...");

const searchResults = await searchMovies(q);

if (!searchResults.length) return reply(`${HEADER}\n❌ No movies found!`);

pendingSearch[sender] = { results: searchResults, timestamp: Date.now() };

let text = `${HEADER}\n🎬 *Search Results*\n\n`;

searchResults.forEach((m, i) => {
text += `*${i + 1}.* ${m.title}\n`;
text += `   📝 Language: ${m.language}\n`;
text += `   📊 Quality: ${m.quality}\n`;
text += `   🎞️ Format: ${m.qty}\n\n`;
});

text += `📌 Reply with number (1-${searchResults.length})`;

reply(text);
});

/* ===================== MOVIE DETAILS ===================== */

cmd({
filter: (text, { sender }) =>
pendingSearch[sender] &&
!isNaN(text) &&
parseInt(text) > 0 &&
parseInt(text) <= pendingSearch[sender].results.length
}, async (hansa, mek, m, { body, sender, reply, from }) => {

await hansa.sendMessage(from, { react: { text: "✅", key: m.key } });

const index = parseInt(body.trim()) - 1;
const selected = pendingSearch[sender].results[index];
delete pendingSearch[sender];

const metadata = await getMovieMetadata(selected.movieUrl);

let msg = `${HEADER}\n🎬 *${metadata.title}*\n\n`;

msg += `📝 Language: ${metadata.language}\n`;
msg += `⏱️ Duration: ${metadata.duration}\n`;
msg += `⭐ IMDb: ${metadata.imdb}\n`;
msg += `🎭 Genres: ${metadata.genres.join(", ")}\n`;
msg += `🎬 Directors: ${metadata.directors.join(", ")}\n`;
msg += `🌟 Stars: ${metadata.stars.slice(0,5).join(", ")}\n`;

if (metadata.thumbnail) {
await hansa.sendMessage(from, { image: { url: metadata.thumbnail }, caption: msg }, { quoted: mek });
} else {
await hansa.sendMessage(from, { text: msg }, { quoted: mek });
}

await hansa.sendMessage(from, {
text: "🔗 Fetching download links... please wait 🍿"
}, { quoted: mek });

const downloadLinks = await getPixeldrainLinks(selected.movieUrl);

if (!downloadLinks.length) return reply(`${HEADER}\n❌ No download links found (<2GB)!`);

pendingQuality[sender] = { movie: { metadata, downloadLinks }, timestamp: Date.now() };

let qualityMsg = `${HEADER}\n📥 *Available Qualities*\n\n`;

downloadLinks.forEach((d,i) => {
qualityMsg += `*${i + 1}.* 🎞️ ${d.quality}\n`;
qualityMsg += `   💾 Size: ${d.size}\n\n`;
});

qualityMsg += `📌 Reply with number to download 🍿`;

await hansa.sendMessage(from, { text: qualityMsg }, { quoted: mek });
});

/* ===================== DOWNLOAD ===================== */

cmd({
filter: (text, { sender }) =>
pendingQuality[sender] &&
!isNaN(text) &&
parseInt(text) > 0 &&
parseInt(text) <= pendingQuality[sender].movie.downloadLinks.length
}, async (hansa, mek, m, { body, sender, reply, from }) => {

await hansa.sendMessage(from, { react: { text: "⬇️", key: m.key } });

const index = parseInt(body.trim()) - 1;
const { movie } = pendingQuality[sender];
delete pendingQuality[sender];

const selectedLink = movie.downloadLinks[index];

reply("⬇️ Sending movie... 🍿");

try {
const directUrl = getDirectPixeldrainUrl(selectedLink.link);

await hansa.sendMessage(from, {
document: { url: directUrl },
mimetype: "video/mp4",
fileName: `${movie.metadata.title.substring(0,50)} - ${selectedLink.quality}.mp4`,
caption: `${HEADER}

🎬 *${movie.metadata.title}*

📊 Quality: ${selectedLink.quality}
💾 Size: ${selectedLink.size}`
}, { quoted: mek });

} catch (e) {
console.log(e);
reply(`${HEADER}\n❌ Failed to send movie`);
}
});

/* ===================== CLEANUP ===================== */

setInterval(() => {
const now = Date.now();
const timeout = 10601000;

for (const s in pendingSearch)
if (now - pendingSearch[s].timestamp > timeout) delete pendingSearch[s];

for (const s in pendingQuality)
if (now - pendingQuality[s].timestamp > timeout) delete pendingQuality[s];
}, 5601000);

module.exports = { pendingSearch, pendingQuality };
