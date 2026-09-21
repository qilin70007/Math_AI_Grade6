import { access, readFile, readdir } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "sw.js",
  "assets/icon.svg",
  "js/app.js",
  "js/ai.js",
  "js/math.js",
  "vendor/katex/katex.js",
  "vendor/katex/katex.min.css",
  "js/core.js",
  "js/data.js",
  "js/storage.js"
];

const serverFiles = [
  "worker/package.json",
  "worker/wrangler.toml",
  "worker/src/index.js",
  "worker/src/model-output.js",
  "AI_SETUP.md"
];

for (const file of requiredFiles) await access(new URL(`../${file}`, import.meta.url));
for (const file of serverFiles) await access(new URL(`../${file}`, import.meta.url));

const manifest = JSON.parse(await readFile(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
if (!manifest.name || !manifest.start_url || !Array.isArray(manifest.icons) || !manifest.icons.length) {
  throw new Error("manifest.webmanifest 缺少必要字段");
}

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
for (const reference of ["./styles.css", "./vendor/katex/katex.min.css", "./js/app.js", "./manifest.webmanifest"]) {
  if (!html.includes(reference)) throw new Error(`index.html 缺少资源引用：${reference}`);
}

const serviceWorker = await readFile(new URL("../sw.js", import.meta.url), "utf8");
const fontCss = await readFile(new URL("../vendor/katex/katex.min.css", import.meta.url), "utf8");
const fonts = await readdir(new URL("../vendor/katex/fonts/", import.meta.url));
for (const match of fontCss.matchAll(/url\(([^)]+)\)/g)) {
  const font = match[1];
  if (!fonts.includes(font.replace(/^fonts\//, ""))) throw new Error(`公式字体缺失：${font}`);
  if (!serviceWorker.includes(`./vendor/katex/${font}`)) throw new Error(`离线公式字体缺失：${font}`);
}
for (const file of requiredFiles.filter((item) => !item.startsWith("tests/"))) {
  if (["sw.js"].includes(file)) continue;
  if (!serviceWorker.includes(`./${file}`) && file !== "manifest.webmanifest") {
    throw new Error(`离线缓存缺少：${file}`);
  }
}

console.log(`静态检查通过：${requiredFiles.length} 个前端文件、${serverFiles.length} 个 AI 服务文件齐全。`);
