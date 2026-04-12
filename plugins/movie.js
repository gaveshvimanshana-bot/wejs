const { cmd } = require("../command");
const puppeteer = require("puppeteer");

const pendingSearch = {};
const pendingQuality = {};

/* ===================== HELPERS ===================== */

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

/* ===================== SCRAPER ===================== */

async function searchMovies(query) {
  const url = `https://sinhalasub.lk/?s=${encodeURIComponent(query)}&post_type=movies`;

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

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

  const data = await page.evaluate(() => {
    const getText = el => el?.textContent.trim() || "";
    const getList = sel => Array.from(document.querySelectorAll(sel)).map(e => e.textContent.trim());

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

    return {
      title,
      language,
      duration: getText(document.querySelector(".data-views[itemprop='duration']")),
      imdb: getText(document.querySelector(".data-imdb"))?.replace("IMDb:", "").trim(),
      genres: getList(".details-genre a"),
      directors,
      stars,
      thumbnail: document.querySelector(".splash-bg img")?.src || ""
    };
  });

  await browser.close();
  return data;
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

      await new Promise(r => setTimeout(r, 8000));

      const finalUrl = await subPage.$eval(
        ".wait-done a[href^='https://pixeldrain.com/']",
        el => el.href
      ).catch(() => null);

      if (finalUrl) {
        directLinks.push({
          link: finalUrl,
          quality: normalizeQuality(l.quality),
          size: l.size
        });
      }

      await subPage.close();
    } catch (e) {}
  }

  await browser.close();
  return directLinks;
}

/* ===================== STEP 1: SEARCH ===================== */

cmd({
  pattern: "movie",
  alias: ["sinhalasub", "films", "cinema"],
  react: "🎬",
  desc: "Movie search",
  category: "download",
  filename: __filename
}, async (hansa, mek, m, { from, q, sender }) => {

  if (!q) return hansa.sendMessage(from, { text: "Use: movie name" }, { quoted: m });

  const results = await searchMovies(q);

  if (!results.length) {
    return hansa.sendMessage(from, { text: "❌ No movies found" }, { quoted: m });
  }

  pendingSearch[sender] = {
    results,
    time: Date.now()
  };

  let msg = "🎬 *MOVIE RESULTS*\n\n";

  results.forEach((r, i) => {
    msg += `${i + 1}. ${r.title}\n`;
    msg += `   Language: ${r.language}\n`;
    msg += `   Quality: ${r.quality}\n\n`;
  });

  msg += "Reply number to select movie";

  await hansa.sendMessage(from, { text: msg }, { quoted: m });
});

/* ===================== STEP 2: SELECT MOVIE ===================== */

cmd({
  on: "text",
  filter: (text, { sender }) =>
    pendingSearch[sender] && /^\d+$/.test(text.trim())
}, async (hansa, mek, m, { body, sender, from }) => {

  const index = parseInt(body.trim()) - 1;
  const session = pendingSearch[sender];

  if (!session || !session.results[index]) return;

  const selected = session.results[index];
  delete pendingSearch[sender];

  const meta = await getMovieMetadata(selected.movieUrl);

  let msg = `🎬 *${meta.title}*\n`;
  msg += `Language: ${meta.language}\n`;
  msg += `Duration: ${meta.duration}\n`;
  msg += `IMDb: ${meta.imdb}\n`;
  msg += `Genres: ${meta.genres.join(", ")}\n`;
  msg += `Stars: ${meta.stars.slice(0, 5).join(", ")}\n\n`;
  msg += "Fetching download links...";

  await hansa.sendMessage(from, { text: msg }, { quoted: m });

  const links = await getPixeldrainLinks(selected.movieUrl);

  if (!links.length) {
    return hansa.sendMessage(from, { text: "❌ No download links" }, { quoted: m });
  }

  pendingQuality[sender] = {
    movie: { meta, links },
    time: Date.now()
  };

  let qmsg = "📥 *QUALITIES*\n\n";

  links.forEach((l, i) => {
    qmsg += `${i + 1}. ${l.quality} - ${l.size}\n`;
  });

  qmsg += "\nReply number to download";

  await hansa.sendMessage(from, { text: qmsg }, { quoted: m });
});

/* ===================== STEP 3: DOWNLOAD ===================== */

cmd({
  on: "text",
  filter: (text, { sender }) =>
    pendingQuality[sender] && /^\d+$/.test(text.trim())
}, async (hansa, mek, m, { body, sender, from }) => {

  const index = parseInt(body.trim()) - 1;
  const session = pendingQuality[sender];

  if (!session || !session.movie.links[index]) return;

  const selected = session.movie.links[index];
  delete pendingQuality[sender];

  const url = getDirectPixeldrainUrl(selected.link);

  if (!url) return hansa.sendMessage(from, { text: "❌ Invalid link" }, { quoted: m });

  await hansa.sendMessage(from, {
    document: { url },
    mimetype: "video/mp4",
    fileName: `${session.movie.meta.title}-${selected.quality}.mp4`,
    caption: `🎬 ${session.movie.meta.title}\n📊 ${selected.quality}`
  }, { quoted: m });
});

/* ===================== CLEANUP ===================== */

setInterval(() => {
  const now = Date.now();
  const timeout = 10 * 60 * 1000;

  for (const s in pendingSearch)
    if (now - pendingSearch[s].time > timeout)
      delete pendingSearch[s];

  for (const s in pendingQuality)
    if (now - pendingQuality[s].time > timeout)
      delete pendingQuality[s];

}, 60000);

module.exports = { pendingSearch, pendingQuality };
