import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTutorContext,
  compactCurriculumCatalog,
  getAiConfig,
  normalizeEndpoint,
  saveAiConfig
} from "../js/ai.js";
import { CURRICULUM } from "../js/data.js";
import {
  OCR_RESPONSE_SCHEMA,
  TUTOR_RESPONSE_SCHEMA,
  TUTOR_SUMMARY_SCHEMA,
  sanitizeCatalog,
  sanitizeTutorContext
} from "../worker/src/index.js";
import worker from "../worker/src/index.js";

test("模型服务地址会规范化且不接受非 HTTP 协议", () => {
  assert.equal(normalizeEndpoint("example.workers.dev/"), "https://example.workers.dev");
  assert.equal(normalizeEndpoint("localhost:8787/"), "http://localhost:8787");
  assert.throws(() => normalizeEndpoint("javascript:alert(1)"), /http/);
});

test("AI 配置只保存服务地址，不包含 API Key", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value)
  };
  saveAiConfig({ endpoint: "https://example.workers.dev", apiKey: "secret" }, storage);
  const serialized = [...values.values()].join("");
  assert.equal(getAiConfig(storage).endpoint, "https://example.workers.dev");
  assert.equal(serialized.includes("secret"), false);
  assert.equal(serialized.includes("apiKey"), false);
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
