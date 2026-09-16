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

export const TERM_OPTIONS = [
  {
    id: "衔接",
    label: "小初衔接",
    shortLabel: "衔接",
    edition: "新老教材衔接",
    status: "bridge",
    note: "补足旧版六年级起始内容：数的整除、分数。"
  },
  { id: "六上", label: "六年级上", shortLabel: "六上", edition: "2024 新版", status: "official", note: "上海初中数学新版教材。" },
  { id: "六下", label: "六年级下", shortLabel: "六下", edition: "2025 新版", status: "official", note: "上海初中数学新版教材。" },
  { id: "七上", label: "七年级上", shortLabel: "七上", edition: "2024 新版", status: "official", note: "上海初中数学新版教材。" },
  { id: "七下", label: "七年级下", shortLabel: "七下", edition: "2025 新版", status: "official", note: "上海初中数学新版教材。" },
  { id: "八上", label: "八年级上", shortLabel: "八上", edition: "2025 新版", status: "official", note: "上海初中数学新版教材。" },
  { id: "八下", label: "八年级下", shortLabel: "八下", edition: "2026 新版", status: "official", note: "上海初中数学新版教材。" },
  { id: "九上", label: "九年级上", shortLabel: "九上", edition: "2026 新版", status: "official", note: "上海初中数学新版教材。" },
  {
    id: "九下",
    label: "九年级下",
    shortLabel: "九下",
    edition: "新版预备",
    status: "provisional",
    note: "按新版知识序列预置；待上海正式教材发放后逐节校准。"
  }
];

const blankSkills = (items) => items.map(([id, title, extra = {}]) => ({
  id,
  title,
  mastery: 0,
  evidence: 0,
  ...extra
}));

