import { CURRICULUM, DEFAULT_MISTAKES, STATUS_META } from "./data.js";

export const APP_STATE_VERSION = 2;

export function isoDate(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function offsetDate(days, from = new Date()) {
  const result = new Date(from);
  result.setDate(result.getDate() + days);
  return isoDate(result);
}

export function formatShortDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatWeekday(value) {
  const date = new Date(`${value}T12:00:00`);
  return "日一二三四五六"[date.getDay()];
}

export function statusForMastery(mastery, reviewDue = false) {
  if (reviewDue && mastery > 0) return "review";
  if (mastery >= 85) return "mastered";
  if (mastery >= 65) return "basic";
  if (mastery >= 30) return "learning";
  if (mastery > 0) return "introduced";
  return "unseen";
}

export function statusMetaFor(skill) {
  return STATUS_META[statusForMastery(skill.mastery, skill.reviewDue)];
}

export function calculateUnitProgress(unit, skillState = {}) {
  if (!unit.skills.length) return 0;
  const total = unit.skills.reduce((sum, skill) => {
    return sum + (skillState[skill.id]?.mastery ?? skill.mastery ?? 0);
  }, 0);
  return Math.round(total / unit.skills.length);
}

export function normalizeNumberList(raw) {
  const matches = String(raw).match(/-?\d+(?:\.\d+)?/g) || [];
  return [...new Set(matches.map(Number))].sort((a, b) => a - b);
}

export function validateAnswer(question, rawAnswer) {
  const answer = String(rawAnswer || "").trim();
  if (!answer) return false;
  const rule = question.validator;
  const numbers = normalizeNumberList(answer);

  if (rule.type === "number") {
    return numbers.length === 1 && Math.abs(numbers[0] - Number(rule.expected)) < 1e-9;
  }

  if (rule.type === "numberListExact") {
    const expected = [...rule.expected].map(Number).sort((a, b) => a - b);
    return numbers.length === expected.length && numbers.every((value, index) => value === expected[index]);
  }

  if (rule.type === "containsNumbers") {
    return rule.expected.every((value) => numbers.includes(Number(value)));
  }

  if (rule.type === "includes") {
    return rule.expected.every((fragment) => answer.toLowerCase().includes(String(fragment).toLowerCase()));
  }

  return false;
}

export function masteryDelta({ correct, hints = 0, attempts = 1 }) {
  if (!correct) return -2;
  const independencePenalty = Math.min(5, hints * 2 + Math.max(0, attempts - 1));
  return Math.max(2, 8 - independencePenalty);
}

export function applyEvidence(skill, evidence) {
  const current = { ...skill };
  const delta = masteryDelta(evidence);
  current.mastery = Math.max(0, Math.min(100, Math.round((current.mastery || 0) + delta)));
  current.evidence = (current.evidence || 0) + 1;
  current.lastAssessed = evidence.date || isoDate();
  current.reviewDue = false;
  current.nextReview = offsetDate(current.mastery >= 85 ? 7 : 3);
  return current;
}

export function getAllSkills(state) {
  return CURRICULUM.flatMap((unit) => unit.skills.map((skill) => ({
    ...skill,
    ...state.skills[skill.id],
    unitId: unit.id,
    unitTitle: unit.title
  })));
}

export function getSkill(state, skillId) {
  return getAllSkills(state).find((skill) => skill.id === skillId);
}

export function getDueSkills(state, today = isoDate()) {
  return getAllSkills(state).filter((skill) => {
    return skill.reviewDue || (skill.nextReview && skill.nextReview <= today);
  });
}

export function getCurrentFocus(state) {
  return getAllSkills(state).find((skill) => state.skills[skill.id]?.currentFocus)
    || getAllSkills(state).find((skill) => skill.currentFocus)
    || getAllSkills(state).find((skill) => skill.mastery > 0 && skill.mastery < 70);
}

export function buildTodayPlan(state) {
  const focus = getCurrentFocus(state);
  const due = getDueSkills(state);
  return [
    {
      minutes: 3,
      title: due[0] ? `到期复习：${due[0].title}` : "旧知识热身",
      subtitle: due[0] ? "用一道题检查是否真正记住" : "快速唤醒本周学过的方法",
      tag: "复习"
    },
    {
      minutes: 12,
      title: focus ? `当前重点：${focus.title}` : "今日重点训练",
      subtitle: "理解原理、练习方法、及时纠正错误",
      tag: "重点"
    },
    {
      minutes: 5,
      title: "独立出口题",
      subtitle: "不给提示，检查能否独立完成和解释",
      tag: "检测"
    }
  ];
}

export function computeSummary(state) {
  const skills = getAllSkills(state);
  const started = skills.filter((skill) => skill.mastery > 0);
  const mastered = skills.filter((skill) => statusForMastery(skill.mastery, skill.reviewDue) === "mastered");
  const due = getDueSkills(state);
  const independentRate = state.sessions.length
    ? Math.round(state.sessions.reduce((sum, session) => sum + (session.independentRate || 0), 0) / state.sessions.length)
    : 0;
  return {
    totalSkills: skills.length,
    started: started.length,
    mastered: mastered.length,
    due: due.length,
    coverage: skills.length ? Math.round((started.length / skills.length) * 100) : 0,
    stableRate: started.length ? Math.round((mastered.length / started.length) * 100) : 0,
    independentRate
  };
}

export function lastSevenDays(state, today = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = offsetDate(index - 6, today);
    const minutes = state.sessions
      .filter((session) => session.date === date)
      .reduce((sum, session) => sum + (session.duration || 0), 0);
    return { date, label: formatWeekday(date), minutes };
  });
}

