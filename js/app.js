import { CURRICULUM, ERROR_TYPES, LESSONS, NAV_ITEMS, STATUS_META, TERM_OPTIONS } from "./data.js";
import {
  applyEvidence,
  buildTodayPlan,
  calculateUnitProgress,
  computeSummary,
  formatShortDate,
  getAllSkills,
  getCurrentFocus,
  getDueSkills,
  getSkill,
  isoDate,
  lastSevenDays,
  offsetDate,
  statusForMastery,
  validateAnswer
} from "./core.js";
import {
  createBackup,
  deleteMistakeImage,
  getMistakeImage,
  loadState,
  resetState,
  restoreBackup,
  saveMistakeImage,
  saveState
} from "./storage.js";

let state = loadState();
let currentTerm = TERM_OPTIONS.find((term) => term.label === state.profile.term)?.id || "衔接";
let mistakeFilter = "全部";
let installPrompt = null;
const expandedUnits = new Set(["u1"]);

const app = document.querySelector("#app");
const modalRoot = document.querySelector("#modal-root");
const toastRegion = document.querySelector("#toast-region");
const installButton = document.querySelector("#install-button");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function route() {
  const value = location.hash.replace(/^#/, "").split("?")[0];
  return NAV_ITEMS.some((item) => item.id === value) ? value : "today";
}

function persist() {
  saveState(state);
}

function toast(message) {
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  toastRegion.append(element);
  setTimeout(() => element.remove(), 2800);
}

function openModal(content, labelledBy = "modal-title") {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="close-modal" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="${labelledBy}">
        ${content}
      </section>
    </div>`;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => modalRoot.querySelector("input, button, select, textarea")?.focus());
}

function closeModal() {
  modalRoot.innerHTML = "";
  document.body.style.overflow = "";
}

function modalFrame(title, body, footer = "") {
  return `
    <div class="modal-head">
      <h2 id="modal-title">${escapeHtml(title)}</h2>
      <button class="close-button" type="button" data-action="close-modal" aria-label="关闭">×</button>
    </div>
    <div class="modal-body">${body}${footer}</div>`;
}

function renderNavigation() {
  const active = route();
  const html = NAV_ITEMS.map((item) => `
    <a class="nav-item ${item.id === active ? "active" : ""}" href="#${item.id}" ${item.id === active ? 'aria-current="page"' : ""}>
      <span class="nav-icon" aria-hidden="true">${item.icon}</span>
      <span>${item.label}</span>
    </a>`).join("");
  document.querySelector("#desktop-nav").innerHTML = html;
  document.querySelector("#mobile-nav").innerHTML = html;
}

function updateHeader() {
  const hour = new Date().getHours();
  const greeting = hour < 6 ? "夜深了" : hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 19 ? "下午好" : "晚上好";
  document.querySelector("#greeting").textContent = `${greeting}，${state.profile.name}`;
  const today = new Date();
  document.querySelector("#date-label").textContent = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 · 星期${"日一二三四五六"[today.getDay()]}`;
  document.querySelector(".avatar").textContent = state.profile.surname || state.profile.name.slice(0, 1);
  document.querySelector(".profile-name").textContent = state.profile.grade;
}

function pageHead(eyebrow, title, description, actions = "") {
  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
      </div>
      ${actions ? `<div class="button-row">${actions}</div>` : ""}
    </header>`;
}

function statusPill(skill) {
  const status = statusForMastery(skill.mastery, skill.reviewDue);
  const meta = STATUS_META[status];
  return `<span class="status-pill ${meta.className}">${meta.label}</span>`;
}

function renderToday() {
  const summary = computeSummary(state);
  const focus = getCurrentFocus(state);
  const focusUnit = CURRICULUM.find((unit) => unit.skills.some((skill) => skill.id === focus?.id)) || CURRICULUM[0];
  const focusUnitProgress = calculateUnitProgress(focusUnit, state.skills);
  const due = getDueSkills(state);
  const plan = buildTodayPlan(state);
  const recent = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date))[0];
  const days = lastSevenDays(state);

  return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">今日学习 · ${state.profile.dailyMinutes}分钟</p>
        <h1>把“会做”变成<br />“真的会”。</h1>
        <p>今天继续攻克${escapeHtml(focus?.title || "本周重点")}。先复习，再理解，最后独立完成一道出口题。</p>
        <div class="button-row">
          <button class="button primary" type="button" data-action="go-classroom">开始今天的课 <span aria-hidden="true">→</span></button>
          <a class="button ghost" href="#map">看看知识地图</a>
        </div>
      </div>
      <div class="hero-orbit" aria-label="${escapeHtml(focusUnit.title)}单元进度${focusUnitProgress}%">
        <div class="focus-ring" style="--progress:${focusUnitProgress}%">
          <div><strong>${focusUnitProgress}%</strong><span>${escapeHtml(focusUnit.title)}</span></div>
        </div>
      </div>
    </section>

    <section class="section-block grid four" aria-label="学习概览">
      <article class="card metric-card" style="--metric-soft:var(--mint)">
        <span class="metric-icon">✓</span><strong>${summary.mastered}</strong><span>稳定掌握知识点</span>
      </article>
      <article class="card metric-card" style="--metric-soft:var(--orange-soft)">
        <span class="metric-icon">◎</span><strong>${focus?.mastery || 0}%</strong><span>当前重点掌握度</span>
      </article>
      <article class="card metric-card" style="--metric-soft:var(--purple-soft)">
        <span class="metric-icon">↻</span><strong>${due.length}</strong><span>今天到期复习</span>
      </article>
      <article class="card metric-card" style="--metric-soft:var(--blue-soft)">
        <span class="metric-icon">↗</span><strong>${summary.independentRate}%</strong><span>近期独立完成率</span>
      </article>
    </section>

    <section class="section-block">
      <div class="section-head"><div><h2>今天怎么学</h2><p>总计${plan.reduce((sum, item) => sum + item.minutes, 0)}分钟，短而完整</p></div><span class="tag">自动规划</span></div>
      <div class="grid two">
        <article class="card pad">
          <ol class="plan-list">
            ${plan.map((item) => `
              <li class="plan-item">
                <span class="plan-time">${item.minutes}分</span>
                <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subtitle)}</small></span>
                <span class="tag ${item.tag === "重点" ? "warm" : item.tag === "检测" ? "purple" : ""}">${item.tag}</span>
              </li>`).join("")}
          </ol>
        </article>
        <div class="grid two">
          <article class="card focus-card">
            <div>
              <span class="tag warm">CURRENT FOCUS</span>
              <h3>${escapeHtml(focus?.title || "等待设置")}</h3>
              <p>掌握证据 ${focus?.evidence || 0} 条。今天重点检查是否能在实际分组问题中选对方法。</p>
            </div>
            <div class="mini-donut" style="--progress:${focus?.mastery || 0}%"><strong>${focus?.mastery || 0}%</strong></div>
          </article>
          <article class="card streak-card">
            <div><span>本周学习</span><div><span class="big-number">${days.filter((day) => day.minutes > 0).length}</span> 天</div></div>
            <div class="week-dots">${days.map((day) => `<span class="day-dot ${day.minutes ? "done" : ""}"><i>${day.minutes ? "✓" : ""}</i>${day.label}</span>`).join("")}</div>
          </article>
        </div>
      </div>
    </section>

    <section class="section-block">
      <div class="section-head"><div><h2>最近一次学习</h2><p>每次进步都要留下可追溯的证据</p></div><a class="button ghost small" href="#parent">查看家长报告 →</a></div>
      <article class="card pad">
        ${recent ? `
          <div class="report-item">
            <span class="report-date">${formatShortDate(recent.date).replace("月", "/").replace("日", "")}</span>
            <span class="report-copy"><strong>${escapeHtml(recent.title)}</strong><small>${escapeHtml(recent.summary)}</small></span>
            <button class="button secondary small" type="button" data-action="open-report" data-id="${recent.id}">查看报告</button>
          </div>` : `<div class="empty-state"><span class="empty-icon">✦</span>完成第一节课后，这里会出现学习报告。</div>`}
      </article>
    </section>`;
}

