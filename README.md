# MoodListener

MoodListener 是一个以本地优先为核心的情绪记录应用。它帮助用户更轻地记下当下状态、回看历史变化，并在不依赖云端账户的前提下保留自己的记录。

当前版本：`1.3.1`

## 产品定位

- 面向日常情绪记录，而不是复杂的长篇日记工具。
- 默认使用本地存储，数据不会主动上传到云端。
- 强调低门槛输入，打开首页就能直接选择情绪开始记录。
- 通过历史、日历和统计页帮助用户慢慢看见自己的节奏。

## 这版重点

- 首页把“你感觉怎么样”提升为主入口，可以直接选择情绪并进入记录。
- 默认主题切换为 `forest`，整体视觉更稳定。
- 情绪库扩充为更细的默认集合，并对老用户自动补齐。
- 设置页恢复流程降风险，减少压迫感和误触成本。
- 历史页卡片重新整理信息层级，优先展示日期、情绪、时间和活动。

## 主要功能

- 情绪记录：支持 1 到 5 分情绪选择、快速笔记、完整补充、活动和地点。
- 首页快捷进入：直接从首页选择情绪，带着预设状态进入记录流程。
- 历史回顾：按时间查看记录，支持搜索和情绪筛选。
- 日历视图：按日期浏览每天的记录分布。
- 统计分析：查看最近趋势、分布和每周洞察。
- 数据管理：支持普通导出和加密备份恢复。
- 个性化设置：支持颜色主题、深色模式、定时提醒和个人资料。

## 技术栈

- React 19
- TypeScript
- Vite
- Capacitor
- SQLite
- Tailwind CSS

## 运行方式

```bash
npm install
npm run dev
npm run build
npx cap sync android
npx cap open android
```

需要环境：`Node.js 18+`

## 项目结构

```text
pages/               页面层
components/          通用组件
services/            业务服务与跨端封装
src/constants/       文案、主题、情绪配置
src/storage/         Web 与 Native 存储实现
android/             Android 原生工程
```

## 数据说明

- Web 端使用本地存储作为持久化方案。
- Native 端使用 SQLite 保存记录、活动、设置和个人资料。
- 加密备份为本地文件，恢复时需要口令。

## 截图

| 首页 | 记录 | 历史 |
|:---:|:---:|:---:|
| ![首页](screenshots/home.png) | ![记录](screenshots/record.png) | ![历史](screenshots/timeline.png) |

| 日历 | 统计 | 设置 |
|:---:|:---:|:---:|
| ![日历](screenshots/calendar.png) | ![统计](screenshots/stats.png) | ![设置](screenshots/settings.png) |

## License

MIT
