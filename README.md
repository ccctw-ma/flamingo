# Flamingo

Flamingo 是一个基于 Manifest V3 的 Chrome Declarative Net Request 规则编辑器。它只管理用户自己创建的本地规则，支持重定向、拦截请求、修改请求/响应头，并内置 Monaco JSON 编辑器用于高级编辑。

## 功能特性

- **规则管理**：在左侧栏新增、编辑、复制、删除和拖拽排序规则，支持单条规则启用/禁用。
- **两种编辑模式**：紧凑表单模式（CompactEditor）和 Monaco JSON 详细模式（DetailEditor）。
- **请求改写**：支持 `redirect`、`modifyHeaders`、`block` 等动作。
- **本地优先存储**：默认通过 `chrome.storage.local` 保存规则和偏好设置。
- **可选 Chrome Sync**：用户可在设置中切换到 `chrome.storage.sync`，让规则跟随 Chrome 账号同步。
- **中英文界面**：设置面板中支持中文 / English 切换。
- **可配置面板尺寸**：设置后会同步到 popup 首帧尺寸，避免打开时渐进式抖动。
- **一键开关**：通过图标状态切换扩展整体生效与否。

Flamingo 不提供代理服务器、VPN、流量隧道、广告注入、远程规则服务或浏览记录分析；它只应用用户在扩展中创建并启用的 Declarative Net Request 规则。

## 技术栈

- 运行时与工具链：[Bun](https://bun.sh)（包管理、构建、测试一体化，不使用 Webpack / Vite）
- 前端框架：React 18 + TypeScript
- UI 组件：Ant Design 5
- 状态管理：Zustand
- 代码编辑器：Monaco Editor（仅加载 JSON 语言）
- 样式：Tailwind CSS + PostCSS

## 目录结构

```
flamingo/
├── src/
│   ├── background.ts          # Service Worker：监听存储变化并下发动态规则
│   ├── index.tsx              # Popup 入口（React 18 createRoot）
│   ├── index.css              # Tailwind 样式入口
│   ├── components/            # 业务组件（编辑器、列表项、操作栏等）
│   ├── views/                 # 左侧栏 / 右侧栏布局
│   └── utils/                 # 纯函数、存储、状态、类型、常量
├── scripts/build.ts           # 基于 Bun.build 的扩展打包脚本
├── tests/                     # bun test 单元测试
├── .github/workflows/         # CI 与发布工作流
├── manifest.json              # Manifest V3 配置
├── home.html                  # Popup HTML 模板
├── eslint.config.js           # ESLint 扁平配置
└── tsconfig.json
```

## 环境要求

- [Bun](https://bun.sh) 1.3.10 及以上
- Chrome / Chromium 内核浏览器（支持 Manifest V3）

## 开发指南

安装依赖：

```bash
bun install
```

常用脚本：

```bash
bun run dev         # 监听文件变化并增量构建
bun run build       # 类型检查 + 生产构建，产物输出到 build/
bun run typecheck   # TypeScript 类型检查
bun run lint        # ESLint 检查
bun run lint:fix    # ESLint 自动修复
bun run format      # Prettier 格式化
bun test            # 运行单元测试
bun run check       # 一次性执行 typecheck + lint + test
```

## 在 Chrome 中加载

1. 执行 `bun run build` 生成 `build/` 目录。
2. 打开 Chrome，访问 `chrome://extensions`。
3. 打开右上角「开发者模式」。
4. 点击「加载已解压的扩展程序」，选择项目下的 `build/` 目录。

## 测试

测试基于 Bun 内置测试器（`bun test`），位于 `tests/` 目录，覆盖：

- `src/utils`：纯函数（节流、深拷贝、ID 生成、字段过滤等）。
- `src/utils/storage`：基于内存版 `chrome.storage` mock 的规则 / 选中态 / 存储模式的增删改查。

## 图标

`images/flamingo.png` 是高分辨率主图标，构建时不会被打包。其余尺寸（`flamingo_16/32/48/128.png` 以及关闭态灰度版 `flamingo_grey_16/32/48/128.png`）是圆形透明背景图标，用于 Chrome Web Store 和扩展按钮。

```bash
# 图标生成逻辑已在最近版本中使用圆形透明背景处理。
# 如需重生成，请确保输出仍保留 alpha 透明通道，避免白色方角。
```

## 隐私与商店元数据

Chrome Web Store 审核要求扩展的名称、说明、截图、权限和隐私政策必须和实际功能一致。

- 隐私政策页面：[docs/privacy-policy.html](docs/privacy-policy.html)
- 隐私政策 Markdown 备份：[docs/privacy-policy.md](docs/privacy-policy.md)
- Chrome Web Store 元数据建议：[docs/chrome-web-store-listing.md](docs/chrome-web-store-listing.md)

发布前请在 Chrome Web Store Developer Dashboard 的「隐私权政策」专用字段中填写公开可访问的隐私政策 URL，例如：

```text
https://ccctw-ma.github.io/flamingo/privacy-policy.html
```

不要使用 GitHub 仓库首页、GitHub `blob` 页面、需要登录的文档或会跳转的落地页。Chrome Web Store 的「隐私权政策」字段必须直接指向可公开访问的隐私政策页面。

GitHub Pages 发布由 `.github/workflows/pages.yml` 负责。首次使用前需要在 GitHub 仓库 `Settings → Pages` 中确认 Source 选择 **GitHub Actions**，然后手动运行 `Publish Privacy Policy` workflow 或推送 `docs/**` 变更。

## 持续集成与打包

- `.github/workflows/ci.yml`：在 `push` 与 `pull_request` 时执行类型检查、Lint、测试、构建，并上传构建产物。
- `.github/workflows/deploy.yml`：当前仅支持手动触发打包 zip，不会上传或发布到 Chrome Web Store。等商店审核问题确认解决后，再恢复 push 自动部署。
- `.github/workflows/release.yml`：推送 `v*` 形式的 tag 时，自动构建、打包为 zip 并创建 GitHub Release。

本地生成 Chrome Web Store 可上传的 zip：

```bash
bun run package
```

产物为项目根目录下的 `flamingo.zip`。

### 恢复自动部署时需要的 Secrets

在 GitHub 仓库 `Settings → Secrets and variables → Actions` 中配置：

| Secret                 | 说明                                 |
| ---------------------- | ------------------------------------ |
| `CHROME_EXTENSION_ID`  | Chrome Web Store 中的扩展 ID         |
| `CHROME_CLIENT_ID`     | Google Cloud OAuth 客户端 ID         |
| `CHROME_CLIENT_SECRET` | Google Cloud OAuth 客户端密钥        |
| `CHROME_REFRESH_TOKEN` | 用于 Chrome Web Store API 的刷新令牌 |

> 当前审核未通过期间不要恢复自动上传。待商店元数据和隐私政策确认通过后，再把 `.github/workflows/deploy.yml` 恢复为 push 自动部署。

发布正式版本（GitHub Release）示例：

```bash
git tag v1.0.1
git push origin v1.0.1
```

## 许可证

ISC
