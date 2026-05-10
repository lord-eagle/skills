// overlay-render.js — annotate the live dev page with finding outlines.
//
// Runtime invocation:
//   1. Caller writes findings JSON to ~/.dev-browser/tmp/overlay-findings.json
//      Shape: array of { anchor: "css-selector", level: "cut" | "merge" | "fine", code: "C2", hint: "..." }
//   2. Edit the URL constant below if needed, then run:
//      dev-browser run scripts/overlay-render.js
//
// Each finding object may include a `route` URL. If present, the script
// navigates to that route before rendering. This enables multi-route apply
// flows where each finding lives on a different page.
//
// QuickJS sandbox does not expose process.argv, so URL is a top-of-file constant
// and the findings file path is fixed to overlay-findings.json under the sandbox
// tmp dir (the only location readFile() can access).

const URL = "http://127.0.0.1:8011/gaze";
const FINDINGS_FILE = "overlay-findings.json";

const raw = await readFile(FINDINGS_FILE);
const findings = JSON.parse(raw);

const page = await browser.getPage("overlay");
// Navigate to the finding's route if provided; fall back to the URL constant
const targetUrl = findings[0]?.route || URL;
await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);

await page.evaluate((findings) => {
  const colors = { cut: "#d62828", merge: "#f4a261", fine: "#2a9d8f" };
  const existing = document.getElementById("rtm-overlay-layer");
  if (existing) existing.remove();

  const layer = document.createElement("div");
  layer.id = "rtm-overlay-layer";
  Object.assign(layer.style, {
    position: "absolute", inset: "0", pointerEvents: "none", zIndex: "999999",
  });
  document.body.appendChild(layer);

  findings.forEach((f) => {
    const el = document.querySelector(f.anchor);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const box = document.createElement("div");
    Object.assign(box.style, {
      position: "absolute",
      top: (r.top + window.scrollY) + "px",
      left: (r.left + window.scrollX) + "px",
      width: r.width + "px",
      height: r.height + "px",
      outline: "3px solid " + (colors[f.level] || "#aaa"),
      outlineOffset: "-3px",
      background: "transparent",
      pointerEvents: "auto",
      boxSizing: "border-box",
    });
    const label = document.createElement("div");
    Object.assign(label.style, {
      position: "absolute", top: "-22px", left: "0",
      background: colors[f.level] || "#aaa", color: "#fff",
      padding: "2px 6px", font: "12px/1.2 system-ui, sans-serif",
      borderRadius: "3px",
    });
    label.textContent = f.code + " · " + f.level;
    box.title = f.hint || "";
    box.appendChild(label);
    layer.appendChild(box);
  });
}, findings);

console.log(JSON.stringify({ ok: true, applied: findings.length }));
