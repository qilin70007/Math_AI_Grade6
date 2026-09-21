# 开启多模型 AI 课堂与拍照识题

数芽默认使用 DeepSeek 同时完成文字教学和拍照识题，只需一个 DeepSeek API Key。也可以在家长设置中分别选择其他厂商的“AI 教学模型”和“拍照识题模型”。网页仍部署在 GitHub Pages，所有厂商的 API Key 只保存在 Cloudflare Worker；密钥不会进入浏览器、GitHub Pages 或学习数据备份。

当前内置以下入口（`HY` 按腾讯混元实现）：

| 提供商 | AI教学 | 拍照识题 | 默认模型 | 服务端密钥名 |
|---|---|---|---|---|
| OpenAI | 支持 | 支持 | `gpt-5.6-terra` | `OPENAI_API_KEY` |
| DeepSeek | 支持 | 支持 | `deepseek-flash` | `DEEPSEEK_API_KEY` |
| Kimi | 支持 | 支持 | `kimi-k3` | `KIMI_API_KEY` |
| 智谱 GLM | 支持 | 支持 | `glm-5.3-flash` | `GLM_API_KEY` |
| 腾讯混元 | 支持 | 支持 | `hunyuan-turbos-latest` / `hunyuan-turbos-vision` | `HUNYUAN_API_KEY` |

