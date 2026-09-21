// Repair JSON transport mistakes only; never invent a missing answer or finish
// a truncated JSON object. A failed repair is handled by one bounded model retry.
export class ModelOutputError extends Error {
  constructor(code = "MODEL_FORMAT") {
    super(code === "MODEL_TRUNCATED"
      ? "模型回复被截断，自动重试后仍未完成。你的作答已保留，请重试本轮。"
      : code === "MODEL_EMPTY"
        ? "模型未返回教学内容，自动重试后仍未完成。你的作答已保留，请重试本轮。"
        : "模型回复未能完整解析，已自动重试一次。你的作答已保留，请重试本轮。");
    this.code = code;
    this.status = 502;
  }
}

// These TeX commands begin with a valid JSON escape (\b, \f, \n, \r, \t).
// Handle them before JSON.parse so that \frac does not silently become a form feed.
const AMBIGUOUS_TEX = /^(?:frac|forall|fbox|flat|bar|barwedge|begin|beta|binom|boldsymbol|bold|boxed|bot|bullet|bf|bmod|big|bigg|bigl|bigr|biggl|biggr|backslash|nabla|neq|ne|neg|not|notin|nexists|nmid|nparallel|nearrow|nleq|ngeq|nu|newcommand|right|rightarrow|rightleftharpoons|rangle|rceil|rfloor|rho|rm|rule|text|textbf|textit|textrm|textsf|texttt|textnormal|textcolor|tfrac|tbinom|times|theta|tan|tanh|to|top|tilde|tag|triangle|triangleleft|triangleright)(?![A-Za-z])/;

function repairStringEscapes(source) {
  let result = "";
  let inString = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"') {
      inString = !inString;
      result += char;
    } else if (inString && char === "\\") {
      const next = source[i + 1];
      if (next === undefined) throw new ModelOutputError("MODEL_TRUNCATED");
      const latex = AMBIGUOUS_TEX.test(source.slice(i + 1));
      const validEscape = /["\\/bfnrt]/.test(next)
        || (next === "u" && /^[0-9a-f]{4}/i.test(source.slice(i + 2)));
      if (latex || !validEscape) {
        result += "\\\\";
      } else {
        result += char + next;
        i += 1;
      }
    } else if (inString && char.charCodeAt(0) < 32) {
      result += JSON.stringify(char).slice(1, -1);
    } else {
      result += char;
    }
  }
  return result;
}

function removeTrailingCommas(source) {
  let result = "";
  let inString = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inString && char === "\\") {
      result += char + source[++i];
      continue;
    }
    if (char === '"') inString = !inString;
    if (!inString && char === "," && /^\s*[}\]]/.test(source.slice(i + 1))) continue;
    result += char;
  }
  return result;
}

function extractObject(source) {
  const start = source.indexOf("{");
  if (start < 0) throw new ModelOutputError();
  let depth = 0;
  let inString = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (inString && char === "\\") { i += 1; continue; }
    if (char === '"') inString = !inString;
    if (inString) continue;
    if (char === "{") depth += 1;
    if (char === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new ModelOutputError("MODEL_TRUNCATED");
}

export function parseModelJson(text) {
  const source = String(text || "").trim();
  if (!source) throw new ModelOutputError("MODEL_EMPTY");
  if (source.length > 200_000) throw new ModelOutputError();
  // Do not extract a misleading nested object from an array response.
  const clean = source.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  if (clean.startsWith("[")) throw new ModelOutputError();
  const candidate = removeTrailingCommas(repairStringEscapes(extractObject(clean)));
  try {
    const value = JSON.parse(candidate);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw new ModelOutputError();
  }
}