function lessonMessageHtml(message) {
  return `
    <div class="message ${message.role === "student" ? "student" : "assistant"}">
      <span class="message-avatar">${message.role === "student" ? escapeHtml(state.profile.surname || "我") : "芽"}</span>
      <div class="message-bubble">
        <p>${escapeHtml(message.text)}</p>
        ${message.math ? `<span class="math-block">${escapeHtml(message.math)}</span>` : ""}
      </div>
    </div>`;
}

function newLessonRuntime(lesson) {
  const first = lesson.questions[0];
  return {
    lessonId: lesson.id,
    index: 0,
    startedAt: new Date().toISOString(),
    messages: [
      { role: "assistant", text: `今天我们学习“${lesson.title}”。我会一次只问一道题；答错没关系，但要把思路说出来。` },
      { role: "assistant", text: first.prompt, math: first.math }
    ],
    attempts: {},
    hints: {},
    records: [],
    completed: false,
    sessionId: null
  };
}

function renderClassroomLanding(lesson) {
  const skill = getSkill(state, lesson.skillId);
  return `
    ${pageHead("AI CLASSROOM", "今天的AI课堂", "20分钟，完成一轮从理解到独立检测的学习。")}
    <section class="hero" style="min-height:330px">
      <div class="hero-copy">
        <p class="eyebrow">当前重点 · 掌握度 ${skill?.mastery || 0}%</p>
        <h1>${escapeHtml(lesson.title)}</h1>
        <p>${escapeHtml(lesson.subtitle)}。系统会记录提示次数、独立完成情况和典型错误，作为掌握度证据。</p>
        <div class="button-row">
          <button class="button primary" type="button" data-action="start-lesson">开始学习 · 约${lesson.duration}分钟</button>
        </div>
      </div>
      <div class="hero-orbit">
        <div class="focus-ring" style="--progress:${skill?.mastery || 0}%"><div><strong>${lesson.questions.length}</strong><span>个学习关卡</span></div></div>
      </div>
    </section>
    <section class="section-block grid two">
      <article class="card pad">
        <div class="section-head"><h2>本节目标</h2><span class="tag">理解优先</span></div>
        <div class="goal-list">${lesson.goals.map((goal, index) => `<div class="goal-row"><span>${index + 1}</span><div>${escapeHtml(goal)}</div></div>`).join("")}</div>
      </article>
      <article class="card pad">
        <div class="section-head"><h2>课堂约定</h2></div>
        <div class="goal-list">
          <div class="goal-row"><span>说</span><div>先在心里或口头说思路，再输入答案。</div></div>
          <div class="goal-row"><span>想</span><div>不会时先点“给一点提示”，系统不会直接公布完整答案。</div></div>
          <div class="goal-row"><span>查</span><div>提交前检查条件、计算和问题到底在问什么。</div></div>
        </div>
      </article>
    </section>`;
}

function renderLessonComplete(runtime, lesson) {
  const session = state.sessions.find((item) => item.id === runtime.sessionId);
  return `
    ${pageHead("LESSON COMPLETE", "今天的课完成了", "掌握度只依据真实作答证据更新，不会因为一次答对就直接标记为稳定掌握。")}
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">${lesson.title} · 已完成</p>
        <h1>${session?.score || 0}分，方法越来越稳了。</h1>
        <p>${escapeHtml(session?.summary || "本节学习记录已经保存。")}</p>
        <div class="button-row">
          <button class="button primary" type="button" data-action="open-report" data-id="${session?.id}">查看本节报告</button>
          <button class="button ghost" type="button" data-action="reset-lesson">再练一遍</button>
        </div>
      </div>
      <div class="hero-orbit">
        <div class="focus-ring" style="--progress:${session?.independentRate || 0}%"><div><strong>${session?.independentRate || 0}%</strong><span>独立完成率</span></div></div>
      </div>
    </section>
    <section class="section-block grid three">
      <article class="card metric-card"><span class="metric-icon">✓</span><strong>${runtime.records.filter((item) => item.correct).length}/${lesson.questions.length}</strong><span>完成关卡</span></article>
      <article class="card metric-card" style="--metric-soft:var(--orange-soft)"><span class="metric-icon">?</span><strong>${Object.values(runtime.hints).reduce((sum, value) => sum + value, 0)}</strong><span>使用提示</span></article>
      <article class="card metric-card" style="--metric-soft:var(--purple-soft)"><span class="metric-icon">↻</span><strong>3天后</strong><span>安排延迟复测</span></article>
    </section>`;
}

