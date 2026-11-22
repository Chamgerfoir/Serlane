/*
 * 石径松轩 · 「颂」账号配置
 *
 * 每个账号对应一个 DeepSeek API Key。可添加多个账号：
 *
 * {
 *   username: "your-name",
 *   password: "your-password",
 *   apiKey: "sk-xxxxxxxxxxxxxxxx",
 *   model: "deepseek-flash",
 *   systemPrompt: "你可以使用 Markdown 和 LaTeX 来组织回答。"
 * }
 *
 * 注意：这是纯前端页面，任何能打开网站的人都能读取这里的账号密码与 API Key。
 * 当前按自用场景配置；如果要开放给他人使用，应改为服务端代理。
 */
window.SERLANE_ACCOUNTS = [
  {
    username: "SerlingX",
    password: "SerlingX8928",
    apiKey: "sk-84ba10717af745caa7679985175d1ebf",
    model: "deepseek-flash",
    systemPrompt: "你可以使用 Markdown 和 LaTeX 来组织回答。"
  }
];
