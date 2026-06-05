# Flamingo

Flamingo 是一个基于 Manifest V3 的 Chrome 代理 / 网络请求改写扩展，使用 Chrome 的 `declarativeNetRequest` 能力，提供可视化的规则（Rule）与规则组（Group）管理界面，支持重定向、修改请求/响应头、拦截请求，并内置 Monaco JSON 编辑器进行高级编辑。


https://chrome.google.com/webstore/devconsole/2c9cd477-df87-4544-84f2-eae6a49ed026


## 功能特性

- **规则与规则组管理**：在左侧栏增删改查规则和规则组，支持启用/禁用。
- **两种编辑模式**：紧凑表单模式（CompactEditor）和 Monaco JSON 详细模式（DetailEditor）。
- **请求改写**：支持 `redirect`、`modifyHeaders`、`block` 等动作。
- **匹配记录**：查看最近一段时间内命中的规则及对应标签页。
- **本地持久化**：所有规则通过 `chrome.storage.local` 保存。
- **一键开关**：通过图标状态切换扩展整体生效与否。

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
- `src/utils/storage`：基于内存版 `chrome.storage` mock 的规则 / 规则组 / 选中态的增删改查。

## 图标

`images/flamingo.png` 是高分辨率主图标，构建时不会被打包。其余尺寸（`flamingo_16/48/128.png` 以及关闭态灰度版 `flamingo_grey_16/48/128.png`）由它生成，可用 ImageMagick 重新生成：

```bash
cd images
magick flamingo.png -resize 16x16  flamingo_16.png
magick flamingo.png -resize 48x48  flamingo_48.png
magick flamingo.png -resize 128x128 flamingo_128.png
magick flamingo.png -resize 16x16  -colorspace Gray flamingo_grey_16.png
magick flamingo.png -resize 48x48  -colorspace Gray flamingo_grey_48.png
magick flamingo.png -resize 128x128 -colorspace Gray flamingo_grey_128.png
```

## 持续集成与发布

- `.github/workflows/ci.yml`：在 `push` 与 `pull_request` 时执行类型检查、Lint、测试、构建，并上传构建产物。
- `.github/workflows/deploy.yml`：推送到 `main` 时自动构建、按 `github.run_number` 递增 patch 版本号、打包并发布到 Chrome Web Store。
- `.github/workflows/release.yml`：推送 `v*` 形式的 tag 时，自动构建、打包为 zip 并创建 GitHub Release。

### 配置自动部署所需的 Secrets

在 GitHub 仓库 `Settings → Secrets and variables → Actions` 中配置：

| Secret | 说明 |
| --- | --- |
| `CHROME_EXTENSION_ID` | Chrome Web Store 中的扩展 ID |
| `CHROME_CLIENT_ID` | Google Cloud OAuth 客户端 ID |
| `CHROME_CLIENT_SECRET` | Google Cloud OAuth 客户端密钥 |
| `CHROME_REFRESH_TOKEN` | 用于 Chrome Web Store API 的刷新令牌 |

> 首次发布需要先在 Chrome Web Store 开发者后台手动创建扩展条目，拿到 `CHROME_EXTENSION_ID` 后，后续推送到 `main` 即可自动更新发布。

发布正式版本（GitHub Release）示例：

```bash
git tag v1.0.1
git push origin v1.0.1
```

## 许可证

ISC
