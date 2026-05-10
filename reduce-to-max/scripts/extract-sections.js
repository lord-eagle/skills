// extract-sections.js — emit per-section JSON for a URL.
//
// Runtime invocation patterns the skill will use:
//   1. Edit the URL constant below, then: dev-browser run extract-sections.js
//   2. Pipe with URL injected at the top:
//      cat <(echo "const URL='http://...';") scripts/extract-sections.js | dev-browser
//
// Section heuristic stack (first match wins, deepest acceptable container):
//   1. <section> elements
//   2. <aside> elements
//   3. Top-level <div> children of <main>
//   4. Top-level <div> children of <body> when no <main> exists
//
// Output: JSON array; each entry has { index, tag, cls, id, heading, words, ctas, rect, claim }.

const URL = "http://127.0.0.1:8011/gaze"; // override for runtime invocation

const page = await browser.getPage("extract-sections");
await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);

const sections = await page.evaluate(() => {
  const candidates = [];
  const seen = new Set();
  const main = document.querySelector("main") || document.body;

  function pushIfNew(el) {
    if (!el || seen.has(el)) return;
    seen.add(el);
    candidates.push(el);
  }

  document.querySelectorAll("section").forEach(pushIfNew);
  document.querySelectorAll("aside").forEach(pushIfNew);
  Array.from(main.children).forEach((child) => {
    if (child.tagName === "DIV") pushIfNew(child);
  });

  function heading(el) {
    const h = el.querySelector("h1") || el.querySelector("h2") || el.querySelector("h3");
    return h ? h.textContent.trim().replace(/\s+/g, " ") : null;
  }

  function ctaCount(el) {
    const links = el.querySelectorAll("a, button");
    let n = 0;
    links.forEach((a) => {
      const cls = (a.className || "").toString().toLowerCase();
      const role = (a.getAttribute("role") || "").toLowerCase();
      if (
        role === "button" ||
        /\bbtn\b|button|cta\b/.test(cls) ||
        a.tagName === "BUTTON"
      ) {
        n++;
      }
    });
    return n;
  }

  return candidates
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 200 && r.height > 80;
    })
    .map((el, idx) => {
      const r = el.getBoundingClientRect();
      return {
        index: idx,
        tag: el.tagName,
        cls: (el.className || "").toString(),
        id: el.id || null,
        heading: heading(el),
        words: (el.textContent || "").trim().split(/\s+/).filter(Boolean).length,
        ctas: ctaCount(el),
        rect: { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height },
        claim: null,
      };
    });
});

console.log(JSON.stringify(sections, null, 2));
