# 石径松轩 · Serlane

纯静态的个人起始页：收藏网站、邀请码点对点传输、Base64、DeepSeek 对话。

## 页面

- **首页**：网页跳转与收藏。点击左上角站名返回首页。
- **识**：点对点文件与文字传输。创建房间后把邀请码发给另一端，另一端输入邀请码加入。
- **静**：UTF-8 Base64 编码/解码。
- **颂**：账号登录或手动填入 API Key 后与 DeepSeek 对话，支持联网搜索、读取链接和深度思考。
- **翾**：独立的网页跳转与收藏页。

顶栏为「识 / 静 / 颂 / 翾」四个分页；网页跳转和收藏同时保留在首页与「翾」页。

## 本地预览

```bash
cd nav
python3 -m http.server 4173 --bind 0.0.0.0
```

打开 `http://127.0.0.1:4173`。

## 识：传输

传输使用 WebRTC DataChannel，PeerJS 只用于连接握手；连接建立后数据直接在两台设备之间传输，不需要部署后端。

- 房间用邀请码加入，不使用分享 URL。
- 支持文字、多个文件、文件夹和 ZIP 打包下载。
- 每条文字消息都有复制按钮，不设额外字数上限；实际上限取决于浏览器内存与连接状况。
- 双方页面需要保持打开；首次连接需要联网访问 PeerJS 公共信令服务。
- 没有 TURN 中继，严格限制 WebRTC 的网络可能无法直连。

## 颂：AI 对话

支持两种进入方式：

1. **账号密码**：账号配置在 `chat-accounts.js` 中，每个账号对应一个 API Key。
2. **自己的 API Key**：在登录面板切到「API Key」，粘贴任意 DeepSeek API Key 使用。

登录后账号、密码、API Key 会保存在本机浏览器，刷新后自动登录，不需要再次输入。

「账号」或「管理本机账号与 Key」可以打开本机账号数据：

- 查看已保存的账号和导入的 API Key（Key 会打码显示）。
- 使用或删除某一条数据。
- 退出当前登录（保留本机记录）。
- 清除全部本机账号、密码和 API Key 数据。

对话直接请求 DeepSeek `chat/completions`：

- 默认模型 `deepseek-flash`。
- 「联网」开启时声明 `deepseek_web_search` 和 `deepseek_read_url`，由 DeepSeek 服务端完成联网搜索、链接阅读，并在回答下展示来源。
- 「思考」开启时传入 `thinking: {type: "enabled"}`。
- 聊天内容不写入本地存储；登录态与账号数据保留。

账号配置示例：

```js
window.SERLANE_ACCOUNTS = [
  {
    username: "your-name",
    password: "your-password",
    apiKey: "sk-xxxxxxxxxxxxxxxx",
    model: "deepseek-flash",
    systemPrompt: "你是石径松轩的 AI 助手。"
  }
];
```

当前 `chat-accounts.js` 已按用户提供的账号配置，并补了非空系统提示词。

> 这是纯前端账号方案，页面源码与浏览器本地存储中的密码、API Key 都可被读取。当前按自用场景部署；若要开放给他人使用，应改为服务端代理。

DeepSeek 文档：

- <https://api-docs.deepseek.com/zh-cn/api/create-chat-completion>
- <https://api-docs.deepseek.com/zh-cn/guides/web_tools>

## 在线地址

<https://chamgerfoir.github.io/Serlane/>

## 文件

```text
index.html            页面结构
styles.css            样式
app.js                分页、收藏、传输、Base64、账号管理与聊天
chat-accounts.js      账号、密码与 API Key 配置
peerjs.min.js         P2P 客户端（按需加载）
LICENSE-PeerJS.txt    PeerJS MIT 许可
.nojekyll             关闭 GitHub Pages 的 Jekyll 处理
```
