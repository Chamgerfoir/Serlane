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
 *   systemPrompt: "你是石径松轩的 AI 助手，回答简洁准确。"
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
    systemPrompt: "你是「颂」，石径松轩中的 AI 助手。回答使用与用户相同的语言，简洁、准确、直接；涉及实时信息时优先联网搜索并附上来源。"
  }
];
