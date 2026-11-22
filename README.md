# 石径松轩 · Serlane

纯静态的个人起始页：收藏网站、邀请码点对点传输、Base64、DeepSeek 对话。

## 页面

- **首页**：网页跳转与收藏。点击左上角站名返回首页。
- **识**：点对点文件与文字传输。
- **静**：UTF-8 Base64 编码/解码。
- **颂**：全屏 DeepSeek 对话，支持 Markdown、LaTeX、联网搜索、思考链和历史对话。
- **翾**：独立的网页跳转与收藏页。

顶栏为「识 / 静 / 颂 / 翾」四个分页；网页跳转和收藏同时保留在首页与「翾」页。

## 颂：对话

「颂」占据顶栏以下整个页面，不使用卡片式聊天窗。

### 登录与账号

支持两种账号来源：

1. **配置账号**：写在 `chat-accounts.js` 中，用账号密码登录。
2. **本地账号**：在「API Key」页填写本地账号名、密码、自己的 DeepSeek API Key，可选填自定义提示词。账号只保存在本机浏览器，并作为普通账号统一管理。

登录后，账号、密码和 API Key 保存在本机浏览器，刷新后自动登录。退出后也可以在「账号密码」页用本地账号名和密码重新登录，或从抽屉里直接选择已保存账号。

左侧抽屉包含两条：

- **历史对话**：查看、删除、清空当前账号的历史对话；点击任意记录即可继续聊。
- **账号**：查看当前账号、切换已保存账号、删除单条账号数据、退出登录，或二次确认后清除全部本机账号、密码和 API Key。

历史对话按账号分别保存在本机浏览器。

### Markdown、LaTeX 与思考链

- AI 回答支持常用 Markdown：标题、列表、表格、引用、代码块、链接等。
- 数学公式使用本地 KaTeX 渲染，支持 `$...$`、`$$...$$`、`\(...\)`、`\[...\]`。
- 开启「思考」后，DeepSeek 返回的思考链会实时显示在 Markdown 引用框中，并随历史对话一并保存。
- 系统提示词只说明可以使用 Markdown 和 LaTeX，不赋予固定 AI 身份。使用自己的 API Key 时可以填写自定义提示词。

### 联网来源

- 开启「联网」时声明 `deepseek_web_search` 和 `deepseek_read_url`。
- 回答下方会列出搜索/访问到的网页。
- 点击来源会将网址带到「翾」页的地址框，再选择「新标签页 / 内嵌浏览 / 当前页」三种方式之一打开。

### 接口

- 默认模型：`deepseek-flash`。
- 思考模式使用 `thinking: { type: "enabled" }`。
- 浏览器直接请求 DeepSeek `chat/completions`，不经过自建后端。

DeepSeek 文档：

- <https://api-docs.deepseek.com/zh-cn/api/create-chat-completion>
- <https://api-docs.deepseek.com/zh-cn/guides/web_tools>

## 识：传输

传输使用 WebRTC DataChannel，PeerJS 只用于连接握手；连接建立后数据直接在两台设备之间传输。

- 通过邀请码加入房间，不使用分享 URL。
- 支持文字、多个文件、文件夹和 ZIP 打包下载。
- 每条文字消息都有复制按钮，不设额外字数上限。
- 首次连接需要联网访问 PeerJS 公共信令服务；没有配置 TURN 中继。

## 本地预览

```bash
cd nav
python3 -m http.server 4173 --bind 0.0.0.0
```

打开 `http://127.0.0.1:4173`。

## 在线地址

<https://chamgerfoir.github.io/Serlane/>

## 文件

```text
index.html              页面结构
styles.css              样式
app.js                  分页、收藏、传输、账号、历史与 DeepSeek 对话
chat-accounts.js        账号、密码与 API Key 配置
vendor/katex/           本地 KaTeX 渲染器与字体（MIT）
peerjs.min.js           P2P 客户端（按需加载）
LICENSE-PeerJS.txt      PeerJS MIT 许可
.nojekyll               关闭 GitHub Pages 的 Jekyll 处理
```

> 这是纯前端账号方案，页面配置文件与浏览器本地存储中的密码、API Key 都可被读取。当前按自用场景部署；若要开放给其他人使用，应改为服务端代理。
