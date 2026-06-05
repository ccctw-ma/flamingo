# AGENTS.md

本文件为 AI 编码助手（以及人类贡献者）提供在本仓库工作的约定与指引。请在改动代码前通读本文件。

## 项目概览

Flamingo 是一个 Manifest V3 的 Chrome 扩展，基于 `declarativeNetRequest` 实现网络请求的重定向、改写请求/响应头与拦截。前端使用 React 18 + TypeScript + Ant Design，状态管理用 Zustand，JSON 编辑使用 Monaco。

## 工具链约定（重要）

- **统一使用 Bun**：包管理、构建、测试都走 Bun。**禁止**重新引入 Webpack、Vite、Rollup、vitest、jest、npm/pnpm/yarn 锁文件。
- 构建脚本是 `scripts/build.ts`，通过 `Bun.build` 产出，不依赖任何打包器配置文件。
- 测试使用 Bun 内置测试器（`bun:test`），测试文件放在 `tests/` 下，命名为 `*.test.ts`。

## 常用命令

```bash
bun install         # 安装依赖
bun run dev         # 监听构建
bun run build       # typecheck + 生产构建（输出到 build/）
bun run typecheck   # tsc --noEmit
bun run lint        # ESLint
bun run lint:fix    # ESLint 自动修复
bun run format      # Prettier
bun test            # 单元测试
bun run check       # typecheck + lint + test 一把梭
```

提交前请确保 `bun run check` 全部通过。

## 目录结构

- `src/background.ts`：Service Worker，监听 `chrome.storage` 变化并下发动态规则。
- `src/index.tsx`：Popup 入口，使用 `createRoot`。
- `src/components/`：业务组件。`compactEditor` 为表单编辑器，`detailEditor` + `monacoEditor` 为 JSON 编辑器（懒加载）。
- `src/views/`：`LeftBar`（规则列表）、`RightBar`（编辑区）布局。
- `src/utils/`：
  - `index.ts`：纯函数（节流、深拷贝、ID、字段过滤等），**优先在此补单测**。
  - `storage.ts`：封装 `chrome.storage.local` 的 CRUD。
  - `store.ts` / `hooks.ts`：Zustand store 与组合 hooks。
  - `types.ts` / `constants.ts`：类型与常量（含默认规则、Monaco JSON schema）。
- `scripts/build.ts`：构建脚本。
- `tests/`：单元测试。

## 编码规范

- TypeScript `strict` 模式开启，**避免 `any`**；确需放宽时用 `unknown` + 类型守卫。
- 不要在 React 渲染阶段触发 `setState` / `onChange` 等副作用，副作用放进 `useEffect`。
- 列表渲染必须提供稳定 `key`。
- 新增 `chrome.*` 调用时，若涉及可测试逻辑，请在测试中通过注入 `globalThis.chrome` mock 覆盖（参考 `tests/storage.test.ts`）。
- 提交前运行 `bun run format` 保持风格一致。

## 测试约定

- 纯函数：直接导入并断言。
- 依赖 `chrome` API 的模块：在 `import` 被测模块**之前**先在 `globalThis` 上挂载 mock（注意 `constants.ts` 在模块加载时即读取 `chrome.declarativeNetRequest`，mock 需提前提供对应枚举）。
- 测试需可独立运行、无外部网络依赖。

## CI / 发布

- `.github/workflows/ci.yml`：push / PR 触发，执行 typecheck、lint、test、build 并上传产物。
- `.github/workflows/release.yml`：推送 `v*` tag 触发，构建并打包 zip 后创建 GitHub Release。
- 修改命令脚本名时，需同步更新这两个工作流。

## 修改 Manifest / 构建产物时

- `manifest.json` 中的 `background.service_worker` 与 popup 资源路径由 `scripts/build.ts` 在构建时改写，不要手写带 hash 的产物路径。
- `build/` 是构建产物，已被 `.gitignore` 忽略，不要提交。
