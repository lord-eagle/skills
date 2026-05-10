// compute-metrics.js — emit page-level editorial metrics JSON for a URL.
//
// Runtime invocation patterns:
//   1. Edit the URL constant below, then: dev-browser run compute-metrics.js
//   2. Pipe with URL injected at top:
//      cat <(echo "const URL='http://...';") scripts/compute-metrics.js | dev-browser
//
// QuickJS sandbox does not expose process.argv, so URL is a top-of-file constant.
//
// Output shape:
//   { total_height_px, viewport_height_px, viewports,
//     words, words_above_fold,
//     typeface_count, color_count, decoration_effects }

const URL = "http://127.0.0.1:8011/gaze";

const page = await browser.getPage("metrics");
await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);

const m = await page.evaluate(() => {
  const vh = window.innerHeight;
  const total = document.documentElement.scrollHeight;
  const allText = document.body.innerText || "";
  const words = allText.split(/\s+/).filter(Boolean).length;

  const aboveFold = Array.from(document.body.querySelectorAll("*"))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.top < vh && r.bottom > 0 && el.children.length === 0;
    })
    .map((el) => (el.innerText || "").trim())
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  const fonts = new Set();
  const fgColors = new Set();
  document.querySelectorAll("*").forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.fontFamily) fonts.add(cs.fontFamily.split(",")[0].trim().toLowerCase().replace(/['"]/g, ""));
    if (cs.color && el.innerText && el.innerText.trim()) fgColors.add(cs.color);
  });

  const decorations = Array.from(document.querySelectorAll("*")).reduce((n, el) => {
    const cs = getComputedStyle(el);
    let k = 0;
    if (cs.backgroundImage && cs.backgroundImage.includes("gradient")) k++;
    if (cs.boxShadow && cs.boxShadow !== "none") k++;
    if (cs.filter && cs.filter !== "none") k++;
    if (cs.backdropFilter && cs.backdropFilter !== "none") k++;
    return n + k;
  }, 0);

  return {
    total_height_px: total,
    viewport_height_px: vh,
    viewports: +(total / vh).toFixed(2),
    words,
    words_above_fold: aboveFold,
    typeface_count: fonts.size,
    color_count: fgColors.size,
    decoration_effects: decorations,
  };
});

console.log(JSON.stringify(m, null, 2));
