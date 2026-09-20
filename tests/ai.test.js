import test from "node:test";
import assert from "node:assert/strict";
import {
  AI_PROVIDER_OPTIONS,
  buildTutorContext,
  compactCurriculumCatalog,
  getAiConfig,
  normalizeEndpoint,
  normalizeProvider,
  providerLabel,
  saveAiConfig
} from "../js/ai.js";
import { CURRICULUM } from "../js/data.js";
import {
  OCR_RESPONSE_SCHEMA,
  PROVIDER_DEFINITIONS,
  TUTOR_RESPONSE_SCHEMA,
  TUTOR_SUMMARY_SCHEMA,
  listProviderStates,
  resolveProvider,
  sanitizeCatalog,
  sanitizeTutorContext
} from "../worker/src/index.js";
import worker from "../worker/src/index.js";

test("模型服务地址会规范化且不接受非 HTTP 协议", () => {
  assert.equal(normalizeEndpoint("example.workers.dev/"), "https://example.workers.dev");
  assert.equal(normalizeEndpoint("localhost:8787/"), "http://localhost:8787");
  assert.throws(() => normalizeEndpoint("javascript:alert(1)"), /http/);
});

test("AI 配置只保存服务地址和模型选择，不包含 API Key", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value)
  };
  saveAiConfig({
    endpoint: "https://example.workers.dev",
    tutorProvider: "deepseek",
    ocrProvider: "glm",
    apiKey: "secret"
  }, storage);
  const serialized = [...values.values()].join("");
  assert.deepEqual(getAiConfig(storage), {
    endpoint: "https://example.workers.dev",
    tutorProvider: "deepseek",
    ocrProvider: "glm"
  });
  assert.equal(serialized.includes("secret"), false);
  assert.equal(serialized.includes("apiKey"), false);
});

test("前端提供五家模型入口且未知选择回退自动", () => {
  assert.deepEqual(AI_PROVIDER_OPTIONS.map((item) => item.id), ["auto", "openai", "deepseek", "kimi", "glm", "hunyuan"]);
  assert.equal(normalizeProvider("GLM"), "glm");
  assert.equal(normalizeProvider("unknown"), "auto");
  assert.equal(providerLabel("hunyuan"), "腾讯混元");
});

test("新设备默认选择 DeepSeek 教学和拍照识题", () => {
  const storage = { getItem: () => null };
  assert.deepEqual(getAiConfig(storage), {
    endpoint: "",
    tutorProvider: "deepseek",
    ocrProvider: "deepseek"
  });
});

test("教学上下文主动排除学生称呼、学校和家长 PIN", () => {
  const state = {
    profile: {
      name: "不应发送的名字",
      school: "不应发送的学校",
      pin: "1234",
      grade: "六年级",
      term: "六年级上",
      textbook: "上海初中数学新版"
    },
    preferences: {
      pace: "稳步",
      depth: "理解优先",
      difficulty: "校内扎实",
      encouragement: "自然简洁"
    }
  };
  const unit = CURRICULUM[0];
  const skill = unit.skills[0];
  const context = buildTutorContext({ state, unit, skill });
  const serialized = JSON.stringify(context);
  assert.equal(serialized.includes("不应发送"), false);
  assert.equal(serialized.includes("1234"), false);
  assert.equal(context.grade, "六年级");
  assert.equal(context.topic, skill.title);
});

test("服务端再次白名单化教学上下文", () => {
  const sanitized = sanitizeTutorContext({
    grade: "六年级",
    topic: "分数加减法",
    name: "额外姓名",
    school: "额外学校",
    preferences: { depth: "理解优先", unknown: "ignore" }
  });
  assert.deepEqual(Object.keys(sanitized).sort(), ["grade", "mastery", "mistake", "preferences", "skillId", "term", "topic", "unit", "unitId"].sort());
  assert.equal(JSON.stringify(sanitized).includes("额外"), false);
  assert.equal("unknown" in sanitized.preferences, false);
});

test("OCR 目录保留可回填的单元和知识点 ID", () => {
  const catalog = compactCurriculumCatalog(CURRICULUM);
  assert.equal(catalog.length, CURRICULUM.length);
  assert.equal(catalog[0].id, CURRICULUM[0].id);
  assert.equal(catalog[0].skills[0].id, CURRICULUM[0].skills[0].id);
  assert.deepEqual(sanitizeCatalog(catalog)[0], catalog[0]);
});

