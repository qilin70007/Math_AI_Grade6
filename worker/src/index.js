const DEFAULT_MODEL = "gpt-5.6-terra";
const MAX_REQUEST_BYTES = 8_000_000;
const MAX_IMAGE_DATA_URL = 6_500_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 36;
const requestBuckets = new Map();

export const PROVIDER_DEFINITIONS = Object.freeze({
  openai: Object.freeze({
    id: "openai",
    label: "OpenAI",
    protocol: "responses",
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrlEnv: "OPENAI_BASE_URL",
    defaultBaseUrl: "https://api.openai.com/v1",
    tutorModelEnv: "OPENAI_MODEL",
    defaultTutorModel: DEFAULT_MODEL,
    visionModelEnv: "OPENAI_VISION_MODEL",
    defaultVisionModel: "@tutor"
  }),
  deepseek: Object.freeze({
    id: "deepseek",
    label: "DeepSeek",
    protocol: "chat_completions",
    jsonMode: true,
    apiKeyEnv: "DEEPSEEK_API_KEY",
    baseUrlEnv: "DEEPSEEK_BASE_URL",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    tutorModelEnv: "DEEPSEEK_MODEL",
    defaultTutorModel: "deepseek-flash",
    visionModelEnv: "DEEPSEEK_VISION_MODEL",
    defaultVisionModel: "deepseek-flash"
  }),
  kimi: Object.freeze({
    id: "kimi",
    label: "Kimi",
    protocol: "chat_completions",
    jsonMode: true,
    apiKeyEnv: "KIMI_API_KEY",
    baseUrlEnv: "KIMI_BASE_URL",
    defaultBaseUrl: "https://api.moonshot.ai/v1",
    tutorModelEnv: "KIMI_MODEL",
    defaultTutorModel: "kimi-k3",
    visionModelEnv: "KIMI_VISION_MODEL",
    defaultVisionModel: "@tutor"
  }),
  glm: Object.freeze({
    id: "glm",
    label: "智谱 GLM",
    protocol: "chat_completions",
    jsonMode: true,
    apiKeyEnv: "GLM_API_KEY",
    baseUrlEnv: "GLM_BASE_URL",
    defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
    tutorModelEnv: "GLM_MODEL",
    defaultTutorModel: "glm-5.3-flash",
    visionModelEnv: "GLM_VISION_MODEL",
    defaultVisionModel: "@tutor"
  }),
  hunyuan: Object.freeze({
    id: "hunyuan",
    label: "腾讯混元",
    protocol: "chat_completions",
    jsonMode: false,
    apiKeyEnv: "HUNYUAN_API_KEY",
    baseUrlEnv: "HUNYUAN_BASE_URL",
    defaultBaseUrl: "https://api.hunyuan.cloud.tencent.com/v1",
    tutorModelEnv: "HUNYUAN_MODEL",
    defaultTutorModel: "hunyuan-turbos-latest",
    visionModelEnv: "HUNYUAN_VISION_MODEL",
    defaultVisionModel: "hunyuan-turbos-vision"
  })
});

const PROVIDER_IDS = Object.keys(PROVIDER_DEFINITIONS);

export const TUTOR_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    math: { type: "string" },
    intent: { type: "string", enum: ["question", "hint", "feedback", "explanation", "checkpoint"] },
    masterySignal: { type: "string", enum: ["none", "struggling", "progress", "mastered"] },
    suggestedActions: { type: "array", items: { type: "string" }, maxItems: 3 },
    shouldRecordEvidence: { type: "boolean" }
  },
  required: ["reply", "math", "intent", "masterySignal", "suggestedActions", "shouldRecordEvidence"]
};

export const TUTOR_SUMMARY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    summary: { type: "string" },
    score: { type: "integer", minimum: 0, maximum: 100 },
    independentRate: { type: "integer", minimum: 0, maximum: 100 },
    strengths: { type: "array", items: { type: "string" }, maxItems: 3 },
    needsWork: { type: "array", items: { type: "string" }, maxItems: 3 },
    nextPlan: { type: "string" },
    masterySignal: { type: "string", enum: ["none", "struggling", "progress", "mastered"] }
  },
  required: ["reply", "summary", "score", "independentRate", "strengths", "needsWork", "nextPlan", "masterySignal"]
};