DeepSeek 官方已提供支持图片输入的 `deepseek-flash`，默认教学和拍照识题都使用它。不要将只支持文字的模型名填写为 `DEEPSEEK_VISION_MODEL`；更改视觉模型前需确认当前账户的实际模型权限。参考 [DeepSeek Vision 文档](https://api-docs.deepseek.com/guides/vision)和[文件 API 使用示例](https://api-docs.deepseek.com/guides/files_api/)。

模型与接口会更新，仓库中的名称均可在 `worker/wrangler.toml` 中修改。可参考各厂商官方文档：[OpenAI](https://platform.openai.com/docs)、[DeepSeek](https://api-docs.deepseek.com/)、[Kimi](https://platform.kimi.ai/docs/overview)、[智谱 GLM](https://docs.bigmodel.cn/cn/guide/start/introduction)、[腾讯混元](https://cloud.tencent.com/document/product/1729/111007)。

## 一、首次部署 Worker

准备好 Cloudflare 账户和 DeepSeek API Key（只有网页版 DeepSeek 账号、没有 API Key 时仍需在 DeepSeek API 平台创建密钥）。在仓库目录打开终端：

```bash
cd worker
npm install
npx wrangler login
npm run deploy
```

部署后会得到类似地址：

```text
https://math-ai-tutor-api.<你的 Cloudflare 子域>.workers.dev
```

## 二、在 Worker 中配置 DeepSeek API Key

只需执行一次：

```bash
npx wrangler secret put DEEPSEEK_API_KEY
```

命令会提示你在自己的终端粘贴密钥；不要将密钥发到聊天窗口，不要把它写入 `wrangler.toml`、网页设置或 GitHub 仓库。若还使用其他厂商，可以分别添加：

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put KIMI_API_KEY
npx wrangler secret put GLM_API_KEY
npx wrangler secret put HUNYUAN_API_KEY
```

添加完成后可打开 `<Worker地址>/health`。`providers` 应显示 DeepSeek 已配置且支持 `tutor` 和 `ocr`，`defaults` 两项均为 DeepSeek。健康检查只能确认密钥已存入 Worker，真正的密钥有效性和模型权限还需在课堂及拍照识题各实际调用一次验证。

## 三、在数芽中选择模型

1. 打开[数芽](https://qilin70007.github.io/Math_AI_Grade6/)。
2. 进入“家长”，初始 PIN 为 `2609`。
3. 点击“学习设置”。
4. 填入 Worker 地址。
5. “AI教学模型”和“拍照识题模型”默认都是 DeepSeek；如之前改过选择，在这里分别改回 DeepSeek。
6. 点击“测试连接”，确认两个用途都显示 DeepSeek，再点击“保存设置”。
7. 从知识图选一个知识点开启 AI 课堂，并用一张裁掉身份信息的练习题照片测试识题。两次真实调用成功后，配置才算验证完成。

可以组合使用，例如：

- DeepSeek 负责文字教学，Kimi 负责拍照识题；
- Kimi 同时负责教学和 OCR；
- GLM 负责教学，腾讯混元负责 OCR；
- 选择“自动选择”，由服务端从已配置且支持该能力的模型中选择。

## 四、修改默认模型或接口地址

常用模型名在 `worker/wrangler.toml` 中：

```toml
DEFAULT_TUTOR_PROVIDER = "deepseek"
DEFAULT_OCR_PROVIDER = "deepseek"
OPENAI_MODEL = "gpt-5.6-terra"
DEEPSEEK_MODEL = "deepseek-flash"
DEEPSEEK_VISION_MODEL = "deepseek-flash"
KIMI_MODEL = "kimi-k3"
GLM_MODEL = "glm-5.3-flash"
HUNYUAN_MODEL = "hunyuan-turbos-latest"
HUNYUAN_VISION_MODEL = "hunyuan-turbos-vision"
```

修改后重新执行：

```bash
npm run deploy
```

如需覆盖默认 API 地址，可在 `[vars]` 中增加对应变量：`OPENAI_BASE_URL`、`DEEPSEEK_BASE_URL`、`KIMI_BASE_URL`、`GLM_BASE_URL` 或 `HUNYUAN_BASE_URL`。例如使用中国大陆版 Moonshot 账户时，可按该账户控制台说明设置 `KIMI_BASE_URL`；不要混用不同站点签发的密钥和接口地址。

## 五、已有 Worker 如何更新（修复回复格式错误）

GitHub Pages 更新只会更新网页，已经部署的 Worker 不会随仓库提交自动更新。在电脑上打开终端，进入之前下载的 `Math_AI_Grade6` 仓库根目录，依次执行：

```bash
git pull --ff-only
cd worker
npm install
npm run deploy
```

如果之前下载的是 ZIP、没有使用 Git，请从仓库绿色 **Code → Download ZIP** 重新下载最新代码并解压，在新文件夹的 `worker` 目录打开终端，执行 `npm install` 和 `npm run deploy`。若提示未登录，再执行 `npx wrangler login`，随后重新部署。

使用原来的 Cloudflare 账户和 Worker 名称 `math-ai-tutor-api`；现有 `DEEPSEEK_API_KEY` Secret 会保留，无需重填密钥。更新后打开 `<Worker地址>/health`，应看到 `version: "2026-09-21.1"`（或更新版本）。回到课堂点击“重试本轮”，已有作答会保留。

这次更新包含：

- DeepSeek 明确使用 `thinking: {type: "disabled"}`，增加输出额度，避免思考过程占用额度后截断 JSON；配置依据见 [DeepSeek 思考模式](https://api-docs.deepseek.com/guides/thinking_mode/)。
- 兼容公式反斜杠转义、JSON 代码块和尾逗号；不能修复的格式、空回复或截断，在同一厂商最多自动重试一次。不会跨厂商发送，也不会无限重试。参见 [DeepSeek JSON 输出说明](https://api-docs.deepseek.com/guides/json_mode/)。
- 单次模型请求最多等待 30 秒；密钥、余额、频率及网络错误会显示对应原因。
- `/health` 只说明配置和版本；没有实际 API Key 的自动测试使用模拟响应，不能代替真实课堂调用。

## 六、“换国内的”需要区分两层

课堂显示 **DeepSeek** 时已经在调用 DeepSeek 官方 API，换模型不是修复 JSON 格式错误的前提。当前网站由 GitHub Pages 承载，中转服务由 Cloudflare Worker 承载；这与模型提供商是两回事。

如果更新后仍是超时或“无法连接”，需分别检查网页、Worker 和 DeepSeek 的连通性。也可以将网页和中转服务迁到你拥有的国内托管环境，再在家长设置中填写新的服务地址；API Key 仍须留在服务端。当前仓库的 Worker 部署命令只适用于 Cloudflare，迁往其他平台需适配部署方式，不能仅把 URL 改成另一个厂商域名。

## 七、本地联调

复制 `worker/.dev.vars.example` 为 `worker/.dev.vars`，只填写本次要测试的密钥；`.dev.vars` 已被 Git 忽略。

```bash
# 终端 1
cd worker
npm install
npm run dev

# 终端 2（仓库根目录）
npm start
```

本地网页会默认连接 `http://localhost:8787`。

## 隐私与费用

- 前端不会发送学生称呼、学校或家长 PIN；服务端还会再次按白名单清理上下文。
- 图片会在浏览器压缩后发送给家长所选的 OCR 模型。拍照时仍应裁掉姓名、学校、班级和考号。
- OpenAI 请求设置为 `store: false`；其他厂商的数据保留与训练政策以各自账户条款为准。
- OCR 结果必须人工核对后才入库，数学答案不能只依赖模型判断。
- 每个厂商独立计费、限速；“自动选择”不会跨厂商同时重复调用。
