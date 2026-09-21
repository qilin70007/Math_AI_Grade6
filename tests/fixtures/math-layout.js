// Synthetic, read-only fixture for visual checks with the production styles and renderer.
import { renderMathText } from "../../js/math.js";

document.querySelector("#fraction").innerHTML = renderMathText(String.raw`$\frac{3}{5}$ 与 $\frac{2}{3}$`);
document.querySelector("#root").innerHTML = renderMathText(String.raw`再看一个根式：$\sqrt{9}=3$。嵌套分数：$\frac{1}{\frac{2}{3}}=\frac{3}{2}$。`);
document.querySelector("#long").innerHTML = renderMathText(String.raw`$$\frac{1}{2}+\frac{1}{3}+\frac{1}{4}+\frac{1}{5}+\frac{1}{6}+\frac{1}{7}+\frac{1}{8}+\frac{1}{9}+\frac{1}{10}+\frac{1}{11}$$`);
for (const text of [String.raw`$\frac{2}{3}$大，因为分母小分子大`, String.raw`$\frac{3}{5}$大，因为分子是3`, "我不确定，想换种方法比较"]) {
  const button = document.createElement("button");
  button.className = "suggestion-chip";
  button.innerHTML = renderMathText(text);
  document.querySelector("#suggestions").append(button);
}
if (!location.search) {
  document.querySelector("#mobile-preview").hidden = false;
  document.querySelector("iframe").src = "?mobile";
}
else document.querySelector("#mobile-preview").remove();