export const CURRICULUM = [
  {
    id: "u1",
    number: "衔01",
    term: "衔接",
    title: "数的整除",
    subtitle: "旧版核心章：整除、因数倍数、素因数、最大公因数与最小公倍数",
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
    number: "衔02",
    term: "衔接",
    title: "分数",
    subtitle: "旧版核心章：分数性质、四则运算、分数与小数互化",
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
    id: "n01",
    number: "01",
    term: "六上",
    chapter: 1,
    title: "有理数",
    subtitle: "有理数的引入、四则运算、乘方与混合运算",
    color: "#3c807d",
    skills: blankSkills([
      ["c01-positive-negative", "正数、负数与有理数分类"],
      ["c01-number-line", "数轴、相反数与数的大小"],
      ["c01-absolute-value", "绝对值及其几何意义"],
      ["c01-add-sub", "有理数的加法与减法"],
      ["c01-mul-div", "有理数的乘法与除法"],
      ["c01-power", "有理数的乘方与科学记数"],
      ["c01-mixed", "有理数的混合运算"],
      ["c01-word-problem", "用有理数表示和解决实际问题"]
    ])
  },
  {
    id: "n02",
    number: "02",
    term: "六上",
    chapter: 2,
    title: "简单的代数式",
    subtitle: "用字母表示数、代数式与代数式的值、一次式",
    color: "#7769ad",
    skills: blankSkills([
      ["c02-letter-number", "用字母表示数量与数量关系"],
      ["c02-expression", "代数式的意义与规范书写"],
      ["c02-expression-value", "代数式的值"],
      ["c02-monomial", "单项式的系数与次数"],
      ["c02-polynomial", "多项式、项与次数"],
      ["c02-linear-expression", "一次式的识别与整理"],
      ["c02-divisibility-359", "能被3、5、9整除的数的特征", { extension: true }]
    ])
  },
  {
    id: "n03",
    number: "03",
    term: "六上",
    chapter: 3,
    title: "一元一次方程",
    subtitle: "方程、解一元一次方程及其应用",
    color: "#bd6a62",
    skills: blankSkills([
      ["c03-equation-model", "方程、方程的解与列方程"],
      ["c03-equivalent-property", "等式性质与方程同解变形"],
      ["c03-solve-basic", "移项、合并同类项解方程"],
      ["c03-solve-fraction", "去括号、去分母解方程"],
      ["c03-application", "一元一次方程的实际应用"],
      ["c03-check", "方程解的检验与结果解释"]
    ])
  },
  {
    id: "n04",
    number: "04",
    term: "六上",
    chapter: 4,
    title: "线段与角",
    subtitle: "线段、射线、直线、角及基本作图",
    color: "#99824a",
    skills: blankSkills([
      ["c04-line-ray-segment", "直线、射线与线段"],
      ["c04-segment-compare", "线段的比较、和差与中点"],
      ["c04-angle-concept", "角的表示、度量与换算"],
      ["c04-angle-relation", "角的比较、和差与角平分线"],
      ["c04-complement-supplement", "余角、补角及其性质"],
      ["c04-construction", "尺规作线段与角"]
    ])
  },
  {
    id: "n05",
    number: "05",
    term: "六下",
    chapter: 5,
    title: "比与比例",
    subtitle: "比、比例及其性质，百分数及实际应用",
    color: "#7769ad",
    skills: blankSkills([
      ["c05-ratio", "比的意义、比值与比的化简"],
      ["c05-ratio-property", "比的基本性质"],
      ["c05-proportion", "比例与比例的基本性质"],
      ["c05-proportion-solve", "解比例"],
      ["c05-percent", "百分数、分数与小数的联系"],
      ["c05-percent-application", "百分数的实际应用"],
      ["c05-ratio-application", "按比例分配与比例问题"]
    ])
  },
  {
    id: "n06",
    number: "06",
    term: "六下",
    chapter: 6,
    title: "圆与扇形",
    subtitle: "圆的周长、弧长、圆面积与扇形面积",
    color: "#4f82a1",
    skills: blankSkills([
      ["c06-circle-elements", "圆、弧与圆心角"],
      ["c06-circumference", "圆的周长"],
      ["c06-arc-length", "弧长"],
      ["c06-circle-area", "圆的面积"],
      ["c06-sector-area", "扇形的面积"],
      ["c06-composite-figure", "圆与扇形组合图形"]
    ])
  },
  {
    id: "n07",
    number: "07",
    term: "六下",
    chapter: 7,
    title: "可能性与统计图表",
    subtitle: "随机现象、数据收集整理与百分数的统计意义",
    color: "#d88642",
    skills: blankSkills([
      ["c07-random-event", "必然、不可能与随机现象"],
      ["c07-possibility", "事件结果的可能性"],
      ["c07-data-collect", "数据的收集与分类整理"],
      ["c07-stat-table", "统计表与统计图的选择"],
      ["c07-percent-stat", "百分数的统计意义"],
      ["c07-chart-reading", "读取、比较并解释统计图表"]
    ])
  },
  {
    id: "n08",
    number: "08",
    term: "六下",
    chapter: 8,
    title: "圆柱与圆锥",
    subtitle: "圆柱、圆锥及其侧面展开图",
    color: "#5f7194",
    skills: blankSkills([
      ["c08-cylinder-elements", "圆柱的组成与基本元素"],
      ["c08-cylinder-net", "圆柱的侧面展开图"],
      ["c08-cylinder-surface", "圆柱的侧面积与表面积"],
      ["c08-cone-elements", "圆锥的组成与基本元素"],
      ["c08-cone-net", "圆锥的侧面展开图"],
      ["c08-solid-application", "圆柱、圆锥展开图的实际应用"]
    ])
  },
  {
    id: "n09",
    number: "09",
    term: "六下",
    chapter: 9,
    title: "二元一次方程组",
    subtitle: "二元一次方程组的概念、解法与应用",
    color: "#bd6a62",
    skills: blankSkills([
      ["c09-binary-equation", "二元一次方程及其解"],
      ["c09-equation-system", "二元一次方程组及其解"],
      ["c09-substitution", "代入消元法"],
      ["c09-elimination", "加减消元法"],
      ["c09-application", "列二元一次方程组解决问题"],
      ["c09-check", "方程组解的检验与实际解释"]
    ])
  },
  {
    id: "n10",
    number: "10",
    term: "七上",
    chapter: 10,
    title: "整式的加减",
    subtitle: "整式、合并同类项、整式的加法和减法",
    color: "#3c807d",
    skills: blankSkills([
      ["c10-integer-expression", "整式、单项式与多项式"],
      ["c10-like-terms", "同类项与合并同类项"],
      ["c10-remove-brackets", "去括号与添括号"],
      ["c10-add-sub", "整式的加法与减法"],
      ["c10-evaluate", "整式化简与求值"],
      ["c10-model", "用整式表示实际数量关系"]
    ])
  },
  {
    id: "n11",
    number: "11",
    term: "七上",
    chapter: 11,
    title: "整式的乘除",
    subtitle: "整式的乘法、乘法公式与整式的除法",
    color: "#7769ad",
    skills: blankSkills([
      ["c11-power-rule", "同底数幂及积、幂的乘方法则"],
      ["c11-monomial-multiply", "单项式的乘法"],
      ["c11-polynomial-multiply", "单项式与多项式、多项式相乘"],
      ["c11-square-formula", "完全平方公式"],
      ["c11-difference-squares", "平方差公式"],
      ["c11-monomial-divide", "单项式的除法"],
      ["c11-polynomial-divide", "多项式除以单项式"],
      ["c11-mixed", "整式乘除的化简与应用"]
    ])
  },
  {
    id: "n12",
    number: "12",
    term: "七上",
    chapter: 12,
    title: "因式分解",
    subtitle: "因式分解的意义与常用方法",
    color: "#d88642",
    skills: blankSkills([
      ["c12-meaning", "因式分解的意义与检验"],
      ["c12-common-factor", "提取公因式法"],
      ["c12-square-difference", "平方差公式法"],
      ["c12-perfect-square", "完全平方公式法"],
      ["c12-grouping", "分组分解与综合方法"],
      ["c12-application", "因式分解的计算应用"]
    ])
  },
  {
    id: "n13",
    number: "13",
    term: "七上",
    chapter: 13,
    title: "分式",
    subtitle: "分式及其性质、分式运算与分式方程",
    color: "#4f82a1",
    skills: blankSkills([
      ["c13-concept", "分式的概念与有意义条件"],
      ["c13-property", "分式的基本性质"],
      ["c13-reduction", "约分与通分"],
      ["c13-mul-div", "分式的乘除"],
      ["c13-add-sub", "分式的加减"],
      ["c13-mixed", "分式的混合运算"],
      ["c13-equation", "分式方程的解法与验根"],
      ["c13-equation-application", "分式方程的实际应用"]
    ])
  },
  {
    id: "n14",
    number: "14",
    term: "七上",
    chapter: 14,
    title: "图形的运动",
    subtitle: "平移、旋转、轴对称与中心对称",
    color: "#5f7194",
    skills: blankSkills([
      ["c14-translation", "平移及其基本性质"],
      ["c14-translation-draw", "作平移后的图形"],
      ["c14-rotation", "旋转及其基本性质"],
      ["c14-rotation-draw", "作旋转后的图形"],
      ["c14-axis-symmetry", "轴对称及其基本性质"],
      ["c14-axis-draw", "作轴对称图形"],
      ["c14-central-symmetry", "中心对称及其基本性质"],
      ["c14-pattern", "用图形运动分析与设计图案"]
    ])
  },
  {
    id: "n15",
    number: "15",
    term: "七下",
    chapter: 15,
    title: "一元一次不等式",
    subtitle: "不等式及其性质、不等式与不等式组",
    color: "#bd6a62",
    skills: blankSkills([
      ["c15-inequality", "不等式及其解集"],
      ["c15-properties", "不等式的基本性质"],
      ["c15-linear-solve", "解一元一次不等式"],
      ["c15-number-line", "在数轴上表示不等式解集"],
      ["c15-system", "一元一次不等式组"],
      ["c15-application", "不等式（组）的实际应用"]
    ])
  },
  {
    id: "n16",
    number: "16",
    term: "七下",
    chapter: 16,
    title: "相交线与平行线",
    subtitle: "相交线、平行线、命题与证明",
    color: "#99824a",
    skills: blankSkills([
      ["c16-vertical-angle", "邻补角与对顶角"],
      ["c16-perpendicular", "垂线、垂线段与点到直线距离"],
      ["c16-parallel-judge", "平行线的判定"],
      ["c16-parallel-property", "平行线的性质"],
      ["c16-parallel-application", "平行线判定与性质的综合应用"],
      ["c16-proposition", "命题、条件与结论"],
      ["c16-proof", "几何说理与证明的基本格式"]
    ])
  },
  {
    id: "n17",
    number: "17",
    term: "七下",
    chapter: 17,
    title: "三角形",
    subtitle: "三角形概念、内角和、全等性质与判定",
    color: "#4f82a1",
    skills: blankSkills([
      ["c17-elements", "三角形的元素、分类与表示"],
      ["c17-side-relation", "三角形三边关系"],
      ["c17-special-lines", "三角形的高、中线与角平分线"],
      ["c17-angle-sum", "三角形内角和与外角"],
      ["c17-congruence", "全等三角形及其性质"],
      ["c17-sss", "全等判定：边边边"],
      ["c17-sas", "全等判定：边角边"],
      ["c17-asa-aas", "全等判定：角边角与角角边"],
      ["c17-congruence-proof", "全等三角形的证明与应用"]
    ])
  },
  {
    id: "n18",
    number: "18",
    term: "七下",
    chapter: 18,
    title: "等腰三角形",
    subtitle: "等腰三角形、等边三角形与线段垂直平分线",
    color: "#d88642",
    skills: blankSkills([
      ["c18-isosceles-property", "等腰三角形的性质"],
      ["c18-isosceles-judge", "等腰三角形的判定"],
      ["c18-isosceles-proof", "等腰三角形的计算与证明"],
      ["c18-equilateral-property", "等边三角形的性质"],
      ["c18-equilateral-judge", "等边三角形的判定"],
      ["c18-perp-bisector", "线段垂直平分线的性质与判定"],
      ["c18-locus", "到线段两端距离相等的点"]
    ])
  },
  {
    id: "n19",
    number: "19",
    term: "八上",
    chapter: 19,
    title: "实数",
    subtitle: "平方根、立方根与实数",
    color: "#3c807d",
    skills: blankSkills([
      ["c19-square-root", "平方根与算术平方根"],
      ["c19-cube-root", "立方根"],
      ["c19-irrational", "无理数与实数分类"],
      ["c19-number-line", "实数与数轴上的点"],
      ["c19-compare", "实数的大小比较与估算"],
      ["c19-operation", "实数的运算与化简"]
    ])
  },
  {
    id: "n20",
    number: "20",
    term: "八上",
    chapter: 20,
    title: "二次根式",
    subtitle: "二次根式及其性质与运算",
    color: "#7769ad",
    skills: blankSkills([
      ["c20-concept", "二次根式的概念与有意义条件"],
      ["c20-properties", "二次根式的性质"],
      ["c20-simplest", "最简二次根式与同类二次根式"],
      ["c20-mul-div", "二次根式的乘除"],
      ["c20-add-sub", "二次根式的加减"],
      ["c20-denominator", "分母有理化"],
      ["c20-mixed", "二次根式的混合运算"]
    ])
  },
  {
    id: "n21",
    number: "21",
    term: "八上",
    chapter: 21,
    title: "一元二次方程",
    subtitle: "概念、解法、判别式、根与系数关系及应用",
    color: "#bd6a62",
    skills: blankSkills([
      ["c21-concept", "一元二次方程及一般形式"],
      ["c21-direct-root", "直接开平方法"],
      ["c21-factor", "因式分解法"],
      ["c21-completing-square", "配方法"],
      ["c21-formula", "公式法"],
      ["c21-discriminant", "根的判别式"],
      ["c21-vieta", "根与系数的关系"],
      ["c21-application", "一元二次方程的实际应用"],
      ["c21-check", "方程根的检验与取舍"]
    ])
  },
  {
    id: "n22",
    number: "22",
    term: "八上",
    chapter: 22,
    title: "直角三角形",
    subtitle: "直角三角形、角平分线与勾股定理",
    color: "#4f82a1",
    skills: blankSkills([
      ["c22-right-congruence", "直角三角形全等判定（斜边直角边）"],
      ["c22-right-property", "直角三角形的基本性质"],
      ["c22-angle-bisector", "角平分线的性质与判定"],
      ["c22-pythagorean", "勾股定理"],
      ["c22-pythagorean-converse", "勾股定理的逆定理"],
      ["c22-distance", "距离问题与最短路径"],
      ["c22-proof", "直角三角形的计算与证明"]
    ])
  },
  {
    id: "n23",
    number: "23",
    term: "八下",
    chapter: 23,
    title: "四边形",
    subtitle: "多边形、平行四边形、特殊平行四边形与中位线",
    color: "#5f7194",
    skills: blankSkills([
      ["c23-polygon", "多边形及内角和、外角和"],
      ["c23-parallelogram-property", "平行四边形的性质"],
      ["c23-parallelogram-judge", "平行四边形的判定"],
      ["c23-rectangle", "矩形的性质与判定"],
      ["c23-rhombus", "菱形的性质与判定"],
      ["c23-square", "正方形的性质与判定"],
      ["c23-midline", "三角形中位线"],
      ["c23-centroid", "三角形重心"],
      ["c23-comprehensive", "四边形综合证明与计算"]
    ])
  },
  {
    id: "n24",
    number: "24",
    term: "八下",
    chapter: 24,
    title: "平面直角坐标系",
    subtitle: "点的坐标、两点距离与坐标中的图形运动",
    color: "#99824a",
    skills: blankSkills([
      ["c24-coordinate-system", "平面直角坐标系与点的坐标"],
      ["c24-quadrant", "象限与坐标轴上点的特征"],
      ["c24-distance", "坐标平面内两点间距离"],
      ["c24-geometric-figure", "用坐标描述几何图形"],
      ["c24-translation", "平移前后点的坐标变化"],
      ["c24-symmetry", "轴对称、中心对称与坐标变化"],
      ["c24-area", "坐标法求图形面积"]
    ])
  },
  {
    id: "n25",
    number: "25",
    term: "八下",
    chapter: 25,
    title: "一次函数",
    subtitle: "函数、正比例函数、一次函数及其应用",
    color: "#3c807d",
    skills: blankSkills([
      ["c25-variable-function", "变量与函数"],
      ["c25-function-expression", "函数解析式与自变量取值范围"],
      ["c25-function-representation", "函数的表格、图像与解析式"],
      ["c25-direct-proportion", "正比例函数图像与性质"],
      ["c25-linear-graph", "一次函数的图像"],
      ["c25-linear-property", "一次函数的性质"],
      ["c25-expression", "用条件确定一次函数解析式"],
      ["c25-intersection", "一次函数与方程（组）、不等式"],
      ["c25-application", "一次函数的实际应用"]
    ])
  },
  {
    id: "n26",
    number: "26",
    term: "八下",
    chapter: 26,
    title: "反比例函数",
    subtitle: "反比例函数的概念、图像、性质与应用",
    color: "#d88642",
    skills: blankSkills([
      ["c26-concept", "反比例函数的概念"],
      ["c26-expression", "确定反比例函数解析式"],
      ["c26-graph", "反比例函数的图像"],
      ["c26-property", "反比例函数的性质"],
      ["c26-area", "反比例函数图像中的面积问题"],
      ["c26-linear-combined", "反比例函数与一次函数综合"],
      ["c26-application", "反比例函数的实际应用"]
    ])
  },
  {
    id: "n27",
    number: "27",
    term: "九上",
    chapter: 27,
    title: "二次函数",
    subtitle: "二次函数的图像、性质、解析式及应用",
    color: "#7769ad",
    skills: blankSkills([
      ["c27-concept", "二次函数的概念"],
      ["c27-basic-parabola", "最基本的抛物线"],
      ["c27-transform", "抛物线的平移与顶点式"],
      ["c27-graph-property", "二次函数的图像与性质"],
      ["c27-expression", "确定二次函数解析式"],
      ["c27-equation", "二次函数与一元二次方程"],
      ["c27-inequality", "利用图像解决不等式"],
      ["c27-extreme", "二次函数的最值"],
      ["c27-application", "二次函数的实际应用"]
    ])
  },
  {
    id: "n28",
    number: "28",
    term: "九上",
    chapter: 28,
    title: "相似三角形",
    subtitle: "成比例线段、相似判定、性质与应用",
    color: "#4f82a1",
    skills: blankSkills([
      ["c28-ratio-segment", "成比例线段"],
      ["c28-parallel-proportion", "平行线分线段成比例"],
      ["c28-similar-concept", "相似三角形及相似比"],
      ["c28-aa", "相似三角形判定：两角对应相等"],
      ["c28-sas", "相似三角形判定：两边成比例且夹角相等"],
      ["c28-sss", "相似三角形判定：三边成比例"],
      ["c28-property", "相似三角形的周长、面积等性质"],
      ["c28-proof", "相似三角形的证明与计算"],
      ["c28-application", "相似三角形的实际应用"]
    ])
  },
  {
    id: "n29",
    number: "29",
    term: "九上",
    chapter: 29,
    title: "解直角三角形",
    subtitle: "锐角三角比、解直角三角形及实际应用",
    color: "#bd6a62",
    skills: blankSkills([
      ["c29-trig-ratio", "锐角的正弦、余弦和正切"],
      ["c29-special-angle", "特殊锐角的三角比"],
      ["c29-calculator", "用计算工具求三角比与角"],
      ["c29-solve-right", "解直角三角形"],
      ["c29-elevation", "仰角、俯角问题"],
      ["c29-direction-slope", "方向角、坡度与坡角问题"],
      ["c29-model", "构造直角三角形解决实际问题"]
    ])
  },
  {
    id: "n30",
    number: "30",
    term: "九上",
    chapter: 30,
    title: "投影与视图",
    subtitle: "投影、三视图与立体模型制作",
    color: "#5f7194",
    skills: blankSkills([
      ["c30-projection", "平行投影与中心投影"],
      ["c30-orthographic", "正投影"],
      ["c30-three-views", "简单几何体的三视图"],
      ["c30-reconstruct", "由三视图想象立体图形"],
      ["c30-model", "根据三视图制作立体模型"]
    ])
  },
  {
    id: "n31",
    number: "31",
    term: "九下",
    chapter: 31,
    provisional: true,
    title: "圆",
    subtitle: "圆的基本性质、直线与圆、多边形与圆",
    color: "#3c807d",
    skills: blankSkills([
      ["c31-circle-property", "圆的对称性与基本性质"],
      ["c31-arc-chord-angle", "弧、弦、圆心角之间的关系"],
      ["c31-inscribed-angle", "圆周角及其性质"],
      ["c31-point-circle", "点与圆的位置关系"],
      ["c31-line-circle", "直线与圆的位置关系"],
      ["c31-tangent", "切线的性质与判定"],
      ["c31-polygon-circle", "三角形、四边形与圆"],
      ["c31-regular-polygon", "正多边形与圆"],
      ["c31-circle-comprehensive", "圆的综合计算与证明"]
    ])
  },
  {
    id: "n32",
    number: "32",
    term: "九下",
    chapter: 32,
    provisional: true,
    title: "抽样与数据分析",
    subtitle: "抽样调查、数据的集中趋势与离散程度",
    color: "#d88642",
    skills: blankSkills([
      ["c32-population-sample", "总体、个体、样本与样本容量"],
      ["c32-sampling", "抽样调查与简单随机抽样"],
      ["c32-sample-estimate", "用样本估计总体"],
      ["c32-mean", "平均数与加权平均数"],
      ["c32-median-mode", "中位数与众数"],
      ["c32-range-variance", "极差、方差与数据离散程度"],
      ["c32-data-decision", "选择统计量并作出数据判断"]
    ])
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
