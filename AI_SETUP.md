# 开启多模型 AI 课堂与拍照识题

数芽支持在家长设置中分别选择“AI 教学模型”和“拍照识题模型”。网页仍部署在 GitHub Pages，所有厂商的 API Key 只保存在 Cloudflare Worker；密钥不会进入浏览器、GitHub Pages 或学习数据备份。

当前内置以下入口（`HY` 按腾讯混元实现）：

| 提供商 | AI教学 | 拍照识题 | 默认模型 | 服务端密钥名 |
|---|---|---|---|---|
| OpenAI | 支持 | 支持 | `gpt-5.6-terra` | `OPENAI_API_KEY` |
| DeepSeek | 支持 | 默认不开放 | `deepseek-chat` | `DEEPSEEK_API_KEY` |
| Kimi | 支持 | 支持 | `kimi-k3` | `KIMI_API_KEY` |
| 智谱 GLM | 支持 | 支持 | `glm-5.3-flash` | `GLM_API_KEY` |
| 腾讯混元 | 支持 | 支持 | `hunyuan-turbos-latest` / `hunyuan-turbos-vision` | `HUNYUAN_API_KEY` |

DeepSeek 默认入口只用于文字教学。若其官方账户以后提供可用的视觉模型，可在 Worker 中另设 `DEEPSEEK_VISION_MODEL` 后再用于 OCR；未配置时，数芽会明确提示，不会把图片误发给文字模型。

模型与接口会更新，仓库中的名称均可在 `worker/wrangler.toml` 中修改。可参考各厂商官方文档：[OpenAI](https://platform.openai.com/docs)、[DeepSeek](https://api-docs.deepseek.com/)、[Kimi](https://platform.kimi.ai/docs/overview)、[智谱 GLM](https://docs.bigmodel.cn/cn/guide/start/introduction)、[腾讯混元](https://cloud.tencent.com/document/product/1729/111007)。

## 一、首次部署 Worker

准备好 Cloudflare 账户和至少一个厂商的 API Key。在仓库目录打开终端：

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

## 二、添加你准备使用的模型密钥

只执行需要的厂商，不必五个全部配置。例如只使用 Kimi：

```bash
npx wrangler secret put KIMI_API_KEY
```

同时配置 DeepSeek、GLM 和混元：

```bash
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put GLM_API_KEY
npx wrangler secret put HUNYUAN_API_KEY
```

使用 OpenAI：

```bash
npx wrangler secret put OPENAI_API_KEY
```

每条命令都会提示粘贴对应密钥。密钥不要写入 `wrangler.toml`、网页设置或 GitHub。添加完成后可打开 `<Worker地址>/health`，返回结果中的 `providers` 会分别显示哪些厂商已配置，以及是否支持 `tutor` 和 `ocr`。

## 三、在数芽中选择模型

1. 打开[数芽](https://qilin70007.github.io/Math_AI_Grade6/)。
2. 进入“家长”，初始 PIN 为 `2609`。
3. 点击“学习设置”。
4. 填入 Worker 地址。
5. 分别选择“AI教学模型”和“拍照识题模型”。也可保留“自动选择”。
6. 点击“测试连接”。看到两个用途都连接成功后，点击“保存设置”。

可以组合使用，例如：

- DeepSeek 负责文字教学，Kimi 负责拍照识题；
- Kimi 同时负责教学和 OCR；
- GLM 负责教学，腾讯混元负责 OCR；
- 选择“自动选择”，由服务端从已配置且支持该能力的模型中选择。

## 四、修改默认模型或接口地址

常用模型名在 `worker/wrangler.toml` 中：

```toml
DEFAULT_TUTOR_PROVIDER = "openai"
DEFAULT_OCR_PROVIDER = "openai"
OPENAI_MODEL = "gpt-5.6-terra"
DEEPSEEK_MODEL = "deepseek-chat"
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

## 五、本地联调

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