export const OCR_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    success: { type: "boolean" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    title: { type: "string" },
    problem: { type: "string" },
    studentAnswer: { type: "string" },
    unitId: { type: "string" },
    skillId: { type: "string" },
    unitHint: { type: "string" },
    skillHint: { type: "string" },
    errorType: { type: "string", enum: ["概念不清", "审题错误", "计算错误", "建模错误", "步骤遗漏", "检查不足"] },
    analysis: { type: "string" },
    correction: { type: "string" },
    formulas: { type: "array", items: { type: "string" }, maxItems: 12 },
    warnings: { type: "array", items: { type: "string" }, maxItems: 6 }
  },
  required: ["success", "confidence", "title", "problem", "studentAnswer", "unitId", "skillId", "unitHint", "skillHint", "errorType", "analysis", "correction", "formulas", "warnings"]
};

function limitText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "https://qilin70007.github.io")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function requestOrigin(request) {
  return (request.headers.get("Origin") || "").replace(/\/$/, "");
}

function isAllowedOrigin(request, env) {
  const origin = requestOrigin(request);
  if (!origin) return true;
  return allowedOrigins(env).includes(origin);
}

function corsHeaders(request, env) {
  const origin = requestOrigin(request);
  const allowed = allowedOrigins(env);
  return {
    "Access-Control-Allow-Origin": origin && allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function jsonResponse(request, env, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function cleanBaseUrl(value, fallback) {
  return String(value || fallback || "").trim().replace(/\/+$/, "");
}

function tutorModel(definition, env) {
  return limitText(env[definition.tutorModelEnv] || definition.defaultTutorModel, 120);
}

function visionModel(definition, env) {
  const configured = limitText(env[definition.visionModelEnv], 120);
  if (configured) return configured;
  return definition.defaultVisionModel === "@tutor"
    ? tutorModel(definition, env)
    : definition.defaultVisionModel;
}

function providerState(definition, env) {
  const configured = Boolean(env[definition.apiKeyEnv]);
  const tutor = tutorModel(definition, env);
  const ocr = visionModel(definition, env);
  return {
    id: definition.id,
    label: definition.label,
    configured,
    capabilities: {
      tutor: configured && Boolean(tutor),
      ocr: configured && Boolean(ocr)
    },
    models: {
      tutor,
      ocr
    }
  };
}

export function listProviderStates(env = {}) {
  return Object.values(PROVIDER_DEFINITIONS).map((definition) => providerState(definition, env));
}

function requestedProvider(value) {
  const id = limitText(value, 30).toLowerCase();
  return PROVIDER_IDS.includes(id) ? id : "auto";
}

function preferredProviderId(env, capability) {
  const value = capability === "ocr"
    ? env.DEFAULT_OCR_PROVIDER
    : env.DEFAULT_TUTOR_PROVIDER || env.AI_PROVIDER;
  return requestedProvider(value);
}

export function resolveProvider(env, requested, capability) {
  const selected = requestedProvider(requested);
  const states = listProviderStates(env);
  if (selected !== "auto") {
    const state = states.find((item) => item.id === selected);
    if (!state?.configured) {
      throw new HttpError(503, `${state?.label || selected} 尚未在服务端配置 API Key`);
    }
    if (!state.capabilities[capability]) {
      const suffix = capability === "ocr" ? "支持图片的视觉模型" : "教学模型";
      throw new HttpError(503, `${state.label} 尚未配置${suffix}`);
    }
    return {
      ...state,
      definition: PROVIDER_DEFINITIONS[state.id],
      model: state.models[capability],
      capability
    };
  }

  const preferred = preferredProviderId(env, capability);
  const order = [preferred, "openai", "kimi", "glm", "hunyuan", "deepseek"]
    .filter((id, index, values) => id !== "auto" && values.indexOf(id) === index);
  const state = order
    .map((id) => states.find((item) => item.id === id))
    .find((item) => item?.capabilities[capability]);
  if (!state) {
    throw new HttpError(503, capability === "ocr"
      ? "服务端尚未配置可用于拍照识题的视觉模型"
      : "服务端尚未配置可用于 AI 教学的大模型");
  }
  return {
    ...state,
    definition: PROVIDER_DEFINITIONS[state.id],
    model: state.models[capability],
    capability
  };
}

function enforceRateLimit(request) {
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "local";
  const now = Date.now();
  const current = requestBuckets.get(ip);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    requestBuckets.set(ip, { startedAt: now, count: 1 });
  } else {
    current.count += 1;
    if (current.count > RATE_LIMIT) throw new HttpError(429, "请求太频繁，请一分钟后再试");
  }
  if (requestBuckets.size > 500) {
    for (const [key, bucket] of requestBuckets) {
      if (now - bucket.startedAt >= RATE_WINDOW_MS) requestBuckets.delete(key);
    }
  }
}

async function readJson(request) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) throw new HttpError(413, "图片或请求内容过大");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) throw new HttpError(413, "图片或请求内容过大");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "请求格式不正确");
  }
}