function renderActiveLesson(runtime, lesson) {
  const question = lesson.questions[runtime.index];
  return `
    <header class="page-head">
      <div><p class="eyebrow">AI CLASSROOM</p><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(question?.stage || "课堂总结")} · 第${Math.min(runtime.index + 1, lesson.questions.length)}关 / 共${lesson.questions.length}关</p></div>
      <button class="button secondary small" type="button" data-action="pause-lesson">暂停并返回</button>
    </header>
    <div class="lesson-layout">
      <section class="card lesson-card">
        <div class="lesson-top">
          <div class="lesson-title-row"><h2>${escapeHtml(question?.stage || "完成")}</h2><span class="tag warm">${Math.round((runtime.index / lesson.questions.length) * 100)}%</span></div>
          <div class="lesson-stage-track" aria-label="课程进度">${lesson.questions.map((_, index) => `<span class="${index < runtime.index ? "done" : index === runtime.index ? "active" : ""}"></span>`).join("")}</div>
        </div>
        <div class="chat-log" id="chat-log">${runtime.messages.map(lessonMessageHtml).join("")}</div>
        <form class="composer" id="answer-form">
          <div class="composer-main">
            <label class="sr-only" for="lesson-answer">输入答案和思路</label>
            <input id="lesson-answer" name="answer" autocomplete="off" placeholder="写下答案，最好带一句理由……" required />
            <button class="button primary" type="submit">提交</button>
          </div>
          <div class="composer-tools">
            <div class="button-row">
              <button class="button ghost small" type="button" data-action="lesson-hint">💡 给一点提示</button>
              <button class="button ghost small" type="button" data-action="lesson-dont-know">我暂时不会</button>
            </div>
            <small>答错不会扣分，系统更关心你怎么想</small>
          </div>
        </form>
      </section>
      <aside class="lesson-side">
        <article class="card pad">
          <div class="section-head"><h3>本节目标</h3></div>
          <div class="goal-list">${lesson.goals.map((goal, index) => `<div class="goal-row"><span>${index + 1}</span><div>${escapeHtml(goal)}</div></div>`).join("")}</div>
        </article>
        <article class="card tip-card"><strong>家长已设定：理解优先</strong><p>系统会追问判断依据。即使答案正确，如果像猜的，也会补一道变式题。</p></article>
      </aside>
    </div>`;
}

function renderClassroom() {
  const lesson = LESSONS.gcd;
  if (!state.activeLesson) return renderClassroomLanding(lesson);
  if (state.activeLesson.completed) return renderLessonComplete(state.activeLesson, lesson);
  return renderActiveLesson(state.activeLesson, lesson);
}

function renderMistakes() {
  const filters = ["全部", "待复习", "练习中", "已掌握"];
  const list = state.mistakes.filter((mistake) => {
    if (mistakeFilter === "全部") return true;
    if (mistakeFilter === "待复习") return mistake.status === "review";
    if (mistakeFilter === "练习中") return mistake.status === "learning";
    return mistake.status === "mastered";
  });
  const due = state.mistakes.filter((item) => item.nextReview && item.nextReview <= isoDate() && item.status !== "mastered");
  const repeated = state.mistakes.filter((item) => item.reviewCount > 0 && item.status !== "mastered");

  return `
    ${pageHead("MISTAKE NOTEBOOK", "我的错题", "错题不是收藏起来，而是经过分析、变式和延迟复测，直到真正不再犯。", '<button class="button primary" type="button" data-action="add-mistake">＋ 录入错题</button>')}
    <div class="mistake-layout">
      <section>
        <div class="filter-row" style="margin-bottom:14px">${filters.map((filter) => `<button class="seg-button ${mistakeFilter === filter ? "active" : ""}" type="button" data-action="filter-mistakes" data-filter="${filter}">${filter}</button>`).join("")}</div>
        <article class="card pad">
          ${list.length ? `<ul class="mistake-list">${list.map((mistake) => `
            <li class="mistake-item">
              <span class="mistake-type">${escapeHtml(mistake.type.slice(0, 2))}</span>
              <span class="mistake-copy">
                <strong>${escapeHtml(mistake.title)}</strong>
                <small>${escapeHtml(mistake.source)} · ${formatShortDate(mistake.createdAt)}</small>
                <span class="mistake-meta"><span class="tag ${mistake.status === "review" ? "purple" : "warm"}">${mistake.status === "review" ? "待复习" : mistake.status === "mastered" ? "已掌握" : "练习中"}</span>${mistake.photoId ? '<span class="tag">含原题照片</span>' : ""}</span>
              </span>
              <button class="button secondary small" type="button" data-action="open-mistake" data-id="${mistake.id}">查看与复习</button>
            </li>`).join("")}</ul>` : `<div class="empty-state"><span class="empty-icon">✓</span><strong>这里暂时没有错题</strong><p>可从作业、练习册或试卷拍照录入。</p></div>`}
        </article>
      </section>
      <aside class="mistake-side-stat">
        <article class="card pad">
          <div class="section-head"><h3>今日复习</h3><span class="tag purple">${due.length}题</span></div>
          <p style="color:var(--muted);font-size:13px;line-height:1.7">优先处理到期错题。复习后仍需完成一道变式题，才会转为“已掌握”。</p>
          ${due.length ? `<button class="button primary" type="button" data-action="open-mistake" data-id="${due[0].id}">开始第一题</button>` : '<span class="tag">今天已清空</span>'}
        </article>
        <article class="card pad">
          <div class="section-head"><h3>需要关注</h3></div>
          <div class="recommend-list">
            ${repeated.length ? repeated.slice(0, 2).map((mistake) => `<div class="recommend-item"><span>!</span><div><strong>${escapeHtml(mistake.type)}</strong><p>${escapeHtml(mistake.title)}</p></div></div>`).join("") : '<p style="color:var(--muted);font-size:13px">暂无重复出现的错误。</p>'}
          </div>
        </article>
      </aside>
    </div>`;
}