test("三类模型输出均使用严格结构化 Schema", () => {
  for (const schema of [TUTOR_RESPONSE_SCHEMA, TUTOR_SUMMARY_SCHEMA, OCR_RESPONSE_SCHEMA]) {
    assert.equal(schema.type, "object");
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual([...schema.required].sort(), Object.keys(schema.properties).sort());
  }
  assert.ok(OCR_RESPONSE_SCHEMA.properties.confidence);
  assert.ok(TUTOR_RESPONSE_SCHEMA.properties.masterySignal);
});

test("服务端区分教学与视觉能力并支持自动路由", () => {
  assert.deepEqual(Object.keys(PROVIDER_DEFINITIONS), ["openai", "deepseek", "kimi", "glm", "hunyuan"]);
  const env = {
    DEEPSEEK_API_KEY: "deepseek-key",
    GLM_API_KEY: "glm-key",
    DEFAULT_TUTOR_PROVIDER: "deepseek",
    DEFAULT_OCR_PROVIDER: "glm"
  };
  const states = listProviderStates(env);
  const deepseek = states.find((item) => item.id === "deepseek");
  const glm = states.find((item) => item.id === "glm");
  assert.equal(deepseek.capabilities.tutor, true);
  assert.equal(deepseek.capabilities.ocr, true);
  assert.equal(deepseek.models.ocr, "deepseek-flash");
  assert.equal(glm.capabilities.tutor, true);
  assert.equal(glm.capabilities.ocr, true);
  assert.equal(resolveProvider(env, "auto", "tutor").id, "deepseek");
  assert.equal(resolveProvider(env, "auto", "ocr").id, "glm");
  assert.equal(resolveProvider(env, "deepseek", "ocr").model, "deepseek-flash");
});