export function sanitizeTutorContext(raw = {}) {
  const mastery = Number(raw.mastery);
  return {
    grade: limitText(raw.grade, 20),
    term: limitText(raw.term, 30),
    unitId: limitText(raw.unitId, 50),
    unit: limitText(raw.unit, 100),
    skillId: limitText(raw.skillId, 80),
    topic: limitText(raw.topic, 120),
    mastery: Number.isFinite(mastery) ? Math.max(0, Math.min(100, mastery)) : 0,
    preferences: {
      pace: limitText(raw.preferences?.pace, 30),
      depth: limitText(raw.preferences?.depth, 30),
      difficulty: limitText(raw.preferences?.difficulty, 80),
      encouragement: limitText(raw.preferences?.encouragement, 30)
    },
    mistake: raw.mistake ? {
      title: limitText(raw.mistake.title, 160),
      problem: limitText(raw.mistake.problem, 3_000),
      studentAnswer: limitText(raw.mistake.studentAnswer, 800),
      analysis: limitText(raw.mistake.analysis, 1_000),
      correction: limitText(raw.mistake.correction, 1_500)
    } : null
  };
}

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-18).map((message) => ({
    role: message?.role === "assistant" ? "assistant" : "user",
    content: limitText(`${message?.text || ""}${message?.math ? `\n数学表达：${message.math}` : ""}`, 2_500)
  })).filter((message) => message.content);
}

function tutorInstructions(context, action) {
  return `你是面向上海初中六至九年级学生的一对一数学导师。请使用简体中文，并严格遵守：
1. 采用苏格拉底式教学，一次只推进一个清晰的学习动作；先诊断思路，再提示，再讲解，最后安排独立检验。
2. 除非学生连续求助或正在做总结，不要直接给出完整答案。提示要分层，鼓励学生说出理由。
3. 计算、结论和题目条件必须可核验；不确定时明确说明，不编造教材页码或校内要求。
4. 不展示隐藏推理过程或冗长思维链，只给适龄、简洁、可检查的解释和必要步骤。
5. 学生是未成年人：不要索要姓名、学校、班级、联系方式或其他个人信息，不讨论与数学学习无关的敏感话题。
6. 尊重学生节奏，不羞辱、不夸大掌握程度。一次答对不等于稳定掌握。
7. reply 控制在约180字内；math 只放必要的算式、公式或空字符串；suggestedActions 是学生可直接点击的短句。
本轮动作：${action}。
学习上下文（不含身份信息）：${JSON.stringify(context)}`;
}

function tutorInput(action, messages, input) {
  const history = sanitizeMessages(messages);
  const actionPrompt = action === "start"
    ? "现在开始课程。先用一句亲切的开场说明目标，再只问一道能诊断基础的题。"
    : action === "hint"
      ? "学生需要一层提示。不要直接公布完整答案，给一个可执行的小台阶并问一个问题。"
      : "继续本次教学。根据学生刚才的回答反馈并推进一个步骤。";
  return [...history, { role: "user", content: limitText(input, 3_000) || actionPrompt }];
}