function renderMap() {
  const units = CURRICULUM.filter((unit) => unit.term === currentTerm);
  const termMeta = TERM_OPTIONS.find((term) => term.id === currentTerm) || TERM_OPTIONS[0];
  const allSkills = getAllSkills(state);
  const termSkills = allSkills.filter((skill) => units.some((unit) => unit.id === skill.unitId));
  const mastered = termSkills.filter((skill) => statusForMastery(skill.mastery, skill.reviewDue) === "mastered").length;

  return `
    ${pageHead("KNOWLEDGE MAP", "上海初中数学知识地图", "覆盖小初衔接和六至九年级八个学期；点击知识点可查看掌握依据。")}
    <section class="card curriculum-toolbar" aria-label="选择学期">
      <div class="term-switch">
        ${TERM_OPTIONS.map((term) => `<button class="seg-button ${currentTerm === term.id ? "active" : ""}" type="button" data-action="switch-term" data-term="${term.id}">${term.shortLabel}</button>`).join("")}
      </div>
      <div class="curriculum-edition ${termMeta.status === "provisional" ? "provisional" : ""}">
        <span class="tag ${termMeta.status === "provisional" ? "warm" : termMeta.status === "bridge" ? "purple" : ""}">${escapeHtml(termMeta.edition)}</span>
        <div><strong>${escapeHtml(termMeta.label)}</strong><p>${escapeHtml(termMeta.note)}</p></div>
      </div>
    </section>
    <section class="grid three" style="margin-bottom:20px">
      <article class="card metric-card"><span class="metric-icon">◫</span><strong>${termSkills.length}</strong><span>知识点</span></article>
      <article class="card metric-card" style="--metric-soft:var(--mint)"><span class="metric-icon">✓</span><strong>${mastered}</strong><span>稳定掌握</span></article>
      <article class="card metric-card" style="--metric-soft:var(--purple-soft)"><span class="metric-icon">↻</span><strong>${termSkills.filter((item) => item.reviewDue).length}</strong><span>待复习</span></article>
    </section>
    <section class="grid">
      ${units.map((unit) => {
        const progress = calculateUnitProgress(unit, state.skills);
        const expanded = expandedUnits.has(unit.id);
        return `<article class="card unit-card" style="--unit-color:${unit.color}">
          <div class="unit-head" role="button" tabindex="0" data-action="toggle-unit" data-id="${unit.id}" aria-expanded="${expanded}">
            <span class="unit-number">${unit.number}</span>
            <span class="unit-copy"><h3>${escapeHtml(unit.title)}</h3><p>${escapeHtml(unit.subtitle)}</p></span>
            <span class="unit-progress"><small>${progress}%</small><span class="progress-track" style="--progress:${progress}%;--bar:${unit.color}"><span></span></span></span>
          </div>
          ${expanded ? `<div class="skill-list">${unit.skills.map((baseSkill) => {
            const skill = { ...baseSkill, ...state.skills[baseSkill.id] };
            return `<button class="skill-row" style="width:100%;border-left:0;border-right:0;background:transparent;text-align:left;cursor:pointer" type="button" data-action="open-skill" data-id="${skill.id}">
              <span class="skill-copy"><strong>${escapeHtml(skill.title)}</strong><small>掌握证据 ${skill.evidence || 0} 条${skill.extension ? " · 阅读拓展" : ""}${skill.currentFocus ? " · 当前重点" : skill.nextUp ? " · 下一步" : ""}</small></span>
              <span class="skill-progress"><span class="progress-track" style="--progress:${skill.mastery}%;--bar:${unit.color}"><span></span></span><small>${skill.mastery}</small></span>
              ${statusPill(skill)}
            </button>`;
          }).join("")}</div>` : ""}
        </article>`;
      }).join("")}
    </section>
    <p style="margin:18px 4px 0;color:var(--muted);font-size:11px;line-height:1.7">说明：知识树按上海初中数学新版教材的章节顺序整理，并单列旧版“数的整除、分数”作为小初衔接。九年级下为新版预备目录，待正式教材发放后校准。掌握度不是考试分数，而是综合独立作答、提示次数、解释质量和延迟复测形成的学习证据。</p>`;
}

function renderPinGate() {
  return `
    <section class="card pin-gate">
      <span class="gate-icon">家</span>
      <h1>进入家长看板</h1>
      <p>这里包含完整学习记录和设置。首次使用的初始PIN为 2609，进入后可修改。</p>
      <form id="pin-form">
        <label class="sr-only" for="parent-pin">家长PIN</label>
        <input class="pin-input" id="parent-pin" name="pin" type="password" inputmode="numeric" maxlength="8" placeholder="输入PIN" required />
        <button class="button primary" type="submit">进入家长模式</button>
      </form>
    </section>`;
}

