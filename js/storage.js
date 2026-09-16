import { createDefaultState, hydrateState } from "./core.js";

const STATE_KEY = "math-ai-grade6:state:v1";
const DB_NAME = "math-ai-grade6";
const DB_VERSION = 1;
const IMAGE_STORE = "mistake-images";

export function loadState() {
  try {
    const value = localStorage.getItem(STATE_KEY);
    return value ? hydrateState(JSON.parse(value)) : createDefaultState();
  } catch (error) {
    console.warn("学习数据读取失败，已使用初始数据。", error);
    return createDefaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function resetState() {
  const state = createDefaultState();
  saveState(state);
  return state;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) {
      reject(new Error("当前浏览器不支持图片存储"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE)) {
        database.createObjectStore(IMAGE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transact(mode, action) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE, mode);
    const store = transaction.objectStore(IMAGE_STORE);
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  }));
}

export async function saveMistakeImage(file, id = crypto.randomUUID()) {
  await transact("readwrite", (store) => store.put({ id, blob: file, type: file.type, name: file.name }));
  return id;
}

export async function getMistakeImage(id) {
  if (!id) return null;
  const record = await transact("readonly", (store) => store.get(id));
  return record?.blob ? URL.createObjectURL(record.blob) : null;
}

export async function deleteMistakeImage(id) {
  if (!id) return;
  await transact("readwrite", (store) => store.delete(id));
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [meta, encoded] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta)?.[1] || "application/octet-stream";
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

export async function createBackup(state) {
  const images = [];
  for (const mistake of state.mistakes) {
    if (!mistake.photoId) continue;
    try {
      const record = await transact("readonly", (store) => store.get(mistake.photoId));
      if (record?.blob) {
        images.push({
          id: record.id,
          name: record.name,
          type: record.type,
          dataUrl: await blobToDataUrl(record.blob)
        });
      }
    } catch (error) {
      console.warn("某张错题图片未能加入备份", error);
    }
  }
  return {
    format: "math-ai-grade6-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
    images
  };
}

export async function restoreBackup(backup) {
  if (backup?.format !== "math-ai-grade6-backup" || !backup.state) {
    throw new Error("这不是有效的数芽备份文件");
  }
  const state = hydrateState(backup.state);
  for (const image of backup.images || []) {
    const blob = dataUrlToBlob(image.dataUrl);
    await transact("readwrite", (store) => store.put({
      id: image.id,
      name: image.name,
      type: image.type,
      blob
    }));
  }
  saveState(state);
  return state;
}