function summaryInstructions(context) {
  return `你是上海初中数学学习评估助手。根据提供的真实对话证据生成结课报告，不得凭空声称学生已掌握。分数和独立完成率要保守；如果证据不足，masterySignal 选 none。不要输出个人信息，不展示隐藏推理过程。学习上下文：${JSON.stringify(context)}`;
}

function summaryInput(messages) {
  const history = sanitizeMessages(messages);
  return [...history, { role: "user", content: "请结束本节课，基于上面的实际作答生成简短、可执行的学习报告。" }];
}

function outputText(response) {
  if (typeof response?.output_text === "string") return response.output_text;
  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function chatOutputText(response) {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((item) => typeof item === "string" ? item : item?.text || "").join("");
  }
  return "";
}

function parseJsonOutput(text) {
  const clean = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(clean.slice(start, end + 1));
      } catch {
        // Fall through to the user-facing format error below.
      }
    }
  }
  throw new HttpError(502, "模型返回格式异常，请重试");
}

function defaultForField(field, schema) {
  if (field === "intent") return "feedback";
  if (field === "masterySignal") return "none";
  if (field === "errorType") return "检查不足";
  if (field === "success" || schema.type === "boolean") return false;
  if (schema.type === "array") return [];
  if (schema.type === "number" || schema.type === "integer") return schema.minimum || 0;
  return "";
}

function conformToSchema(value, schema, field = "") {
  if (schema.type === "object") {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    return Object.fromEntries(Object.entries(schema.properties || {}).map(([key, child]) => [
      key,
      conformToSchema(source[key] ?? defaultForField(key, child), child, key)
    ]));
  }
  if (schema.type === "array") {
    const source = Array.isArray(value) ? value : [];
    return source.slice(0, schema.maxItems || source.length).map((item) => conformToSchema(item, schema.items, field));
  }
  if (schema.type === "boolean") return value === true || value === "true";
  if (schema.type === "number" || schema.type === "integer") {
    const parsed = Number(value);
    const finite = Number.isFinite(parsed) ? parsed : (schema.minimum || 0);
    const bounded = Math.min(schema.maximum ?? finite, Math.max(schema.minimum ?? finite, finite));
    return schema.type === "integer" ? Math.round(bounded) : bounded;
  }
  const text = String(value ?? "").trim();
  if (schema.enum && !schema.enum.includes(text)) return defaultForField(field, schema);
  return text;
}

function normalizeModelOutput(raw, schema, schemaName) {
  const normalized = conformToSchema(raw, schema);
  if (schemaName === "math_tutor_turn" && !normalized.reply) {
    throw new HttpError(502, "模型没有返回可显示的教学内容，请重试");
  }
  if (schemaName === "math_tutor_summary" && !normalized.summary) {
    throw new HttpError(502, "模型没有生成有效的结课报告，请重试");
  }
  if (schemaName === "math_photo_ocr" && !normalized.problem) {
    normalized.success = false;
    normalized.warnings = [...normalized.warnings, "未能从图片中可靠提取题目，请裁剪题目区域后重试"].slice(0, 6);
  }
  return normalized;
}

function providerError(provider, response, payload) {
  const code = payload?.error?.code || payload?.code || "unknown";
  console.error(`${provider.id} response error`, response.status, code);
  if (response.status === 401) return new HttpError(400, `${provider.label} API Key 无效，请家长检查服务端密钥`);
  if (response.status === 403) return new HttpError(400, `${provider.label} 当前密钥没有调用该模型的权限`);
  if (response.status === 404) return new HttpError(400, `${provider.label} 模型名不存在或当前账户不可用`);
  if (response.status === 429) return new HttpError(429, `${provider.label} 调用额度或频率已达上限，请稍后再试`);
  if (response.status >= 500) return new HttpError(502, `${provider.label} 服务暂时异常，请稍后重试`);
  return new HttpError(400, `${provider.label} 请求参数不兼容，请检查模型配置`);
}