export function createDefaultState(now = new Date()) {
  const skills = {};
  for (const unit of CURRICULUM) {
    for (const skill of unit.skills) {
      skills[skill.id] = {
        mastery: skill.mastery || 0,
        evidence: skill.evidence || 0,
        currentFocus: Boolean(skill.currentFocus),
        nextUp: Boolean(skill.nextUp),
        reviewDue: Boolean(skill.reviewDue),
        parentLocked: false,
        lastAssessed: skill.mastery ? offsetDate(-Math.max(1, 8 - (skill.evidence || 1)), now) : null,
        nextReview: skill.reviewDue ? offsetDate(-1, now) : null
      };
    }
  }

  const sessions = [
    {
      id: "s-demo-1",
      date: offsetDate(-6, now),
      title: "因数与倍数",
      duration: 18,
      score: 80,
      independentRate: 75,
      summary: "因数能够成对寻找，但偶尔遗漏较大的因数。",
      strengths: ["能解释因数与倍数的关系", "计算认真"],
      needsWork: ["列举因数时需要形成固定顺序"],
      nextPlan: "分解素因数"
    },
    {
      id: "s-demo-2",
      date: offsetDate(-4, now),
      title: "素数与合数",
      duration: 20,
      score: 88,
      independentRate: 82,
      summary: "能够判断常见素数，并用因数个数说明理由。",
      strengths: ["判断依据表达清楚", "能主动检查1不是素数"],
      needsWork: ["较大数字可以用试除法提高效率"],
      nextPlan: "分解素因数"
    },
    {
      id: "s-demo-3",
      date: offsetDate(-2, now),
      title: "分解素因数",
      duration: 22,
      score: 76,
      independentRate: 68,
      summary: "短除法基本会用，重复素因数有时漏写。",
      strengths: ["方法选择正确", "接受提示后能自我修正"],
      needsWork: ["写完后用乘法还原检查"],
      nextPlan: "公因数与最大公因数"
    }
  ];

  const mistakes = DEFAULT_MISTAKES.map((mistake, index) => ({
    ...mistake,
    createdAt: offsetDate(-4 - index * 2, now),
    nextReview: offsetDate(index === 0 ? 0 : 2, now)
  }));

  return {
    version: APP_STATE_VERSION,
    profile: {
      name: "学员A",
      surname: "A",
      grade: "六年级",
      term: "六年级上",
      school: "学校A",
      textbook: "上海初中数学新版（含小初衔接）",
      dailyMinutes: 20,
      pin: "2609"
    },
    preferences: {
      pace: "稳步",
      depth: "理解优先",
      difficulty: "校内扎实＋适度思维提升",
      encouragement: "自然简洁",
      lockFocus: true
    },
    skills,
    mistakes,
    sessions,
    activeLesson: null,
    streak: 4,
    lastOpened: isoDate(now),
    createdAt: new Date(now).toISOString()
  };
}

export function hydrateState(raw, now = new Date()) {
  const defaults = createDefaultState(now);
  if (!raw || typeof raw !== "object") return defaults;
  return {
    ...defaults,
    ...raw,
    profile: { ...defaults.profile, ...(raw.profile || {}) },
    preferences: { ...defaults.preferences, ...(raw.preferences || {}) },
    skills: { ...defaults.skills, ...(raw.skills || {}) },
    mistakes: Array.isArray(raw.mistakes) ? raw.mistakes : defaults.mistakes,
    sessions: Array.isArray(raw.sessions) ? raw.sessions : defaults.sessions
  };
}
