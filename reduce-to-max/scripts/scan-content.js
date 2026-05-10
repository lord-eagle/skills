// scan-content.js — scan page content for C5/C6 violations and form-label issues.
//
// Runtime invocation:
//   1. Edit URL constant below, then: dev-browser run scripts/scan-content.js
//   2. Or stdin-pipe the URL prefix per the SKILL.md Helper scripts section.
//
// Output JSON shape:
//   {
//     metaphor_hits: [{ text, selector }, ...],
//     internal_leaks: [{ text, selector }, ...],
//     unlabeled_inputs: [{ tag, type, name, placeholder, selector }, ...],
//     missing_required_indicators: [{ tag, name, selector }, ...]
//   }

const URL = "http://127.0.0.1:8011/";

const page = await browser.getPage("scan-content");
await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);

const result = await page.evaluate(() => {
  // C6 — metaphor recurrence
  const metaphorPatterns = [
    /\bVol\.\s*\d+/i,
    /\bIssue\s*\d+/i,
    /\bp\.0?\d+\b/i,
    /\bSheet\s*\d+\s*\/\s*\d+/i,
    /\bFeature\s*·\s*\d+\s*of\s*\d+/i,
    /\bProduct\s*no\.\s*\d+/i,
    /\bChapter\s*\d+/i,
  ];

  const metaphorHits = [];
  document.querySelectorAll("body *").forEach((el) => {
    if (el.children.length > 0) return; // leaf nodes only
    const text = (el.textContent || "").trim();
    if (!text || text.length > 200) return;
    for (const re of metaphorPatterns) {
      if (re.test(text)) {
        metaphorHits.push({
          text: text.slice(0, 120),
          selector: cssPath(el),
        });
        break;
      }
    }
  });

  // C5 — internal-language leak
  const leakPatterns = [
    /\/admin\b/i,
    /\/internal\b/i,
    /\bTODO\b/,
    /\bFIXME\b/,
    /\bWIP\b/,
    /staging\.[a-z0-9-]+/i,
    /localhost(:\d+)?/i,
    /127\.0\.0\.1/,
    /toggle visibility/i,
  ];

  const internalLeaks = [];
  document.querySelectorAll("body *").forEach((el) => {
    if (el.children.length > 0) return;
    const text = (el.textContent || "").trim();
    if (!text || text.length > 400) return;
    for (const re of leakPatterns) {
      if (re.test(text)) {
        internalLeaks.push({
          text: text.slice(0, 200),
          selector: cssPath(el),
        });
        break;
      }
    }
  });

  // F1 — unlabeled inputs
  const inputs = document.querySelectorAll("input, textarea, select");
  const unlabeled = [];
  inputs.forEach((el) => {
    if (el.type === "hidden" || el.type === "submit" || el.type === "button") return;
    const id = el.id;
    let hasLabel = false;
    if (id) {
      hasLabel = !!document.querySelector(`label[for="${id}"]`);
    }
    if (!hasLabel && el.closest("label")) hasLabel = true;
    if (!hasLabel && el.getAttribute("aria-label")) hasLabel = true;
    if (!hasLabel && el.getAttribute("aria-labelledby")) hasLabel = true;
    if (!hasLabel) {
      unlabeled.push({
        tag: el.tagName,
        type: el.type || null,
        name: el.name || null,
        placeholder: el.placeholder || null,
        selector: cssPath(el),
      });
    }
  });

  // F2 — required fields without indication
  const missingRequired = [];
  inputs.forEach((el) => {
    if (!el.required) return;
    const id = el.id;
    let label = null;
    if (id) label = document.querySelector(`label[for="${id}"]`);
    if (!label) label = el.closest("label");
    const labelText = label ? label.textContent : "";
    const hasIndicator =
      /\*/.test(labelText) ||
      /required/i.test(labelText) ||
      el.getAttribute("aria-required") === "true";
    if (!hasIndicator) {
      missingRequired.push({
        tag: el.tagName,
        name: el.name || null,
        selector: cssPath(el),
      });
    }
  });

  function cssPath(el) {
    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === 1 && parts.length < 5) {
      let part = cur.tagName.toLowerCase();
      if (cur.id) {
        part += "#" + cur.id;
        parts.unshift(part);
        break;
      } else if (cur.className && typeof cur.className === "string") {
        const cls = cur.className.trim().split(/\s+/).slice(0, 2).join(".");
        if (cls) part += "." + cls;
      }
      parts.unshift(part);
      cur = cur.parentElement;
    }
    return parts.join(" > ");
  }

  return {
    metaphor_hits: metaphorHits,
    internal_leaks: internalLeaks,
    unlabeled_inputs: unlabeled,
    missing_required_indicators: missingRequired,
  };
});

console.log(JSON.stringify(result, null, 2));
