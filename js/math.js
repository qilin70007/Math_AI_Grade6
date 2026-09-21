import katex from "../vendor/katex/katex.js";

const cache = new Map();
const delimiters = [
  { left: "$$", right: "$$", display: true },
  { left: "\\[", right: "\\]", display: true },
  { left: "\\(", right: "\\)", display: false },
  { left: "$", right: "$", display: false }
];

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]).replace(/\r?\n/g, "<br />");
}

function escapedAt(text, index) {
  let slashes = 0;
  while (index > 0 && text[--index] === "\\") slashes += 1;
  return slashes % 2 === 1;
}

function closingIndex(text, start, right) {
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (depth === 0 && text.startsWith(right, i) && !escapedAt(text, i)) return i;
    if (escapedAt(text, i)) continue;
    if (text[i] === "{") depth += 1;
    if (text[i] === "}") depth = Math.max(0, depth - 1);
  }
  return -1;
}

function renderFormula(source, display) {
  // Recover known control-character damage in older saved JSON replies.
  const tex = source.replace(/\u000crac\b/g, "\\frac")
    .replace(/\u0008(egin|eta|inom|ar)\b/g, "\\b$1")
    .replace(/\t(imes|ext|heta|frac)\b/g, "\\t$1")
    .replace(/\r(ight|ho)\b/g, "\\r$1");
  const key = `${display}:${tex}`;
  if (cache.has(key)) return cache.get(key);
  let html;
  try {
    if (tex.length > 8_000) throw new Error("Formula too long");
    html = `<span class="math-rendered${display ? " math-display" : ""}">${katex.renderToString(tex, {
      displayMode: display,
      throwOnError: true,
      trust: false,
      strict: "ignore",
      output: "htmlAndMathml",
      maxSize: 10,
      maxExpand: 1_000
    })}</span>`;
  } catch {
    html = `<span class="math-fallback" title="这条公式暂未排版，保留原文">${escapeText(source)}</span>`;
  }
  if (cache.size >= 128) cache.delete(cache.keys().next().value);
  cache.set(key, html);
  return html;
}

// Return escaped prose plus trusted renderer output, never model-provided HTML.
// Used for chat, suggested answers, OCR details and reports (including old data).
export function renderMathText(value, { formula = false } = {}) {
  const text = String(value ?? "");
  let html = "";
  let cursor = 0;
  let found = false;
  for (let i = 0; i < text.length; i += 1) {
    if (escapedAt(text, i)) continue;
    const delimiter = delimiters.find((item) => text.startsWith(item.left, i));
    if (!delimiter) continue;
    const start = i + delimiter.left.length;
    const end = closingIndex(text, start, delimiter.right);
    if (end <= start) continue;
    html += escapeText(text.slice(cursor, i));
    html += renderFormula(text.slice(start, end), delimiter.display);
    cursor = end + delimiter.right.length;
    i = cursor - 1;
    found = true;
  }
  if (!found && formula && text.trim()) {
    return text.split(/\r?\n/).map((line) => renderFormula(line, false)).join("<br />");
  }
  return html + escapeText(text.slice(cursor));
}
