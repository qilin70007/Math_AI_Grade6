export const NAV_ITEMS = [
  { id: "today", label: "今日", icon: "⌂" },
  { id: "classroom", label: "AI课堂", icon: "✦" },
  { id: "mistakes", label: "错题", icon: "◇" },
  { id: "map", label: "知识图", icon: "◫" },
  { id: "parent", label: "家长", icon: "◉" }
];

export const STATUS_META = {
  unseen: { label: "未学习", className: "unseen" },
  introduced: { label: "初次接触", className: "learning" },
  learning: { label: "正在练习", className: "learning" },
  basic: { label: "基本掌握", className: "review" },
  mastered: { label: "稳定掌握", className: "mastered" },
  review: { label: "待复习", className: "review" }
};

export const ERROR_TYPES = [
  "概念不清",
  "审题错误",
  "计算错误",
  "建模错误",
  "步骤遗漏",
  "检查不足"
];

export const CURRICULUM = [
  {
    id: "u1",
    number: "01",
    term: "六上",
    title: "数的整除",
    subtitle: "整数、因数倍数、素因数、最大公因数与最小公倍数",
    color: "#28776b",
    skills: [
      { id: "integer-divisibility", title: "整数与整除的意义", mastery: 92, evidence: 5 },
      { id: "factors-multiples", title: "因数与倍数", mastery: 86, evidence: 4 },
      { id: "divisible-2-5", title: "能被2、5整除的数", mastery: 88, evidence: 4 },
      { id: "prime-composite", title: "素数与合数", mastery: 76, evidence: 3 },
      { id: "prime-factorization", title: "分解素因数", mastery: 68, evidence: 3 },
      { id: "gcd", title: "公因数与最大公因数", mastery: 58, evidence: 2, currentFocus: true },
      { id: "lcm", title: "公倍数与最小公倍数", mastery: 32, evidence: 1, nextUp: true }
    ]
  },
  {
    id: "u2",
    number: "02",
    term: "六上",
    title: "分数",
    subtitle: "分数性质、四则运算、分数与小数互化",
    color: "#d88642",
    skills: [
      { id: "fraction-meaning", title: "分数的意义与除法", mastery: 82, evidence: 4 },
      { id: "fraction-property", title: "分数的基本性质", mastery: 72, evidence: 3 },
      { id: "fraction-compare", title: "分数大小比较", mastery: 62, evidence: 2 },
      { id: "fraction-add-sub", title: "分数的加减法", mastery: 46, evidence: 2, reviewDue: true },
      { id: "fraction-multiply", title: "分数的乘法", mastery: 18, evidence: 1 },
      { id: "fraction-divide", title: "分数的除法", mastery: 0, evidence: 0 },
      { id: "fraction-decimal", title: "分数与小数互化", mastery: 0, evidence: 0 },
      { id: "fraction-mixed", title: "分数、小数混合运算", mastery: 0, evidence: 0 }
    ]
  },
  {
    id: "u3",
    number: "03",
    term: "六上",
    title: "比和比例",
    subtitle: "比的意义、比例、百分比及其应用",
    color: "#7769ad",
    skills: [
      { id: "ratio-meaning", title: "比的意义", mastery: 0, evidence: 0 },
      { id: "ratio-property", title: "比的基本性质", mastery: 0, evidence: 0 },
      { id: "proportion", title: "比例", mastery: 0, evidence: 0 },
      { id: "percentage", title: "百分比的意义", mastery: 0, evidence: 0 },
      { id: "percentage-application", title: "百分比的应用", mastery: 0, evidence: 0 },
      { id: "equally-likely", title: "等可能事件", mastery: 0, evidence: 0 }
    ]
  },
  {
    id: "u4",
    number: "04",
    term: "六上",
    title: "圆和扇形",
    subtitle: "圆周长、弧长、圆面积与扇形面积",
    color: "#4f82a1",
    skills: [
      { id: "circle-perimeter", title: "圆的周长", mastery: 0, evidence: 0 },
      { id: "arc-length", title: "弧长", mastery: 0, evidence: 0 },
      { id: "circle-area", title: "圆的面积", mastery: 0, evidence: 0 },
      { id: "sector-area", title: "扇形的面积", mastery: 0, evidence: 0 }
    ]
  },
  {
    id: "u5",
    number: "05",
    term: "六下",
    title: "有理数",
    subtitle: "正负数、数轴、绝对值与有理数运算",
    color: "#3c807d",
    skills: [
      { id: "negative-number", title: "正数与负数", mastery: 0, evidence: 0 },
      { id: "number-line", title: "数轴", mastery: 0, evidence: 0 },
      { id: "absolute-value", title: "绝对值", mastery: 0, evidence: 0 },
      { id: "rational-operation", title: "有理数的运算", mastery: 0, evidence: 0 }
    ]
  },
  {
    id: "u6",
    number: "06",
    term: "六下",
    title: "一次方程与不等式",
    subtitle: "字母表示数、一次方程（组）与一次不等式（组）",
    color: "#bd6a62",
    skills: [
      { id: "algebraic-expression", title: "用字母表示数", mastery: 0, evidence: 0 },
      { id: "linear-equation", title: "一元一次方程", mastery: 0, evidence: 0 },
      { id: "equation-system", title: "二元一次方程组", mastery: 0, evidence: 0 },
      { id: "linear-inequality", title: "一元一次不等式", mastery: 0, evidence: 0 }
    ]
  },
  {
    id: "u7",
    number: "07",
    term: "六下",
    title: "线段与角",
    subtitle: "基本作图、线段关系与角的度量",
    color: "#99824a",
    skills: [
      { id: "segment", title: "线段的大小比较", mastery: 0, evidence: 0 },
      { id: "angle", title: "角的度量与比较", mastery: 0, evidence: 0 },
      { id: "basic-construction", title: "基本作图", mastery: 0, evidence: 0 }
    ]
  },
  {
    id: "u8",
    number: "08",
    term: "六下",
    title: "长方体的再认识",
    subtitle: "空间中的线面关系与长方体",
    color: "#5f7194",
    skills: [
      { id: "cuboid-elements", title: "长方体的元素", mastery: 0, evidence: 0 },
      { id: "line-plane", title: "空间中直线与平面的位置关系", mastery: 0, evidence: 0 },
      { id: "cuboid-view", title: "长方体的直观图", mastery: 0, evidence: 0 }
    ]
  }
];

