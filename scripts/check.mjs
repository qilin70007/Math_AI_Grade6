import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "sw.js",
  "assets/icon.svg",
  "js/app.js",
  "js/core.js",
  "js/data.js",
  "js/storage.js"
];

for (const file of requiredFiles) await access(new URL(`../${file}`, import.meta.url));

const manifest = JSON.parse(await readFile(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
if (!manifest.name || !manifest.start_url || !Array.isArray(manifest.icons) || !manifest.icons.length) {
  throw new Error("manifest.webmanifest 缺少必要字段");
}

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
for (const reference of ["./styles.css", "./js/app.js", "./manifest.webmanifest"]) {
  if (!html.includes(reference)) throw new Error(`index.html 缺少资源引用：${reference}`);
}

const serviceWorker = await readFile(new URL("../sw.js", import.meta.url), "utf8");
for (const file of requiredFiles.filter((item) => !item.startsWith("tests/"))) {
  if (["sw.js"].includes(file)) continue;
  if (!serviceWorker.includes(`./${file}`) && file !== "manifest.webmanifest") {
    throw new Error(`离线缓存缺少：${file}`);
  }
}

console.log(`静态检查通过：${requiredFiles.length} 个核心文件齐全。`);
