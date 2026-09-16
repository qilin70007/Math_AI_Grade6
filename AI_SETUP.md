# 开启开放式 AI 课堂与拍照识题

网页仍部署在 GitHub Pages；模型请求经 Cloudflare Worker 转发。这样 `OPENAI_API_KEY` 只存在服务端，不会出现在浏览器代码、GitHub Pages 或学习备份中。

## 准备

1. 在 [OpenAI API Keys](https://platform.openai.com/api-keys) 创建 API Key，并确认 API 账户可正常计费。
2. 注册或登录 [Cloudflare](https://dash.cloudflare.com/)。个人使用可先从 Workers 免费额度开始。
3. 电脑安装 Node.js 20 或更高版本，并下载本仓库。

## 一次性部署

在仓库目录执行：

```bash
cd worker
npm install
npx wrangler login
npm run deploy
npx wrangler secret put OPENAI_API_KEY
```

最后一条命令会提示输入密钥。直接粘贴 API Key；不要把密钥写进 `wrangler.toml`，也不要提交到 GitHub。

部署完成后会得到类似下面的地址：

```text
https://math-ai-tutor-api.<你的 Cloudflare 子域>.workers.dev
```

可先打开 `<服务地址>/health`。正常结果应包含：

```json
{ "ok": true, "configured": true }
```

## 在数芽里连接

1. 打开 [数芽](https://qilin70007.github.io/Math_AI_Grade6/)。
2. 进入“家长”，初始 PIN 为 `2609`。
3. 点击“学习设置”。
4. 将 Worker 地址粘贴到“大模型服务地址”。
5. 点击“测试连接”，看到“连接成功”后再点击“保存设置”。

现在可以：

- 在“知识图”中点任意知识点，选择“用 AI 学这个知识点”；
- 在“错题”中录入照片，点击“识别题目并填写”；
- 在错题详情中点击“AI 讲解这道题”。

## 本地联调

复制 `worker/.dev.vars.example` 为 `worker/.dev.vars`，在本机文件中填入 API Key；`.dev.vars` 已被忽略，不会提交。

```bash
# 终端 1
cd worker
npm install
npm run dev

# 终端 2（仓库根目录）
npm start
```

本地网页会默认连接 `http://localhost:8787`。

## 可调整项

`worker/wrangler.toml` 中：

- `OPENAI_MODEL`：默认 `gpt-5.6-terra`；可换成账户可用且支持图片输入、结构化输出的模型。
- `ALLOWED_ORIGINS`：允许访问接口的网页来源。若以后换域名，需要把新域名加入逗号分隔列表。

## 隐私与费用

- 前端不会发送学生称呼、学校或家长 PIN；服务端也会再次按白名单清理上下文。
- 图片会在浏览器压缩后发送给模型识别。拍照时应先避开或裁掉姓名、班级、学校和考号。
- 模型请求设置为 `store: false`，错题原图仍只保存在当前设备的 IndexedDB 中。
- AI 识别可能出错，题干、符号、答案、错因和知识点都必须由家长或学生核对后再保存。
- OpenAI API 按实际用量计费；Cloudflare Worker 是否收费取决于账户套餐和调用量。
