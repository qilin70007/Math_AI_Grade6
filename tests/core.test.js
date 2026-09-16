import test from "node:test";
import assert from "node:assert/strict";
import { CURRICULUM, LESSONS } from "../js/data.js";
import {
  applyEvidence,
  buildTodayPlan,
  calculateUnitProgress,
  computeSummary,
  createDefaultState,
  hydrateState,
  statusForMastery,
  validateAnswer
} from "../js/core.js";

test("掌握度状态边界正确", () => {
  assert.equal(statusForMastery(0), "unseen");
  assert.equal(statusForMastery(20), "introduced");
  assert.equal(statusForMastery(45), "learning");
  assert.equal(statusForMastery(70), "basic");
  assert.equal(statusForMastery(90), "mastered");
  assert.equal(statusForMastery(90, true), "review");
});

test("列举因数题不受输入顺序和中文标点影响", () => {
  const question = LESSONS.gcd.questions[0];
  assert.equal(validateAnswer(question, "1、2、3、4、6、8、12、24"), true);
  assert.equal(validateAnswer(question, "24, 12, 8, 6, 4, 3, 2, 1"), true);
  assert.equal(validateAnswer(question, "1、2、3、4、6、12、24"), false);
});

test("应用题必须包含袋数和每袋数量", () => {
  const question = LESSONS.gcd.questions[3];
  assert.equal(validateAnswer(question, "最多6袋，每袋红笔3支、蓝笔4支"), true);
  assert.equal(validateAnswer(question, "最多6袋"), false);
});

test("学习证据会更新掌握度且保持在0到100", () => {
  const updated = applyEvidence({ mastery: 58, evidence: 2, reviewDue: true }, {
    correct: true,
    hints: 1,
    attempts: 2,
    date: "2026-09-16"
  });
  assert.equal(updated.mastery, 63);
  assert.equal(updated.evidence, 3);
  assert.equal(updated.reviewDue, false);
  assert.equal(updated.lastAssessed, "2026-09-16");
});

test("默认状态可生成今日计划和汇总", () => {
  const state = createDefaultState(new Date("2026-09-16T12:00:00Z"));
  const plan = buildTodayPlan(state);
  const summary = computeSummary(state);
  assert.equal(state.profile.name, "学员A");
  assert.equal(state.profile.surname, "A");
  assert.equal(state.profile.school, "学校A");
  assert.equal(plan.length, 3);
  assert.equal(plan.reduce((sum, item) => sum + item.minutes, 0), 20);
  assert.ok(summary.totalSkills > 20);
  assert.ok(summary.mastered > 0);
});

test("单元进度优先读取用户学习状态", () => {
  const unit = CURRICULUM[0];
  const overrides = Object.fromEntries(unit.skills.map((skill) => [skill.id, { mastery: 100 }]));
  assert.equal(calculateUnitProgress(unit, overrides), 100);
});

test("旧备份缺字段时可安全补齐", () => {
  const hydrated = hydrateState({ profile: { name: "测试同学" }, skills: {}, sessions: [], mistakes: [] });
  assert.equal(hydrated.profile.name, "测试同学");
  assert.equal(hydrated.profile.grade, "六年级");
  assert.ok(hydrated.skills.gcd);
});
