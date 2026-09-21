import test from "node:test";
import assert from "node:assert/strict";
import { renderMathText } from "../js/math.js";

test("截图中的分数和快捷回答显示为数学排版且保留中文", () => {
  for (const text of [String.raw`$\frac{3}{5}$ 与 $\frac{2}{3}$`, String.raw`$\frac{2}{3}$大，因为分母小分子大`]) {
    const html = renderMathText(text);
    assert.match(html, /class="katex"/);
    assert.match(html, /<mfrac>/);
    assert.doesNotMatch(html, /math-fallback/);
    assert.match(html, /与|因为分母/);
  }
});

test("行内、独立、嵌套分数、根式和无定界符公式都可排版", () => {
  for (const text of [String.raw`\(\frac{1}{\frac{2}{3}}\)`, String.raw`\[\sqrt{2}+x^2\]`, String.raw`$$x^2+\frac{1}{2}$$`]) {
    assert.match(renderMathText(text), /class="katex"/);
    assert.doesNotMatch(renderMathText(text), /math-fallback/);
  }
  assert.match(renderMathText(String.raw`\frac{1}{2}`, { formula: true }), /<mfrac>/);
  assert.match(renderMathText("$\frac{3}{5}$"), /<mfrac>/); // Legacy form-feed damage.
});

test("无效公式保留原文，普通文字和未闭合的美元符不丢失", () => {
  assert.equal(renderMathText("第一行\n未配对 $5"), "第一行<br />未配对 $5");
  const invalid = renderMathText(String.raw`$\frac{1}$`);
  assert.match(invalid, /math-fallback/);
  assert.ok(invalid.includes(String.raw`\frac{`));
  assert.equal(renderMathText(String.raw`$\frac{$`), String.raw`$\frac{$`);
});

test("模型 HTML 和不可信 TeX 链接、图片、样式不能执行", () => {
  const html = renderMathText(String.raw`<img src=x onerror=alert(1)> $\href{javascript:alert(1)}{点击}$ $\includegraphics{https://example.com/track}$ $\htmlStyle{position:fixed}{x}$`);
  assert.ok(html.includes("&lt;img"));
  assert.doesNotMatch(html, /<img\b|<a\b|style="position:fixed/);
  assert.doesNotMatch(renderMathText(String.raw`$\text{<script>alert(1)</script>}$`), /<script>/);
});
