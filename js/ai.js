const AI_CONFIG_KEY = "math-ai-grade6:ai-config:v1";
const REQUEST_TIMEOUT = 70_000;

function safeStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function normalizeEndpoint(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(raw)
    ? raw
    : /^(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(raw)
      ? `http://${raw}`
      : `https://${raw}`;
  let url;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("服务地址必须是有效的 http:// 或 https:// 地址");
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("服务地址必须以 http:// 或 https:// 开头");
  }
  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString().replace(/\/$/, "");
}

export function defaultAiEndpoint(locationValue = globalThis.location) {
  const hostname = locationValue?.hostname || "";
  return hostname === "localhost" || hostname === "127.0.0.1" ? "http://localhost:8787" : "";
}

export function getAiConfig(storage = safeStorage()) {
  const fallback = { endpoint: defaultAiEndpoint() };
  if (!storage) return fallback;
  try {
    const saved = JSON.parse(storage.getItem(AI_CONFIG_KEY) || "null");
    return { endpoint: normalizeEndpoint(saved?.endpoint || fallback.endpoint) };
  } catch {
    return fallback;
  }
}

export function saveAiConfig(config, storage = safeStorage()) {
  const saved = { endpoint: normalizeEndpoint(config?.endpoint) };
  if (storage) storage.setItem(AI_CONFIG_KEY, JSON.stringify(saved));
  return saved;
}

export function isAiConfigured(config = getAiConfig()) {
  return Boolean(config?.endpoint);
}

function cleanText(value, maxLength = 2_000) {
  return String(value || "").trim().slice(0, maxLength);
}

export function buildTutorContext({ state, skill, unit, mistake = null }) {
  return {
    grade: cleanText(state?.profile?.grade, 20),
    term: cleanText(state?.profile?.term, 30),
    unitId: cleanText(unit?.id, 50),
    unit: cleanText(unit?.title, 100),
    skillId: cleanText(skill?.id, 80),
    topic: cleanText(skill?.title, 120),
    mastery: Number.isFinite(Number(skill?.mastery)) ? Math.max(0, Math.min(100, Number(skill.mastery))) : 0,
    preferences: {
      pace: cleanText(state?.preferences?.pace, 30),
      depth: cleanText(state?.preferences?.depth, 30),
      difficulty: cleanText(state?.preferences?.difficulty, 80),
      encouragement: cleanText(state?.preferences?.encouragement, 30)
    },
    mistake: mistake ? {
      title: cleanText(mistake.title, 160),
      problem: cleanText(mistake.problem, 3_000),
      studentAnswer: cleanText(mistake.studentAnswer, 800),
      analysis: cleanText(mistake.analysis, 1_000),
      correction: cleanText(mistake.correction, 1_500)
    } : null
  };
}

export function compactCurriculumCatalog(curriculum) {
  return (curriculum || []).map((unit) => ({
    id: cleanText(unit.id, 50),
    title: cleanText(unit.title, 100),
    term: cleanText(unit.term, 30),
    skills: (unit.skills || []).map((skill) => ({
      id: cleanText(skill.id, 80),
      title: cleanText(skill.title, 120)
    }))
  }));
}

async function requestJson(path, options = {}, config = getAiConfig()) {
  const endpoint = normalizeEndpoint(config?.endpoint);
  if (!endpoint) throw new Error("还没有连接大模型服务，请先在家长设置中填写服务地址");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || REQUEST_TIMEOUT);
  try {
    const response = await fetch(`${endpoint}${path}`, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || `大模型服务暂时不可用（${response.status}）`);
    }
    return payload;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("请求超时，请检查网络后重试");
    if (error instanceof TypeError) throw new Error("无法连接大模型服务，请检查服务地址和网络");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function checkAiHealth(config = getAiConfig()) {
  return requestJson("/health", { timeout: 15_000 }, config);
}

export function startTutorSession(context, config = getAiConfig()) {
  return requestJson("/api/tutor", {
    method: "POST",
    body: { action: "start", context, messages: [] }
  }, config);
}

export function sendTutorMessage({ context, messages, input, action = "message" }, config = getAiConfig()) {
  return requestJson("/api/tutor", {
    method: "POST",
    body: { action, context, messages, input }
  }, config);
}

export function summarizeTutorSession({ context, messages }, config = getAiConfig()) {
  return requestJson("/api/tutor", {
    method: "POST",
    body: { action: "summary", context, messages }
  }, config);
}

export function recognizeMathImage({ imageDataUrl, catalog }, config = getAiConfig()) {
  return requestJson("/api/ocr", {
    method: "POST",
    timeout: 90_000,
    body: { imageDataUrl, catalog }
  }, config);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("图片读取失败，请重新选择"));
    reader.readAsDataURL(file);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("当前图片格式无法识别，请改用 JPG、PNG 或 WebP"));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("图片压缩失败")), "image/jpeg", quality);
  });
}

export async function imageFileToDataUrl(file, options = {}) {
  if (!(file instanceof Blob) || !file.size) throw new Error("请先拍照或选择一张题目图片");
  if (file.size > (options.maxSourceBytes || 18 * 1024 * 1024)) {
    throw new Error("原图超过18MB，请先裁剪后再试");
  }

  const image = await loadImage(file);
  const maxDimension = options.maxDimension || 2_000;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const maxBytes = options.maxBytes || 2_400_000;
  let quality = options.quality || 0.9;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > maxBytes && quality > 0.55) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }
  return fileToDataUrl(blob);
}