function renderParent() {
  if (sessionStorage.getItem("math-ai-grade6:parent-unlocked") !== "yes") return renderPinGate();
  const summary = computeSummary(state);
  const days = lastSevenDays(state);
  const maxMinutes = Math.max(30, ...days.map((day) => day.minutes));
  const focus = getCurrentFocus(state);
  const reports = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const repeatedTypes = Object.entries(state.mistakes.reduce((acc, mistake) => {
    if (mistake.status !== "mastered") acc[mistake.type] = (acc[mistake.type] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);

  return `
    ${pageHead("PARENT DASHBOARD", "家长看板", "看证据、看趋势、看下一步，不用每天翻完整对话。", '<button class="button secondary" type="button" data-action="lock-parent">退出家长模式</button>')}
    <section class="card parent-banner">
      <div><h2>${escapeHtml(state.profile.name)} · ${escapeHtml(state.profile.school)}</h2><p>${escapeHtml(state.profile.term)} · ${escapeHtml(state.profile.textbook)}</p></div>
      <div class="button-row"><button class="button secondary small" type="button" data-action="open-settings">学习设置</button><button class="button secondary small" type="button" data-action="open-profile">学生档案</button></div>
    </section>
    <section class="section-block grid four">
      <article class="card metric-card"><span class="metric-icon">✓</span><strong>${summary.stableRate}%</strong><span>已学内容稳定掌握率</span></article>
      <article class="card metric-card" style="--metric-soft:var(--orange-soft)"><span class="metric-icon">◎</span><strong>${focus?.mastery || 0}%</strong><span>${escapeHtml(focus?.title || "当前重点")}</span></article>
      <article class="card metric-card" style="--metric-soft:var(--purple-soft)"><span class="metric-icon">↻</span><strong>${summary.due}</strong><span>到期复习知识点</span></article>
      <article class="card metric-card" style="--metric-soft:var(--blue-soft)"><span class="metric-icon">↗</span><strong>${summary.independentRate}%</strong><span>近期独立完成率</span></article>
    </section>
    <section class="section-block grid two">
      <article class="card pad chart-card">
        <div class="section-head"><div><h2>最近7天学习</h2><p>共${days.reduce((sum, day) => sum + day.minutes, 0)}分钟</p></div><span class="tag">每日≤${state.profile.dailyMinutes}分钟</span></div>
        <div class="bar-chart">${days.map((day) => `<div class="bar-column"><span class="bar" style="--height:${Math.max(4, Math.round((day.minutes / maxMinutes) * 100))}%" title="${day.minutes}分钟"></span><span>周${day.label}</span></div>`).join("")}</div>
      </article>
      <article class="card pad">
        <div class="section-head"><div><h2>系统建议</h2><p>AI只能建议，家长锁定项不会自动改变</p></div></div>
        <div class="recommend-list">
          <div class="recommend-item"><span>1</span><div><strong>保持“理解优先”</strong><p>校内正确率较好，现阶段更值得追问为什么和如何检查。</p></div></div>
          <div class="recommend-item"><span>2</span><div><strong>最大公因数继续练1次</strong><p>方法基本会用，但应用题的模型选择还需要独立证据。</p></div></div>
          <div class="recommend-item"><span>3</span><div><strong>分数加减安排延迟复测</strong><p>曾出现直接相加分母的错误，建议本周用变式题再确认。</p></div></div>
        </div>
      </article>
    </section>
    <section class="section-block grid two">
      <article class="card pad">
        <div class="section-head"><div><h2>最近学习报告</h2><p>点击查看完整证据与下节计划</p></div></div>
        <ul class="report-list">${reports.map((report) => `<li class="report-item"><span class="report-date">${formatShortDate(report.date).replace("月", "/").replace("日", "")}</span><span class="report-copy"><strong>${escapeHtml(report.title)}</strong><small>${report.duration}分钟 · 独立完成率${report.independentRate}%</small></span><button class="button secondary small" type="button" data-action="open-report" data-id="${report.id}">${report.score}分</button></li>`).join("")}</ul>
      </article>
      <article class="card pad">
        <div class="section-head"><div><h2>错题观察</h2><p>仍未稳定消除的错误类型</p></div><a class="button ghost small" href="#mistakes">进入错题本 →</a></div>
        <div class="recommend-list">${repeatedTypes.length ? repeatedTypes.map(([type, count]) => `<div class="recommend-item"><span>${count}</span><div><strong>${escapeHtml(type)}</strong><p>${state.mistakes.filter((item) => item.type === type && item.status !== "mastered").map((item) => escapeHtml(item.title)).join("；")}</p></div></div>`).join("") : '<div class="empty-state">当前没有未解决错题。</div>'}</div>
      </article>
    </section>
    <section class="section-block card pad">
      <div class="section-head"><div><h2>数据与设置</h2><p>学习记录仅保存在当前浏览器，请定期备份</p></div></div>
      <div class="button-row">
        <button class="button secondary" type="button" data-action="export-backup">导出完整备份</button>
        <button class="button secondary" type="button" data-action="import-backup">恢复备份</button>
        <input class="sr-only" id="backup-file" type="file" accept="application/json,.json" />
      </div>
    </section>`;
}

function render() {
  renderNavigation();
  updateHeader();
  const current = route();
  const views = {
    today: renderToday,
    classroom: renderClassroom,
    mistakes: renderMistakes,
    map: renderMap,
    parent: renderParent
  };
  app.innerHTML = views[current]();
  app.focus({ preventScroll: true });
  if (current === "classroom" && state.activeLesson && !state.activeLesson.completed) {
    requestAnimationFrame(() => {
      const log = document.querySelector("#chat-log");
      if (log) log.scrollTop = log.scrollHeight;
      document.querySelector("#lesson-answer")?.focus();
    });
  }
}

function startLesson() {
  state.activeLesson = newLessonRuntime(LESSONS.gcd);
  persist();
  render();
}

function addLessonMessage(message) {
  state.activeLesson.messages.push(message);
}

function completeLesson() {
  const runtime = state.activeLesson;
  const lesson = LESSONS[runtime.lessonId];
  const totalHints = Object.values(runtime.hints).reduce((sum, count) => sum + count, 0);
  const extraAttempts = Object.values(runtime.attempts).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const independentRate = Math.max(35, Math.min(100, 100 - totalHints * 10 - extraAttempts * 7));
  const score = Math.max(60, Math.min(100, Math.round(independentRate * 0.7 + 30)));
  const currentSkill = state.skills[lesson.skillId];
  state.skills[lesson.skillId] = applyEvidence(currentSkill, {
    correct: true,
    hints: totalHints,
    attempts: 1 + extraAttempts,
    date: isoDate()
  });

  const session = {
    id: crypto.randomUUID(),
    date: isoDate(),
    title: "公因数与最大公因数",
    duration: Math.max(8, Math.round((Date.now() - new Date(runtime.startedAt).getTime()) / 60_000)),
    score,
    independentRate,
    summary: independentRate >= 85
      ? "能够独立从公因数理解到实际分组应用，方法选择较稳。"
      : "能够完成最大公因数问题，但模型选择或步骤表达仍需要一次延迟复测。",
    strengths: ["能够列出因数并寻找公共部分", "完成了实际分组问题"],
    needsWork: totalHints
      ? ["减少提示依赖", "看到“相同、全部用完、最多”时主动联想到最大公因数"]
      : ["继续用一句话说明为什么选择最大公因数"],
    nextPlan: "3天后复测最大公因数，再进入最小公倍数",
    records: runtime.records
  };
  state.sessions.push(session);
  runtime.completed = true;
  runtime.sessionId = session.id;
  if (state.lastOpened !== isoDate()) state.streak += 1;
  state.lastOpened = isoDate();
  persist();
}

function submitLessonAnswer(answer) {
  const runtime = state.activeLesson;
  const lesson = LESSONS[runtime.lessonId];
  const question = lesson.questions[runtime.index];
  runtime.attempts[question.id] = (runtime.attempts[question.id] || 0) + 1;
  addLessonMessage({ role: "student", text: answer });
  const correct = validateAnswer(question, answer);

  if (correct) {
    addLessonMessage({ role: "assistant", text: question.success });
    runtime.records.push({
      questionId: question.id,
      answer,
      correct: true,
      attempts: runtime.attempts[question.id],
      hints: runtime.hints[question.id] || 0
    });
    runtime.index += 1;
    if (runtime.index >= lesson.questions.length) {
      addLessonMessage({ role: "assistant", text: "全部关卡完成。我正在把今天的独立作答、提示次数和需要复习的地方整理成报告。" });
      completeLesson();
    } else {
      const next = lesson.questions[runtime.index];
      addLessonMessage({ role: "assistant", text: next.prompt, math: next.math });
      persist();
    }
  } else {
    addLessonMessage({ role: "assistant", text: question.retry });
    persist();
  }
  render();
}

function giveHint(isDontKnow = false) {
  const runtime = state.activeLesson;
  const lesson = LESSONS[runtime.lessonId];
  const question = lesson.questions[runtime.index];
  const used = runtime.hints[question.id] || 0;
  const hint = question.hints[Math.min(used, question.hints.length - 1)];
  runtime.hints[question.id] = used + 1;
  if (isDontKnow) addLessonMessage({ role: "student", text: "我暂时不会，想先听一点思路。" });
  addLessonMessage({ role: "assistant", text: `提示${used + 1}：${hint}` });
  persist();
  render();
}

function openProfileModal() {
  openModal(modalFrame("学生档案", `
    <form id="profile-form">
      <div class="form-grid">
        <div class="field"><label for="profile-name">称呼</label><input id="profile-name" name="name" value="${escapeHtml(state.profile.name)}" required /></div>
        <div class="field"><label for="profile-surname">头像文字</label><input id="profile-surname" name="surname" maxlength="2" value="${escapeHtml(state.profile.surname)}" required /></div>
        <div class="field"><label for="profile-grade">年级</label><select id="profile-grade" name="grade">${["六年级", "七年级", "八年级", "九年级"].map((grade) => `<option ${state.profile.grade === grade ? "selected" : ""}>${grade}</option>`).join("")}</select></div>
        <div class="field"><label for="profile-term">学期</label><select id="profile-term" name="term">${TERM_OPTIONS.filter((term) => term.status !== "bridge").map((term) => `<option ${state.profile.term === term.label ? "selected" : ""}>${term.label}</option>`).join("")}</select></div>
        <div class="field full"><label for="profile-school">学校</label><input id="profile-school" name="school" value="${escapeHtml(state.profile.school)}" /></div>
        <div class="field full"><label for="profile-textbook">教材版本</label><input id="profile-textbook" name="textbook" value="${escapeHtml(state.profile.textbook)}" /><small>正式使用前建议按学校实际教材封面和目录校准。</small></div>
      </div>
      <div class="modal-actions"><button class="button secondary" type="button" data-action="close-modal">取消</button><button class="button primary" type="submit">保存档案</button></div>
    </form>`));
}

function openSettingsModal() {
  openModal(modalFrame("学习设置", `
    <form id="settings-form">
      <div class="form-grid">
        <div class="field"><label for="daily-minutes">每日学习时长</label><select id="daily-minutes" name="dailyMinutes">${[15, 20, 25, 30].map((value) => `<option value="${value}" ${state.profile.dailyMinutes === value ? "selected" : ""}>${value}分钟</option>`).join("")}</select></div>
        <div class="field"><label for="pace">学习节奏</label><select id="pace" name="pace">${["慢一点", "稳步", "适度加速"].map((value) => `<option ${state.preferences.pace === value ? "selected" : ""}>${value}</option>`).join("")}</select></div>
        <div class="field"><label for="depth">教学侧重</label><select id="depth" name="depth">${["理解优先", "熟练度优先", "两者均衡"].map((value) => `<option ${state.preferences.depth === value ? "selected" : ""}>${value}</option>`).join("")}</select></div>
        <div class="field"><label for="encouragement">鼓励风格</label><select id="encouragement" name="encouragement">${["自然简洁", "积极活泼", "沉稳克制"].map((value) => `<option ${state.preferences.encouragement === value ? "selected" : ""}>${value}</option>`).join("")}</select></div>
        <div class="field full"><label for="difficulty">难度目标</label><input id="difficulty" name="difficulty" value="${escapeHtml(state.preferences.difficulty)}" /></div>
        <div class="field full"><label for="new-pin">家长PIN</label><input id="new-pin" name="pin" type="password" inputmode="numeric" minlength="4" maxlength="8" value="${escapeHtml(state.profile.pin)}" /><small>仅用于区分孩子界面和家长设置，不等同于云端账户安全。</small></div>
      </div>
      <div class="modal-actions"><button class="button secondary" type="button" data-action="close-modal">取消</button><button class="button primary" type="submit">保存设置</button></div>
    </form>`));
}

function openMistakeForm() {
  const unitOptions = TERM_OPTIONS.map((term) => {
    const units = CURRICULUM.filter((unit) => unit.term === term.id);
    return units.length ? `<optgroup label="${escapeHtml(term.label)}">${units.map((unit) => `<option value="${unit.id}">${escapeHtml(unit.number)} · ${escapeHtml(unit.title)}</option>`).join("")}</optgroup>` : "";
  }).join("");
  openModal(modalFrame("录入一道错题", `
    <form id="mistake-form">
      <div class="form-grid">
        <div class="field full"><label for="mistake-title">一句话概括错误</label><input id="mistake-title" name="title" placeholder="例如：异分母相加忘记先通分" required /></div>
        <div class="field"><label for="mistake-source">来源</label><input id="mistake-source" name="source" placeholder="校内作业 / 练习册 / 试卷" required /></div>
        <div class="field"><label for="mistake-unit">所属单元</label><select id="mistake-unit" name="unitId">${unitOptions}</select></div>
        <div class="field"><label for="mistake-type">错因</label><select id="mistake-type" name="type">${ERROR_TYPES.map((type) => `<option>${type}</option>`).join("")}</select></div>
        <div class="field"><label for="mistake-answer">当时的答案</label><input id="mistake-answer" name="studentAnswer" placeholder="可留空" /></div>
        <div class="field full"><label for="mistake-problem">题目文字</label><textarea id="mistake-problem" name="problem" placeholder="可手动输入题目，照片清晰时也可以暂时留空"></textarea></div>
        <div class="field full"><label for="mistake-analysis">目前认为的错因</label><textarea id="mistake-analysis" name="analysis" placeholder="例如：没有看清“最多”，错用了最小公倍数"></textarea></div>
        <div class="field full">
          <label class="photo-drop" for="mistake-photo"><span>📷 点击拍照或选择原题图片<br /><small>图片只保存在本设备，可随完整备份导出</small></span><input id="mistake-photo" name="photo" type="file" accept="image/*" capture="environment" /></label>
        </div>
      </div>
      <div class="modal-actions"><button class="button secondary" type="button" data-action="close-modal">取消</button><button class="button primary" type="submit">保存并安排复习</button></div>
    </form>`));
}

async function openMistakeDetail(id) {
  const mistake = state.mistakes.find((item) => item.id === id);
  if (!mistake) return;
  const unit = CURRICULUM.find((item) => item.id === mistake.unitId);
  openModal(modalFrame("错题复习", `
    <span class="tag ${mistake.status === "review" ? "purple" : "warm"}">${mistake.status === "mastered" ? "已掌握" : mistake.status === "review" ? "待复习" : "练习中"}</span>
    <h2 style="margin:12px 0 5px;font-size:22px">${escapeHtml(mistake.title)}</h2>
    <p style="margin:0;color:var(--muted);font-size:12px">${escapeHtml(unit?.title || "未分类")} · ${escapeHtml(mistake.source)} · 已复习${mistake.reviewCount || 0}次</p>
    ${mistake.photoId ? `<div id="mistake-photo-slot" class="detail-block" style="text-align:center">正在读取原题图片……</div>` : ""}
    <div class="detail-block"><h3>原题</h3><p>${escapeHtml(mistake.problem || "未录入题目文字，请查看原题图片。")}</p></div>
    <div class="detail-block"><h3>当时的答案</h3><p>${escapeHtml(mistake.studentAnswer || "未记录")}</p></div>
    <div class="detail-block"><h3>错误原因</h3><p>${escapeHtml(mistake.analysis || "待家长或AI课堂进一步分析")}</p></div>
    <div class="detail-block"><h3>正确方法</h3><p>${escapeHtml(mistake.correction || "先重新独立完成，再对照标准解法；之后还要完成一道变式题。")}</p></div>
    <div class="modal-actions" style="justify-content:space-between">
      <button class="button danger small" type="button" data-action="delete-mistake" data-id="${mistake.id}">删除</button>
      <div class="button-row"><button class="button secondary" type="button" data-action="mark-mistake-learning" data-id="${mistake.id}">仍需复习</button><button class="button primary" type="button" data-action="mark-mistake-mastered" data-id="${mistake.id}">变式题已独立做对</button></div>
    </div>`));
  if (mistake.photoId) {
    try {
      const url = await getMistakeImage(mistake.photoId);
      const slot = document.querySelector("#mistake-photo-slot");
      if (slot && url) slot.innerHTML = `<img class="photo-preview" src="${url}" alt="错题原图" />`;
      else if (slot) slot.textContent = "原题图片未找到。";
    } catch {
      const slot = document.querySelector("#mistake-photo-slot");
      if (slot) slot.textContent = "当前设备无法读取原题图片。";
    }
  }
}

function openSkillDetail(id) {
  const skill = getSkill(state, id);
  if (!skill) return;
  const status = STATUS_META[statusForMastery(skill.mastery, skill.reviewDue)];
  openModal(modalFrame(skill.title, `
    <div class="grid two">
      <div class="setting-tile"><span>当前状态</span><strong>${status.label}</strong></div>
      <div class="setting-tile"><span>掌握度</span><strong>${skill.mastery}%</strong></div>
      <div class="setting-tile"><span>有效证据</span><strong>${skill.evidence || 0}条</strong></div>
      <div class="setting-tile"><span>最近评估</span><strong>${skill.lastAssessed ? formatShortDate(skill.lastAssessed) : "尚未评估"}</strong></div>
    </div>
    <div class="detail-block"><h3>状态说明</h3><p>掌握度综合独立正确、提示次数、解释质量和延迟复测计算。单次答对只增加一条证据，不会直接变成“稳定掌握”。</p></div>
    <div class="detail-block"><h3>课程规划标签</h3><p>${skill.currentFocus ? "当前重点" : skill.nextUp ? "下一步学习" : skill.reviewDue ? "到期复习" : "暂无特殊标签"}${skill.parentLocked ? "；家长已锁定" : ""}</p></div>
    <div class="modal-actions"><button class="button secondary" type="button" data-action="close-modal">关闭</button>${skill.id === "gcd" ? '<button class="button primary" type="button" data-action="go-classroom">进入对应课堂</button>' : ""}</div>`));
}

function openReport(id) {
  const report = state.sessions.find((item) => item.id === id);
  if (!report) return;
  openModal(modalFrame(`${formatShortDate(report.date)} · ${report.title}`, `
    <div class="grid three">
      <div class="setting-tile"><span>学习时长</span><strong>${report.duration}分钟</strong></div>
      <div class="setting-tile"><span>本节表现</span><strong>${report.score}分</strong></div>
      <div class="setting-tile"><span>独立完成率</span><strong>${report.independentRate}%</strong></div>
    </div>
    <div class="detail-block"><h3>本节结论</h3><p>${escapeHtml(report.summary)}</p></div>
    <div class="detail-block"><h3>做得好的</h3><p>${(report.strengths || []).map((item) => `✓ ${escapeHtml(item)}`).join("\n") || "暂无记录"}</p></div>
    <div class="detail-block"><h3>还要继续</h3><p>${(report.needsWork || []).map((item) => `• ${escapeHtml(item)}`).join("\n") || "暂无"}</p></div>
    <div class="detail-block"><h3>下一步计划</h3><p>${escapeHtml(report.nextPlan || "由系统根据到期复习自动安排")}</p></div>
    <div class="detail-block"><h3>家长2分钟提问</h3><p>可以问：“今天什么情况下要用最大公因数？你能自己举一个生活中的例子吗？”只听孩子解释，不需要再布置一套题。</p></div>
    <div class="modal-actions"><button class="button secondary" type="button" data-action="print-report">打印</button><button class="button primary" type="button" data-action="close-modal">完成</button></div>`));
}

async function exportBackup() {
  toast("正在整理学习记录和错题图片……");
  const backup = await createBackup(state);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `数芽学习备份_${isoDate()}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("完整备份已生成");
}

document.addEventListener("click", async (event) => {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const action = actionElement.dataset.action;

  if (action === "close-modal") {
    if (actionElement.classList.contains("modal-backdrop") && event.target !== actionElement) return;
    closeModal();
    return;
  }
  if (action === "go-classroom") {
    closeModal();
    location.hash = "classroom";
  }
  if (action === "start-lesson") startLesson();
  if (action === "pause-lesson") location.hash = "today";
  if (action === "reset-lesson") {
    state.activeLesson = null;
    persist();
    render();
  }
  if (action === "lesson-hint") giveHint(false);
  if (action === "lesson-dont-know") giveHint(true);
  if (action === "add-mistake") openMistakeForm();
  if (action === "filter-mistakes") {
    mistakeFilter = actionElement.dataset.filter;
    render();
  }
  if (action === "open-mistake") await openMistakeDetail(actionElement.dataset.id);
  if (action === "delete-mistake") {
    const mistake = state.mistakes.find((item) => item.id === actionElement.dataset.id);
    if (mistake && confirm("确定删除这道错题及其本机图片吗？此操作无法撤销。")) {
      if (mistake.photoId) await deleteMistakeImage(mistake.photoId);
      state.mistakes = state.mistakes.filter((item) => item.id !== mistake.id);
      persist();
      closeModal();
      render();
      toast("错题已删除");
    }
  }
  if (action === "mark-mistake-learning" || action === "mark-mistake-mastered") {
    const mistake = state.mistakes.find((item) => item.id === actionElement.dataset.id);
    if (mistake) {
      mistake.reviewCount = (mistake.reviewCount || 0) + 1;
      mistake.status = action === "mark-mistake-mastered" ? "mastered" : "review";
      mistake.nextReview = action === "mark-mistake-mastered" ? offsetDate(7) : offsetDate(2);
      persist();
      closeModal();
      render();
      toast(action === "mark-mistake-mastered" ? "已记录一次独立正确，7天后再确认" : "已安排2天后再次复习");
    }
  }
  if (action === "switch-term") {
    currentTerm = actionElement.dataset.term;
    render();
  }
  if (action === "toggle-unit") {
    const id = actionElement.dataset.id;
    expandedUnits.has(id) ? expandedUnits.delete(id) : expandedUnits.add(id);
    render();
  }
  if (action === "open-skill") openSkillDetail(actionElement.dataset.id);
  if (action === "lock-parent") {
    sessionStorage.removeItem("math-ai-grade6:parent-unlocked");
    render();
  }
  if (action === "open-profile") openProfileModal();
  if (action === "open-settings") openSettingsModal();
  if (action === "open-report") openReport(actionElement.dataset.id);
  if (action === "print-report") window.print();
  if (action === "export-backup") await exportBackup();
  if (action === "import-backup") document.querySelector("#backup-file")?.click();
});

document.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);

  if (form.id === "answer-form") {
    const answer = String(data.get("answer") || "").trim();
    if (answer) submitLessonAnswer(answer);
  }

  if (form.id === "pin-form") {
    if (String(data.get("pin")) === String(state.profile.pin)) {
      sessionStorage.setItem("math-ai-grade6:parent-unlocked", "yes");
      render();
      toast("已进入家长模式");
    } else {
      form.querySelector("input").value = "";
      toast("PIN不正确，请再试一次");
    }
  }

  if (form.id === "profile-form") {
    state.profile = {
      ...state.profile,
      name: String(data.get("name") || "同学").trim(),
      surname: String(data.get("surname") || "学").trim(),
      grade: String(data.get("grade") || "六年级").trim(),
      term: String(data.get("term") || "六年级上"),
      school: String(data.get("school") || "").trim(),
      textbook: String(data.get("textbook") || "").trim()
    };
    currentTerm = TERM_OPTIONS.find((term) => term.label === state.profile.term)?.id || currentTerm;
    persist();
    closeModal();
    render();
    toast("学生档案已保存");
  }

  if (form.id === "settings-form") {
    state.profile.dailyMinutes = Number(data.get("dailyMinutes"));
    state.profile.pin = String(data.get("pin"));
    state.preferences = {
      ...state.preferences,
      pace: String(data.get("pace")),
      depth: String(data.get("depth")),
      encouragement: String(data.get("encouragement")),
      difficulty: String(data.get("difficulty"))
    };
    persist();
    closeModal();
    render();
    toast("学习设置已保存");
  }

  if (form.id === "mistake-form") {
    const file = data.get("photo");
    let photoId = null;
    if (file instanceof File && file.size > 0) {
      if (file.size > 8 * 1024 * 1024) {
        toast("图片超过8MB，请压缩后再试");
        return;
      }
      photoId = await saveMistakeImage(file);
    }
    const unit = CURRICULUM.find((item) => item.id === data.get("unitId"));
    const skillId = unit?.skills[0]?.id || null;
    state.mistakes.unshift({
      id: crypto.randomUUID(),
      title: String(data.get("title") || "未命名错题").trim(),
      source: String(data.get("source") || "手动录入").trim(),
      unitId: String(data.get("unitId")),
      skillId,
      type: String(data.get("type")),
      problem: String(data.get("problem") || "").trim(),
      studentAnswer: String(data.get("studentAnswer") || "").trim(),
      analysis: String(data.get("analysis") || "").trim(),
      correction: "",
      status: "review",
      reviewCount: 0,
      createdAt: isoDate(),
      nextReview: isoDate(),
      photoId
    });
    persist();
    closeModal();
    render();
    toast("错题已保存，并加入今日复习");
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.id !== "backup-file") return;
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    state = await restoreBackup(backup);
    render();
    toast("备份已恢复");
  } catch (error) {
    console.error(error);
    toast(error.message || "备份文件无法读取");
  } finally {
    event.target.value = "";
  }
});

document.querySelector("#profile-button").addEventListener("click", openProfileModal);
window.addEventListener("hashchange", render);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
  if ((event.key === "Enter" || event.key === " ") && event.target.matches('[role="button"][data-action]')) {
    event.preventDefault();
    event.target.click();
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  let refreshingForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshingForUpdate) return;
    refreshingForUpdate = true;
    window.location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(console.warn);
  });
}

if (!location.hash) location.replace("#today");
render();
