const { cmd } = require("../command");
const puppeteer = require("puppeteer");

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

/* ===================== SEARCH ===================== */

cmd({
pattern: "movie",
alias: ["sinhalasub","films","cinema"],
react: "🎬",
desc: "Search movies",
category: "download",
filename: __filename
}, async (hansa, mek, m, { from, q, sender, reply }) => {

if (!q) return reply("🎬 Movie Search\nUse: movie name");

reply("🔍 Searching...");

const searchResults = await searchMovies(q);

if (!searchResults.length) return reply("❌ No movies found!");

pendingSearch[sender] = { results: searchResults, timestamp: Date.now() };

let text = "🎬 *Search Results*\n\n";

searchResults.forEach((m, i) => {
text += `*${i + 1}.* ${m.title}\n`;
text += `   📝 Language: ${m.language}\n`;
text += `   📊 Quality: ${m.quality}\n`;
text += `   🎞️ Format: ${m.qty}\n\n`;
});

text += `📌 Reply with number (1-${searchResults.length})\n\n`;
text += `━━━━━━━━━━━━━━\n✨ Nexus5\n> Powered by Vima MD 🤖\n━━━━━━━━━━━━━━`;

/* 🔥 BANNER + LIST */
await hansa.sendMessage(from, {
image: {
url: "https://raw.githubusercontent.com/gaveshvimanshana-bot/wejs/main/Image/thumb-1920-1238268.jpg"
},
caption: text
}, { quoted: mek });

});

/* باقي code unchanged (details + download same as before) */

module.exports = { pendingSearch, pendingQuality };
