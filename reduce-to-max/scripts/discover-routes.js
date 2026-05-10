// discover-routes.js — discover marketing routes from a base URL.
//
// Sources, in priority order:
//   1. sitemap.xml (most authoritative)
//   2. a-href crawl from base URL, same-origin only, depth 1
//
// Filters out:
//   - /admin/* /internal/* /api/* /_* (common non-public paths)
//   - /login /logout /register /forgot-password /reset-password
//   - File paths (.css .js .png .jpg .svg .ico .pdf .xml .json)
//   - URL fragments (anchor-only links)
//
// Runtime invocation:
//   1. Edit BASE constant below, then: dev-browser run scripts/discover-routes.js
//
// Output JSON:
//   {
//     base: "http://127.0.0.1:8011",
//     source: "sitemap" | "crawl",
//     routes: [{ path, url }, ...],
//     filtered: [{ path, url, reason }, ...]
//   }

const BASE = "http://127.0.0.1:8011";

const NONPUBLIC_PATTERNS = [
  /^\/admin(\/|$)/i,
  /^\/internal(\/|$)/i,
  /^\/api(\/|$)/i,
  /^\/_/,
  /^\/login(\/|$)/i,
  /^\/logout(\/|$)/i,
  /^\/register(\/|$)/i,
  /^\/forgot-password(\/|$)/i,
  /^\/reset-password(\/|$)/i,
  /^\/sign-in(\/|$)/i,
  /^\/sign-up(\/|$)/i,
];

const FILE_EXTENSIONS = /\.(css|js|mjs|map|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf|pdf|xml|json|txt|zip|mp4|webm)(\?|#|$)/i;

function classify(path) {
  if (FILE_EXTENSIONS.test(path)) return "file_extension";
  if (path.startsWith("#")) return "anchor_only";
  for (const re of NONPUBLIC_PATTERNS) {
    if (re.test(path)) return "non_public_pattern";
  }
  return "ok";
}

const page = await browser.getPage("discover-routes");

// Try sitemap.xml first
let routes = [];
let source = "crawl";
let sitemapAttempted = false;

try {
  await page.goto(BASE + "/sitemap.xml", { waitUntil: "domcontentloaded", timeout: 5000 });
  sitemapAttempted = true;
  const xml = await page.content();
  const matches = xml.match(/<loc>\s*([^<]+?)\s*<\/loc>/gi) || [];
  if (matches.length > 0) {
    source = "sitemap";
    matches.forEach((m) => {
      const url = m.replace(/<\/?loc>/gi, "").trim();
      try {
        const u = new URL(url);
        if (u.origin === BASE) {
          routes.push({ path: u.pathname, url });
        }
      } catch (e) { /* skip malformed */ }
    });
  }
} catch (e) {
  // sitemap unavailable, fall back to crawl
}

if (source === "crawl") {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const hrefs = await page.evaluate((origin) => {
    const set = new Set();
    document.querySelectorAll("a[href]").forEach((a) => {
      try {
        const u = new URL(a.href, location.href);
        if (u.origin === origin) set.add(u.pathname);
      } catch (e) {}
    });
    return Array.from(set);
  }, BASE);
  hrefs.forEach((path) => {
    routes.push({ path, url: BASE + path });
  });
}

// Filter
const kept = [];
const filtered = [];
const seenPaths = new Set();
routes.forEach((r) => {
  if (seenPaths.has(r.path)) return;
  seenPaths.add(r.path);
  const reason = classify(r.path);
  if (reason === "ok") kept.push(r);
  else filtered.push({ ...r, reason });
});

// Sort kept routes alphabetically; '/' first
kept.sort((a, b) => {
  if (a.path === "/") return -1;
  if (b.path === "/") return 1;
  return a.path.localeCompare(b.path);
});

console.log(JSON.stringify({
  base: BASE,
  source,
  sitemap_attempted: sitemapAttempted,
  routes: kept,
  filtered,
}, null, 2));
