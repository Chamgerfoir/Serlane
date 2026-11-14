# 石径松轩 · Serlane

轻量的网址导航、点对点文件与文字传输、Base64 转换。纯静态站点，不需要部署任何传输后端。

## 本地预览

```bash
cd nav
python3 -m http.server 4173 --bind 0.0.0.0
```

打开 `http://127.0.0.1:4173`；同一局域网内的其他设备使用本机局域网 IP，例如 `http://192.168.x.x:4173`。

## 功能

- **收藏**：添加、编辑、删除站点，删除后可撤销；数据保存在浏览器 `localStorage`（`dukou.state.v1`）。
- **新标签页**：站点卡片和网址输入框使用原生 `<a target="_blank">`，不会在当前页重定向。
- **内嵌与跳转**：每张站点卡片和输入框都提供内嵌 iframe、当前页跳转、新标签页三种打开方式。
- **文件与文字**：两端建立 WebRTC 直连后，可以互发文字、文件或整个文件夹。
- **文字直传**：消息直接进入对话气泡，可一键复制，不生成 txt 文件，也不经过服务器。
- **文件夹保留路径**：接收端可逐个下载，也可打包为 ZIP 下载并保留目录结构。
- **Base64**：UTF-8 编码与解码，支持中文、Emoji、URL-safe Base64。

## 传输实现

传输采用 WebRTC DataChannel 点对点直连。为了让两端能够找到彼此，页面使用本地引入的 [PeerJS](https://peerjs.com/) 客户端和 PeerJS 公共信令服务完成握手；握手完成后，文字与文件数据直接在浏览器之间传输，不经过信令服务器，也不需要部署自己的服务器。思路与 [LocSend](https://www.locsend.com/) 的在线 WebRTC 传输方式一致。

使用注意：

- 双方页面需要保持打开；关闭页面会断开连接。
- 首次建立连接需要联网访问信令服务。局域网内的实际数据会尝试直连，速度取决于本地网络。
- 当前没有配置 TURN 中继。少数严格 NAT 或限制 WebRTC 的网络可能无法建立直连；同一 Wi-Fi 下通常没有问题。
- 文字消息与传输记录不会写入本地存储，刷新或离开房间后消失。收到的文件也只在当前页面内存在，请及时下载。
- 文件与文字内容不经过本项目的任何后端。PeerJS 公共信令只能看到建立连接所需的会话信息。
- 文件夹选择依赖浏览器的 `webkitdirectory` 支持；Chrome / Edge 支持较好，也可以直接把文件夹拖进文件区域。

## 文件结构

```text
index.html          页面结构
styles.css          页面样式
app.js              全部前端逻辑
peerjs.min.js       本地引入的 PeerJS 客户端
LICENSE-PeerJS.txt  PeerJS 的 MIT 许可证
.nojekyll           关闭 GitHub Pages 的 Jekyll 处理
```

## 部署到 GitHub Pages

仓库：<https://github.com/Chamgerfoir/Serlane>

1. 将以上文件推送到仓库 `main` 分支根目录。
2. 打开仓库 **Settings → Pages**。
3. **Build and deployment** 选择 **Deploy from a branch**。
4. 分支选择 `main`，目录选择 `/ (root)`，保存。
5. 等待构建完成，访问 `https://chamgerfoir.github.io/Serlane/`。

所有资源均使用相对路径，部署在仓库子路径下也能正常工作。传输功能在 GitHub Pages 上同样可用，因为它只依赖浏览器 WebRTC 和公共信令服务，不依赖 Node 或自建后端。