test("Worker 调用模型时关闭存储并再次移除身份字段", async () => {
  const originalFetch = globalThis.fetch;
  let modelRequest;
  globalThis.fetch = async (_url, options) => {
    modelRequest = JSON.parse(options.body);
    const output = {
      reply: "先说说你会怎么做。",
      math: "",
      intent: "question",
      masterySignal: "none",
      suggestedActions: ["给我一点提示"],
      shouldRecordEvidence: false
    };
    return new Response(JSON.stringify({
      output: [{ content: [{ type: "output_text", text: JSON.stringify(output) }] }]
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const request = new Request("https://worker.example/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://qilin70007.github.io" },
      body: JSON.stringify({
        action: "start",
        context: { grade: "六年级", topic: "分数", name: "不应发送", school: "不应发送" },
        messages: []
      })
    });
    const response = await worker.fetch(request, {
      OPENAI_API_KEY: "test-key",
      ALLOWED_ORIGINS: "https://qilin70007.github.io",
      OPENAI_MODEL: "test-model"
    });
    assert.equal(response.status, 200);
    assert.equal(modelRequest.store, false);
    assert.equal(modelRequest.model, "test-model");
    assert.equal(modelRequest.instructions.includes("不应发送"), false);
    assert.equal(modelRequest.text.format.strict, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("DeepSeek 走兼容接口并返回统一的模型元信息", async () => {
  const originalFetch = globalThis.fetch;
  let modelUrl;
  let modelRequest;
  let authorization;
  globalThis.fetch = async (url, options) => {
    modelUrl = String(url);
    modelRequest = JSON.parse(options.body);
    authorization = options.headers.Authorization;
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        reply: "先找出两个数的公因数。",
        math: "",
        intent: "hint",
        masterySignal: "none",
        suggestedActions: ["我先列因数"],
        shouldRecordEvidence: false,
        ignoredExtraField: "服务端应移除"
      }) } }]
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const response = await worker.fetch(new Request("https://worker.example/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://qilin70007.github.io" },
      body: JSON.stringify({
        provider: "deepseek",
        action: "start",
        context: { grade: "六年级", topic: "最大公因数", name: "不应发送" },
        messages: []
      })
    }), {
      DEEPSEEK_API_KEY: "deepseek-key",
      DEEPSEEK_MODEL: "deepseek-test",
      ALLOWED_ORIGINS: "https://qilin70007.github.io"
    });
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(modelUrl, "https://api.deepseek.com/v1/chat/completions");
    assert.equal(authorization, "Bearer deepseek-key");
    assert.equal(modelRequest.model, "deepseek-test");
    assert.equal(modelRequest.response_format.type, "json_object");
    assert.equal(JSON.stringify(modelRequest).includes("不应发送"), false);
    assert.equal(result.meta.provider, "deepseek");
    assert.equal(result.meta.model, "deepseek-test");
    assert.equal("ignoredExtraField" in result, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Kimi OCR 会把图片转换为兼容的 image_url 内容块", async () => {
  const originalFetch = globalThis.fetch;
  let modelRequest;
  globalThis.fetch = async (_url, options) => {
    modelRequest = JSON.parse(options.body);
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        success: true,
        confidence: 0.9,
        title: "分数加法",
        problem: "1/2+1/3=?",
        studentAnswer: "2/5",
        unitId: "",
        skillId: "",
        unitHint: "分数",
        skillHint: "异分母加法",
        errorType: "计算错误",
        analysis: "未通分",
        correction: "先通分",
        formulas: ["1/2+1/3=5/6"],
        warnings: []
      }) } }]
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const response = await worker.fetch(new Request("https://worker.example/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://qilin70007.github.io" },
      body: JSON.stringify({
        provider: "kimi",
        imageDataUrl: "data:image/png;base64,iVBORw0KGgo=",
        catalog: []
      })
    }), {
      KIMI_API_KEY: "kimi-key",
      KIMI_MODEL: "kimi-test",
      ALLOWED_ORIGINS: "https://qilin70007.github.io"
    });
    const result = await response.json();
    const imageBlock = modelRequest.messages.at(-1).content.find((item) => item.type === "image_url");
    assert.equal(response.status, 200);
    assert.equal(modelRequest.model, "kimi-test");
    assert.equal(imageBlock.image_url.url, "data:image/png;base64,iVBORw0KGgo=");
    assert.equal(result.meta.provider, "kimi");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("DeepSeek 拍照识题使用 deepseek-flash 和同一个 API Key", async () => {
  const originalFetch = globalThis.fetch;
  let modelUrl;
  let modelRequest;
  let authorization;
  globalThis.fetch = async (url, options) => {
    modelUrl = String(url);
    modelRequest = JSON.parse(options.body);
    authorization = options.headers.Authorization;
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        success: true,
        confidence: 0.91,
        title: "分数加法",
        problem: "1/2+1/3=?",
        studentAnswer: "2/5",
        errorType: "计算错误"
      }) } }]
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const response = await worker.fetch(new Request("https://worker.example/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://qilin70007.github.io" },
      body: JSON.stringify({
        provider: "deepseek",
        imageDataUrl: "data:image/png;base64,iVBORw0KGgo=",
        catalog: []
      })
    }), {
      DEEPSEEK_API_KEY: "deepseek-key",
      DEFAULT_OCR_PROVIDER: "deepseek",
      ALLOWED_ORIGINS: "https://qilin70007.github.io"
    });
    const result = await response.json();
    const imageBlock = modelRequest.messages.at(-1).content.find((item) => item.type === "image_url");
    assert.equal(response.status, 200);
    assert.equal(modelUrl, "https://api.deepseek.com/v1/chat/completions");
    assert.equal(authorization, "Bearer deepseek-key");
    assert.equal(modelRequest.model, "deepseek-flash");
    assert.equal(imageBlock.image_url.url, "data:image/png;base64,iVBORw0KGgo=");
    assert.equal(result.meta.provider, "deepseek");
    assert.equal(result.meta.model, "deepseek-flash");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("健康检查只公开配置状态、能力和模型，不公开密钥", async () => {
  const response = await worker.fetch(new Request("https://worker.example/health", {
    headers: { Origin: "https://qilin70007.github.io" }
  }), {
    KIMI_API_KEY: "never-return-this-key",
    DEEPSEEK_API_KEY: "also-secret",
    DEFAULT_TUTOR_PROVIDER: "deepseek",
    DEFAULT_OCR_PROVIDER: "kimi",
    ALLOWED_ORIGINS: "https://qilin70007.github.io"
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.defaults.tutor.provider, "deepseek");
  assert.equal(result.defaults.ocr.provider, "kimi");
  assert.equal(result.providers.find((item) => item.id === "deepseek").capabilities.ocr, true);
  assert.equal(JSON.stringify(result).includes("never-return-this-key"), false);
  assert.equal(JSON.stringify(result).includes("also-secret"), false);
});
