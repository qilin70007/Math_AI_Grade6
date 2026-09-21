import test from "node:test";
import assert from "node:assert/strict";
import { ModelOutputError, parseModelJson } from "../worker/src/model-output.js";
import worker from "../worker/src/index.js";

test("模型 JSON 中裸 LaTeX 反斜杠不会破坏分数、根式、乘号和括号", () => {
  const value = parseModelJson(String.raw`{"reply":"比较 $\frac{3}{5}$ 与 $\sqrt{2}$","math":"\left(\frac{1}{2}\right)\times 3\neq 0"}`);
  assert.equal(value.reply, String.raw`比较 $\frac{3}{5}$ 与 $\sqrt{2}$`);
  assert.equal(value.math, String.raw`\left(\frac{1}{2}\right)\times 3\neq 0`);
  assert.equal(/[\u0000-\u001f]/.test(value.math), false);
});

test("合法 JSON 的公式、换行、制表符、引号和 Unicode 转义保持不变", () => {
  const value = { reply: '第一行\n第二行\t“思路” "引号"', math: String.raw`\frac{2}{3}`, nested: { text: "{花括号}" } };
  assert.deepEqual(parseModelJson(JSON.stringify(value)), value);
  assert.equal(parseModelJson(String.raw`{"reply":"\u4f60\u597d"}`).reply, "你好");
});

test("JSON 代码块、说明前缀、字符串中的花括号和尾逗号均可读取", () => {
  assert.deepEqual(parseModelJson('说明：\n```json\n{"reply":"看 {a,b}","suggestedActions":["{先通分}",],}\n```'), {
    reply: "看 {a,b}", suggestedActions: ["{先通分}"]
  });
  assert.equal(parseModelJson('{"reply":"第一行\n第二行"}').reply, "第一行\n第二行");
});

test("截断、错误字段语法、数组和空回复不会伪造成有效内容", () => {
  for (const text of ['{"reply":"未完成', '{"reply":"完整","math":', '[{"reply":"不能当成对象"}]', '{reply:"无引号"}', '']) {
    assert.throws(() => parseModelJson(text), ModelOutputError);
  }
});

const validTurn = { reply: "你会怎样通分？", math: String.raw`$\frac{3}{5}$`, suggestedActions: ["找公分母"] };
const env = { DEEPSEEK_API_KEY: "test-deepseek-key", OPENAI_API_KEY: "other-key", DEFAULT_TUTOR_PROVIDER: "deepseek" };
let requestId = 0;
function tutorRequest(extra = {}) {
  return new Request("https://worker.example/api/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": `test-output-${++requestId}` },
    body: JSON.stringify({ provider: "deepseek", action: "message", context: { topic: "分数大小比较" }, messages: [], input: "我想先通分", ...extra })
  });
}
function chatResponse(content, finishReason = "stop") {
  return Response.json({ choices: [{ message: { content }, finish_reason: finishReason }] });
}

test("截断回复只在同一模型补试一次，增加额度并保留原始作答", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    // Even syntactically valid JSON must be retried when the API says it is truncated.
    return calls.length === 1 ? chatResponse(JSON.stringify(validTurn), "length") : chatResponse(JSON.stringify(validTurn));
  });
  const response = await worker.fetch(tutorRequest(), env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.reply, validTurn.reply);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, calls[1].url);
  assert.equal(calls[1].body.model, calls[0].body.model);
  assert.ok(calls[1].body.max_tokens > calls[0].body.max_tokens);
  assert.equal(calls[0].body.thinking.type, "disabled");
  assert.equal(calls[1].body.messages.at(-1).content, "我想先通分");
  assert.equal(calls[1].body.messages.some((item) => item.role === "assistant"), false);
});

test("空回复与无效教学结构补试失败后返回明确错误，无第三次调用", async (t) => {
  for (const [content, code] of [["", "MODEL_EMPTY"], ['{"reply":{"bad":"object"}}', "MODEL_FORMAT"]]) {
    let calls = 0;
    const mock = t.mock.method(globalThis, "fetch", async () => {
      calls += 1;
      return chatResponse(content);
    });
    const response = await worker.fetch(tutorRequest(), env);
    const result = await response.json();
    assert.equal(response.status, 502);
    assert.equal(calls, 2);
    assert.equal(result.code, code);
    assert.match(result.error, /作答已保留/);
    assert.equal("reply" in result, false);
    mock.mock.restore();
  }
});

test("鉴权、额度、余额和拒绝回复不会自动重试或切换厂商", async (t) => {
  for (const status of [401, 402, 429, 200]) {
    let calls = 0;
    const mock = t.mock.method(globalThis, "fetch", async () => {
      calls += 1;
      return status === 200
        ? chatResponse("", "content_filter")
        : Response.json({ error: { code: "rejected", message: "upstream details including test-deepseek-key" } }, { status });
    });
    const response = await worker.fetch(tutorRequest(), env);
    const text = await response.text();
    assert.ok(response.status >= 400);
    assert.equal(calls, 1);
    assert.equal(text.includes("test-deepseek-key"), false);
    assert.equal(text.includes("upstream details"), false);
    mock.mock.restore();
  }
});

test("网络异常使用连接错误提示，不冒充模型格式错误", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls += 1; throw new TypeError("fetch failed"); });
  const response = await worker.fetch(tutorRequest(), env);
  const result = await response.json();
  assert.equal(result.code, "UPSTREAM_NETWORK");
  assert.match(result.error, /无法连接 DeepSeek/);
  assert.equal(calls, 1);
});

test("Responses 的截断会补试，分块文本拼合后读取完整 JSON", async (t) => {
  let calls = 0;
  const output = JSON.stringify(validTurn);
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    return Response.json(calls === 1 ? { status: "incomplete", output_text: output } : {
      status: "completed", output: [{ content: [
        { type: "output_text", text: output.slice(0, 20) },
        { type: "output_text", text: output.slice(20) }
      ] }]
    });
  });
  const response = await worker.fetch(tutorRequest({ provider: "openai" }), env);
  assert.equal((await response.json()).reply, validTurn.reply);
  assert.equal(calls, 2);
});

test("OCR 格式补试保留图片，识别失败时不捏造题目", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return chatResponse(calls.length === 1 ? "not JSON" : JSON.stringify({ success: false, problem: "", warnings: ["看不清"] }));
  });
  const response = await worker.fetch(new Request("https://worker.example/api/ocr", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "deepseek", imageDataUrl: "data:image/png;base64,iVBORw0KGgo=", catalog: [] })
  }), env);
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].messages.at(-1), calls[1].messages.at(-1));
  assert.equal(result.success, false);
  assert.equal(result.problem, "");
  assert.ok(result.warnings.includes("看不清"));
});