export const LESSONS = {
  gcd: {
    id: "gcd",
    title: "最大公因数侦探社",
    subtitle: "从列因数到解决分组问题",
    skillId: "gcd",
    duration: 20,
    stageNames: ["热身", "发现", "方法", "应用", "出口题"],
    goals: [
      "准确列出一个数的全部因数",
      "从公因数中找到最大公因数",
      "识别实际问题为什么要用最大公因数"
    ],
    questions: [
      {
        id: "gcd-1",
        stage: "热身",
        prompt: "先热身：请按从小到大的顺序，写出 24 的全部正因数。",
        math: "24 的因数 = ?",
        validator: { type: "numberListExact", expected: [1, 2, 3, 4, 6, 8, 12, 24] },
        success: "完整，而且顺序很清楚。找因数时成对思考，可以避免遗漏：1×24、2×12、3×8、4×6。",
        retry: "数量还不太对。可以从 1 开始成对寻找，想想哪些整数相乘等于 24。",
        hints: [
          "先写出 1×24、2×12，再继续尝试。",
          "24 可以写成：1×24、2×12、3×8、4×6。把每个数都收集起来。"
        ]
      },
      {
        id: "gcd-2",
        stage: "发现",
        prompt: "现在比较 18 和 24。请写出它们所有的公因数，仍然按从小到大排列。",
        math: "18 和 24 的公因数 = ?",
        validator: { type: "numberListExact", expected: [1, 2, 3, 6] },
        success: "对，公因数是两个数都能整除的数。你已经把“公共部分”找出来了。",
        retry: "这里要找的是两个数共同拥有的因数。可以先分别列出 18 和 24 的因数，再取交集。",
        hints: [
          "18 的因数有 1、2、3、6、9、18；再和 24 的因数比较。",
          "两个列表中重复出现的是 1、2、3、6。"
        ]
      },
      {
        id: "gcd-3",
        stage: "方法",
        prompt: "刚才找到的公因数中，最大的一个是多少？请只写这个数，并用一句话说明它为什么叫“最大公因数”。",
        math: "gcd(18, 24) = ?",
        validator: { type: "containsNumbers", expected: [6] },
        success: "正是 6。它既是 18 和 24 的公因数，又是这些公因数里最大的一个。",
        retry: "请回看刚才的公因数列表：1、2、3、6，选择最大的一个。",
        hints: ["在 1、2、3、6 中，最大的数是哪一个？"]
      },
      {
        id: "gcd-4",
        stage: "应用",
        prompt: "18支红笔和24支蓝笔要装成内容完全相同的礼品袋，全部用完，最多能装几袋？每袋各有几支红笔和蓝笔？",
        math: "最多 ? 袋；每袋红笔 ? 支，蓝笔 ? 支",
        validator: { type: "containsNumbers", expected: [6, 3, 4] },
        success: "判断正确：袋数要同时整除 18 和 24，而且要“最多”，所以取最大公因数 6；每袋红笔3支、蓝笔4支。",
        retry: "“内容相同、全部用完”说明袋数必须同时整除18和24；“最多”提示我们选择最大的公因数。",
        hints: [
          "先求 gcd(18, 24)，这就是最多的袋数。",
          "最多6袋；再分别计算 18÷6 和 24÷6。"
        ]
      },
      {
        id: "gcd-5",
        stage: "出口题",
        prompt: "最后独立完成：48和72的最大公因数是多少？这次只提交答案，不给提示也没关系，认真检查一次。",
        math: "gcd(48, 72) = ?",
        validator: { type: "number", expected: 24 },
        success: "24，正确！48=24×2，72=24×3，而且不存在更大的公因数。今天的核心方法已经掌握。",
        retry: "再检查一次。你可以列因数，也可以分解素因数后取共同部分。",
        hints: [
          "48=2⁴×3，72=2³×3²；共同部分取较小指数。",
          "共同部分是 2³×3。"
        ]
      }
    ]
  }
};

export const DEFAULT_MISTAKES = [
  {
    id: "m-fraction-001",
    title: "异分母分数相加时直接相加分母",
    unitId: "u2",
    skillId: "fraction-add-sub",
    source: "校内练习册",
    type: "概念不清",
    problem: "计算 1/3 + 1/4。",
    studentAnswer: "2/7",
    analysis: "把分子和分母分别直接相加，说明通分的意义还没有稳定。",
    correction: "先把两个分数转化为相同的计数单位：1/3=4/12，1/4=3/12，所以结果是7/12。",
    status: "review",
    reviewCount: 1,
    photoId: null
  },
  {
    id: "m-gcd-001",
    title: "分组题没有判断用最大公因数还是最小公倍数",
    unitId: "u1",
    skillId: "gcd",
    source: "周末检测",
    type: "建模错误",
    problem: "18支红笔和24支蓝笔装成相同礼品袋，最多装几袋？",
    studentAnswer: "72袋",
    analysis: "看到两个数就直接计算最小公倍数，没有识别“分成相同份且最多”的语义。",
    correction: "分成若干相同组、全部用完、求最多组数，应求两个数量的最大公因数。",
    status: "learning",
    reviewCount: 0,
    photoId: null
  }
];