function endpointFor(provider, env, path) {
  const base = cleanBaseUrl(env[provider.definition.baseUrlEnv], provider.definition.defaultBaseUrl);
  return `${base}/${path.replace(/^\/+/, "")}`;
}

async function callResponsesProvider(env, provider, request) {
  const response = await fetch(endpointFor(provider, env, "responses"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env[provider.definition.apiKeyEnv]}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: provider.model,
      store: false,
      instructions: request.instructions,
      input: request.input,
      max_output_tokens: request.maxOutputTokens,
      text: {
        format: {
          type: "json_schema",
          name: request.schemaName,
          strict: true,
          schema: request.schema
        }
      }
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw providerError(provider, response, payload);
  const text = outputText(payload);
  if (!text) throw new HttpError(502, "模型返回为空，请重试");
  return parseJsonOutput(text);
}

function toChatContent(content) {
  if (!Array.isArray(content)) return content;
  return content.map((item) => {
    if (item?.type === "input_text") return { type: "text", text: limitText(item.text, 4_000) };
    if (item?.type === "input_image") return { type: "image_url", image_url: { url: item.image_url } };
    if (item?.type === "text" || item?.type === "image_url") return item;
    return { type: "text", text: limitText(item?.text, 4_000) };
  });
}

function toChatMessages(input) {
  if (!Array.isArray(input)) return [{ role: "user", content: limitText(input, 4_000) }];
  return input.map((message) => ({
    role: message?.role === "assistant" ? "assistant" : "user",
    content: toChatContent(message?.content)
  })).filter((message) => Array.isArray(message.content) ? message.content.length : message.content);
}

async function callChatProvider(env, provider, request) {
  const schemaPrompt = `${request.instructions}\n\n输出要求：只返回一个 JSON 对象，不要使用 Markdown 代码块或添加解释；必须包含 JSON Schema 中的全部字段。JSON Schema：${JSON.stringify(request.schema)}`;
  const response = await fetch(endpointFor(provider, env, "chat/completions"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env[provider.definition.apiKeyEnv]}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: "system", content: schemaPrompt }, ...toChatMessages(request.input)],
      max_tokens: request.maxOutputTokens,
      ...(provider.definition.jsonMode ? { response_format: { type: "json_object" } } : {}),
      stream: false
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw providerError(provider, response, payload);
  const text = chatOutputText(payload);
  if (!text) throw new HttpError(502, `${provider.label} 返回为空，请重试`);
  return parseJsonOutput(text);
}

async function callModel(env, provider, request) {
  const raw = provider.definition.protocol === "responses"
    ? await callResponsesProvider(env, provider, request)
    : await callChatProvider(env, provider, request);
  const result = normalizeModelOutput(raw, request.schema, request.schemaName);
  return {
    ...result,
    meta: {
      provider: provider.id,
      providerLabel: provider.label,
      model: provider.model
    }
  };
}

async function handleTutor(request, env) {
  const body = await readJson(request);
  const action = ["start", "message", "hint", "summary"].includes(body.action) ? body.action : "message";
  const context = sanitizeTutorContext(body.context);
  if (!context.topic) throw new HttpError(400, "缺少要学习的知识点");
  const provider = resolveProvider(env, body.provider, "tutor");

  if (action === "summary") {
    return callModel(env, provider, {
      instructions: summaryInstructions(context),
      input: summaryInput(body.messages),
      maxOutputTokens: 1_200,
      schemaName: "math_tutor_summary",
      schema: TUTOR_SUMMARY_SCHEMA
    });
  }

  return callModel(env, provider, {
    instructions: tutorInstructions(context, action),
    input: tutorInput(action, body.messages, body.input),
    maxOutputTokens: 900,
    schemaName: "math_tutor_turn",
    schema: TUTOR_RESPONSE_SCHEMA
  });
}

