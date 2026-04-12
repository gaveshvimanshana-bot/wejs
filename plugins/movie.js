const { cmd } = require("../command");
const puppeteer = require("puppeteer");

const pendingSearch = {};
const pendingQuality = {};

/* ================= HELPERS ================= */

function getUserId(m) {
  return m.key.participant || m.key.remoteJid;
}

function getText(m) {
  return (
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    ""
  ).trim();
}

function normalizeQuality(text) {
  if (!text) return null;
  text = text.toUpperCase();
  if (/1080|FHD/.test(text)) return "1080p";
  if (/720|HD/.test(text)) return "720p";
  if (/480|SD/.test(text)) return "480p";
  return text;
}

function getDirectPixeldrainUrl(url) {
  const match = url.match(/pixeldrain\.com\/u\/(\w+)/);
  if (!match) return null;
  return `https://pixeldrain.com/api/file/${match[1]}?download`;
}

/* ================= SCRAPER ================= */

async function searchMovies(query) {
  const searchUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(query)}&post_type=movies`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

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
        qty: qty.trim()
      };
    }).filter(m => m.title && m.movieUrl)
  );

  await browser.close();
  return results;
}

async function getMovieMetadata(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

  const metadata = await page.evaluate(() => {
    const getText = el => el?.textContent?.trim() || "";
    const getList = sel => Array.from(document.querySelectorAll(sel)).map(e => e.textContent.trim());

    const title = getText(document.querySelector(".info-details .details-title h3"));

    let language = "", directors = [], stars = [];

    document.querySelectorAll(".info-col p").forEach(p => {
      const strong = p.querySelector("strong");
      if (!strong) return;

      const txt = strong.textContent.trim();

      if (txt.includes("Language:"))
        language = strong.nextSibling?.textContent?.trim() || "";

      if (txt.includes("Director:"))
        directors = Array.from(p.querySelectorAll("a")).map(a => a.textContent.trim());

      if (txt.includes("Stars:"))
        stars = Array.from(p.querySelectorAll("a")).map(a => a.textContent.trim());
    });

    const duration = getText(document.querySelector(".data-views[itemprop='duration']"));
    const imdb = getText(document.querySelector(".data-imdb"))?.replace("IMDb:", "").trim();
    const genres = getList(".details-genre a");
    const thumbnail = document.querySelector(".splash-bg img")?.src || "";

    return { title, language, duration, imdb, genres, directors, stars, thumbnail };
  });

  await browser.close();
  return metadata;
}

async function getPixeldrainLinks(movieUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

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
      const sub = await browser.newPage();
      await sub.goto(l.pageLink, { waitUntil: "networkidle2", timeout: 30000 });

      await new Promise(r => setTimeout(r, 8000));

      const finalUrl = await sub.$eval(
        ".wait-done a[href*='pixeldrain']",
        el => el.href
      ).catch(() => null);

      if (finalUrl) {
        let sizeMB = 0;
        const s = l.size.toUpperCase();

        if (s.includes("GB")) sizeMB = parseFloat(s) * 1024;
        else if (s.includes("MB")) sizeMB = parseFloat(s);

        if (sizeMB <= 2048) {
          directLinks.push({
            link: finalUrl,
            quality: normalizeQuality(l.quality),
            size: l.size
          });
        }
      }

      await sub.close();
    } catch (e) {}
  }

  await browser.close();
  return directLinks;
}

/* ================= MAIN COMMAND ================= */

cmd({
  pattern: "movie",
  alias: ["sinhalasub", "films", "cinema"],
  react: "🎬",
  desc: "Search movies",
  category: "download",
  filename: __filename
}, async (hansa, mek, m, { from, q, reply }) => {

  const sender = getUserId(m);

  if (!q) return reply("Use: movie name");

  reply("🔍 Searching...");

  const results = await searchMovies(q);

  if (!results.length) return reply("❌ No movies found");

  pendingSearch[sender] = {
    results,
    timestamp: Date.now()
  };

  let text = "🎬 RESULTS:\n\n";

  results.forEach((r, i) => {
    text += `${i + 1}. ${r.title}\n`;
  });

  text += `\nReply number`;

  await hansa.sendMessage(from, { text }, { quoted: mek });
});

/* ================= GLOBAL HANDLER ================= */

cmd({ on: "text" }, async (hansa, mek, m, { from, reply }) => {

  const sender = getUserId(m);
  const text = getText(m);

  /* STEP 1 - MOVIE SELECT */
  if (pendingSearch[sender] && /^\d+$/.test(text)) {

    const index = parseInt(text) - 1;
    const selected = pendingSearch[sender].results[index];

    if (!selected) return reply("❌ Invalid number");

    delete pendingSearch[sender];

    const meta = await getMovieMetadata(selected.movieUrl);

    await hansa.sendMessage(from, {
      text: `🎬 ${meta.title}\n🔍 Loading qualities...`
    }, { quoted: mek });

    const links = await getPixeldrainLinks(selected.movieUrl);

    if (!links.length) return reply("❌ No links found");

    pendingQuality[sender] = {
      movie: { metadata: meta, downloadLinks: links },
      timestamp: Date.now()
    };

    let msg = "📥 QUALITIES:\n\n";

    links.forEach((l, i) => {
      msg += `${i + 1}. ${l.quality} - ${l.size}\n`;
    });

    return reply(msg);
  }

  /* STEP 2 - QUALITY SELECT */
  if (pendingQuality[sender] && /^\d+$/.test(text)) {

    const index = parseInt(text) - 1;
    const movie = pendingQuality[sender].movie;

    const selected = movie.downloadLinks[index];

    if (!selected) return reply("❌ Invalid quality");

    delete pendingQuality[sender];

    return reply(`⬇️ Sending ${selected.quality}...`);
  }
});

/* ================= CLEANUP ================= */

setInterval(() => {
  const now = Date.now();
  const timeout = 10 * 60 * 1000;

  for (const s in pendingSearch)
    if (now - pendingSearch[s].timestamp > timeout)
      delete pendingSearch[s];

  for (const s in pendingQuality)
    if (now - pendingQuality[s].timestamp > timeout)
      delete pendingQuality[s];

}, 5 * 60 * 1000);