export function sanitizeCatalog(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 60).map((unit) => ({
    id: limitText(unit?.id, 50),
    title: limitText(unit?.title, 100),
    term: limitText(unit?.term, 30),
    skills: Array.isArray(unit?.skills) ? unit.skills.slice(0, 30).map((skill) => ({
      id: limitText(skill?.id, 80),
      title: limitText(skill?.title, 120)
    })) : []
  }));
}

async function handleOcr(request, env) {
  const body = await readJson(request);
  const imageDataUrl = String(body.imageDataUrl || "");
  if (!/^data:image\/(jpeg|png|webp|gif);base64,/i.test(imageDataUrl)) {
    throw new HttpError(400, "请上传 JPG、PNG、WebP 或 GIF 图片");
  }
  if (imageDataUrl.length > MAX_IMAGE_DATA_URL) throw new HttpError(413, "压缩后的图片仍然过大，请裁剪题目区域");
  const catalog = sanitizeCatalog(body.catalog);
  const provider = resolveProvider(env, body.provider, "ocr");
  const instructions = `你是数学题目图片识别与整理助手。图片来自未成年学生的作业或试卷。
严格要求：
1. 忽略且绝不输出姓名、学校、班级、学号、考号、二维码等个人标识，只处理数学题和作答。
2. 忠实转写看得清的题干、选项、图表文字、公式和学生答案；看不清就写入 warnings，不得猜测或补造。
3. problem 使用清晰纯文本，分数可写 a/b，根式和公式可使用简洁 LaTeX；保留题号和小问。
4. title 用一句话概括这道错题；analysis 区分“卷面可见事实”和合理推测，correction 给简短正确方法。
5. 从给定目录中选择最匹配的 unitId 与 skillId；无法判断时返回空字符串，并在 unitHint/skillHint 写自然语言提示。
6. errorType 必须从给定枚举中选最可能的一项；没有明显错误时选“检查不足”并在 warnings 说明。
目录：${JSON.stringify(catalog)}`;
  return callModel(env, provider, {
    instructions,
    input: [{
      role: "user",
      content: [
        { type: "input_text", text: "请识别这张数学题照片，提取题目与学生作答，并返回可供家长核对的结构化结果。" },
        { type: "input_image", image_url: imageDataUrl, detail: "original" }
      ]
    }],
    maxOutputTokens: 1_800,
    schemaName: "math_photo_ocr",
    schema: OCR_RESPONSE_SCHEMA
  });
}

export default {
  async fetch(request, env) {
    if (!isAllowedOrigin(request, env)) return jsonResponse(request, env, { error: "当前网页来源不在允许列表中" }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      const providers = listProviderStates(env);
      const configured = providers.some((provider) => provider.configured);
      const defaultTutor = (() => {
        try { return resolveProvider(env, "auto", "tutor"); } catch { return null; }
      })();
      const defaultOcr = (() => {
        try { return resolveProvider(env, "auto", "ocr"); } catch { return null; }
      })();
      return jsonResponse(request, env, {
        ok: true,
        configured,
        service: "math-ai-tutor-api",
        providers,
        defaults: {
          tutor: defaultTutor ? { provider: defaultTutor.id, label: defaultTutor.label, model: defaultTutor.model } : null,
          ocr: defaultOcr ? { provider: defaultOcr.id, label: defaultOcr.label, model: defaultOcr.model } : null
        },
        model: defaultTutor?.model || ""
      });
    }

    if (request.method !== "POST") return jsonResponse(request, env, { error: "接口不存在" }, 404);
    try {
      enforceRateLimit(request);
      const result = url.pathname === "/api/tutor"
        ? await handleTutor(request, env)
        : url.pathname === "/api/ocr"
          ? await handleOcr(request, env)
          : null;
      if (!result) return jsonResponse(request, env, { error: "接口不存在" }, 404);
      return jsonResponse(request, env, result);
    } catch (error) {
      console.error("Request failed", error?.message || error);
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof HttpError ? error.message : "服务暂时不可用，请稍后重试";
      return jsonResponse(request, env, { error: message }, status);
    }
  }
};
