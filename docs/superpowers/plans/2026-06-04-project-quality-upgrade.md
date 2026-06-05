# Project Quality Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Flamingo's project structure by adding Chinese documentation, agent guidance, automated tests, lint/typecheck commands, and GitHub Actions CI/CD deployment.

**Architecture:** Keep the current Bun-based Chrome extension build and add focused tooling around it rather than reintroducing Webpack. Tests will target pure utility/build behavior first, with Chrome APIs mocked only at the boundary. CI will run Bun install, lint, typecheck, tests, build, artifact upload, and optional GitHub Pages deployment for the generated build directory.

**Tech Stack:** Bun, TypeScript, React 18, Chrome Manifest V3, Vitest, ESLint flat config, GitHub Actions.

---

## File Structure

- Modify `package.json`: add `lint`, `test`, `test:run`, `ci`, and dependency entries for Vitest and TypeScript ESLint.
- Create `eslint.config.js`: flat ESLint config for TypeScript/React source, scripts, and tests.
- Create `vitest.config.ts`: jsdom test environment with setup file and path coverage.
- Create `tests/setup.ts`: deterministic Chrome API test doubles.
- Create `tests/utils.test.ts`: RED/GREEN tests for utility behavior.
- Create `tests/build.test.ts`: RED/GREEN tests for build helper behavior.
- Modify `scripts/build.ts`: export testable helpers and only run build when invoked directly.
- Modify `src/utils/index.ts`: tighten helper types where tests require stable behavior.
- Modify `README.md`: replace English-only notes with a complete Chinese README.
- Create `AGENTS.md`: document repository conventions for future agents.
- Create `.github/workflows/ci.yml`: CI/CD workflow for lint, typecheck, tests, build, artifact upload, and optional Pages deployment.

## Task 1: Add Test Harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/utils.test.ts`

- [ ] **Step 1: Write failing utility tests**

Create `tests/utils.test.ts` with:

```ts
import { describe, expect, test, vi } from "vitest";
import { deepClone, filterEditContent, obj2str, padZero, removeKeys, str2obj, throttle } from "../src/utils";
import { TYPE, type Group, type Rule } from "../src/utils/types";

function createRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 101,
    name: "rule-a",
    create: 1,
    update: 2,
    enable: true,
    action: { type: chrome.declarativeNetRequest.RuleActionType.REDIRECT },
    condition: { regexFilter: "https://example.com/(.*)" },
    ...overrides,
  };
}

describe("utils", () => {
  test("padZero adds a leading zero for single digit numbers", () => {
    expect(padZero(3)).toBe("03");
    expect(padZero(12)).toBe("12");
  });

  test("obj2str and str2obj round trip formatted JSON", () => {
    const value = { action: { type: "block" }, condition: { urlFilter: "example" } };

    const text = obj2str(value);

    expect(text).toBe(JSON.stringify(value, null, 2));
    expect(str2obj(text)).toEqual(value);
  });

  test("deepClone copies nested arrays and objects without sharing references", () => {
    const original = { rules: [{ id: 1, meta: { enabled: true } }] };

    const cloned = deepClone(original);
    cloned.rules[0].meta.enabled = false;

    expect(original.rules[0].meta.enabled).toBe(true);
    expect(cloned).not.toBe(original);
  });

  test("removeKeys removes editor metadata from a rule object", () => {
    const rule = createRule();

    removeKeys(rule);

    expect(rule).not.toHaveProperty("id");
    expect(rule).not.toHaveProperty("name");
    expect(rule).not.toHaveProperty("create");
    expect(rule).not.toHaveProperty("update");
    expect(rule).not.toHaveProperty("enable");
    expect(rule.action.type).toBe(chrome.declarativeNetRequest.RuleActionType.REDIRECT);
  });

  test("filterEditContent returns a metadata-free rule copy", () => {
    const rule = createRule();

    const filtered = filterEditContent(rule, TYPE.Rule);

    expect(filtered).toEqual({
      action: rule.action,
      condition: rule.condition,
    });
    expect(rule).toHaveProperty("id", 101);
  });

  test("filterEditContent returns metadata-free rules for a group", () => {
    const group: Group = {
      id: 1,
      name: "group",
      create: 1,
      update: 2,
      enable: true,
      rules: [createRule({ id: 201 })],
    };

    const filtered = filterEditContent(group, TYPE.Group);

    expect(filtered).toEqual([{ action: group.rules[0].action, condition: group.rules[0].condition }]);
    expect(group.rules[0]).toHaveProperty("id", 201);
  });

  test("throttle only calls the wrapped function once during the delay window", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled("first");
    throttled("second");
    vi.advanceTimersByTime(100);
    throttled("third");

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, "first");
    expect(fn).toHaveBeenNthCalledWith(2, "third");
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Add minimal Vitest config and setup**

Create `vitest.config.ts` with:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
```

Create `tests/setup.ts` with:

```ts
import { vi } from "vitest";

const RuleActionType = {
  REDIRECT: "redirect",
  MODIFY_HEADERS: "modifyHeaders",
  BLOCK: "block",
  ALLOW: "allow",
  UPGRADE_SCHEME: "upgradeScheme",
  ALLOW_ALL_REQUESTS: "allowAllRequests",
} as const;

const HeaderOperation = {
  SET: "set",
  APPEND: "append",
  REMOVE: "remove",
} as const;

globalThis.chrome = {
  declarativeNetRequest: {
    RuleActionType,
    HeaderOperation,
    isRegexSupported: vi.fn((_input, callback) => callback({ isSupported: true })),
    getDynamicRules: vi.fn(async () => []),
    updateDynamicRules: vi.fn(async () => undefined),
    onRuleMatchedDebug: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false),
    },
    setExtensionActionOptions: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(async () => ({})),
      set: vi.fn(async () => undefined),
    },
    sync: {
      get: vi.fn(async () => ({})),
      set: vi.fn(async () => undefined),
    },
    managed: {
      get: vi.fn(async () => ({})),
      set: vi.fn(async () => undefined),
    },
    session: {
      get: vi.fn(async () => ({})),
      set: vi.fn(async () => undefined),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false),
    },
  },
  action: {
    setIcon: vi.fn(),
  },
  tabs: {
    create: vi.fn(),
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://flamingo/${path}`),
  },
} as unknown as typeof chrome;
```

- [ ] **Step 3: Add test dependency and script**

Update `package.json` scripts and devDependencies so it contains:

```json
"scripts": {
  "dev": "bun --watch scripts/build.ts",
  "build": "bun run typecheck && bun scripts/build.ts",
  "typecheck": "bun x tsc --noEmit",
  "test": "bun x vitest",
  "test:run": "bun x vitest run"
},
"devDependencies": {
  "@vitejs/plugin-react": "^5.1.1",
  "vite": "^7.2.6",
  "vitest": "^4.0.15"
}
```

Keep existing devDependencies and merge these entries.

- [ ] **Step 4: Run tests to verify RED/GREEN state**

Run: `bun run test:run tests/utils.test.ts`

Expected initially after installing dependencies: PASS for existing utility behavior. If dependency install is needed, run `bun install` first.

## Task 2: Make Build Helpers Testable

**Files:**
- Create: `tests/build.test.ts`
- Modify: `scripts/build.ts`

- [ ] **Step 1: Write failing build helper tests**

Create `tests/build.test.ts` with:

```ts
import { describe, expect, test } from "vitest";
import { toHtmlPath, shouldTreatOutputAsCss } from "../scripts/build";

describe("build helpers", () => {
  test("toHtmlPath returns extension-friendly relative paths", () => {
    expect(toHtmlPath("/repo/build/assets/home-abc.js", "/repo/build")).toBe("./assets/home-abc.js");
  });

  test("toHtmlPath normalizes Windows path separators", () => {
    expect(toHtmlPath("C:\\repo\\build\\assets\\home.css", "C:\\repo\\build")).toBe("./assets/home.css");
  });

  test("shouldTreatOutputAsCss identifies generated CSS chunks", () => {
    expect(shouldTreatOutputAsCss(".monaco-editor{display:block}")).toBe(true);
    expect(shouldTreatOutputAsCss("@font-face{font-family:test}")).toBe(true);
    expect(shouldTreatOutputAsCss("#root{height:100%}")).toBe(true);
    expect(shouldTreatOutputAsCss("import React from 'react';")).toBe(false);
    expect(shouldTreatOutputAsCss("\n  console.log('ok');")).toBe(false);
  });
});
```

- [ ] **Step 2: Run build tests and verify failure**

Run: `bun run test:run tests/build.test.ts`

Expected: FAIL because `scripts/build.ts` does not export `shouldTreatOutputAsCss` and auto-runs the build during import.

- [ ] **Step 3: Export helpers and guard CLI execution**

Change `scripts/build.ts` so:

```ts
export function toHtmlPath(path: string, baseDir = outDir) {
  return `./${relative(baseDir, path).replaceAll("\\", "/")}`;
}

export function shouldTreatOutputAsCss(content: string) {
  const first = content.trimStart().at(0);
  return first === "." || first === "@" || first === "#";
}
```

Then replace the inline CSS detection in `normalizeCssAssets` with `if (!shouldTreatOutputAsCss(content)) return path;`.

Finally replace the unconditional `await main();` with:

```ts
if (import.meta.main) {
  await main();
}
```

- [ ] **Step 4: Run build helper tests**

Run: `bun run test:run tests/build.test.ts`

Expected: PASS.

## Task 3: Add Lint and CI Scripts

**Files:**
- Modify: `package.json`
- Create: `eslint.config.js`

- [ ] **Step 1: Add lint script and ESLint dependencies**

Update `package.json` scripts to include:

```json
"lint": "bun x eslint . --max-warnings=0",
"ci": "bun run lint && bun run typecheck && bun run test:run && bun run build"
```

Add devDependencies:

```json
"@eslint/js": "^9.39.1",
"typescript-eslint": "^8.48.0",
"eslint-plugin-react-hooks": "^7.0.1",
"globals": "^16.5.0"
```

- [ ] **Step 2: Add ESLint flat config**

Create `eslint.config.js` with:

```js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["build/**", "node_modules/**", "coverage/**", "dist/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        chrome: "readonly",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
    },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  }
);
```

- [ ] **Step 3: Run lint and fix only reported violations**

Run: `bun run lint`

Expected: PASS after formatting/import cleanup. If lint reports unused imports or variables, remove them without changing runtime behavior.

## Task 4: Add Chinese Documentation and Agent Guidance

**Files:**
- Modify: `README.md`
- Create: `AGENTS.md`

- [ ] **Step 1: Replace README with Chinese project guide**

Write `README.md` with sections: 项目简介, 功能特性, 技术栈, 目录结构, 本地开发, 质量检查, 构建与加载扩展, 自动化部署, 常见问题.

- [ ] **Step 2: Add AGENTS.md**

Create `AGENTS.md` describing: package manager is Bun, build output is `build/`, never edit generated build artifacts, run `bun run ci` before completion, prefer tests under `tests/`, Chrome APIs require mocks in unit tests, GitHub Actions deploys from `build/`.

- [ ] **Step 3: Verify docs are present**

Run: `test -s README.md && test -s AGENTS.md`

Expected: command exits 0.

## Task 5: Add GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Add CI/CD workflow**

Create `.github/workflows/ci.yml` with:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

env:
  BUN_VERSION: "1.3.10"

jobs:
  quality:
    name: Lint, typecheck, test, and build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ env.BUN_VERSION }}

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run lint
        run: bun run lint

      - name: Run typecheck
        run: bun run typecheck

      - name: Run tests
        run: bun run test:run

      - name: Build extension
        run: bun run build

      - name: Upload extension artifact
        uses: actions/upload-artifact@v4
        with:
          name: flamingo-extension
          path: build
          if-no-files-found: error

      - name: Upload GitHub Pages artifact
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        uses: actions/upload-pages-artifact@v3
        with:
          path: build

  deploy-pages:
    name: Deploy build to GitHub Pages
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: quality
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Run full local CI**

Run: `bun install && bun run ci`

Expected: lint, typecheck, tests, and build all PASS.

## Self-Review

- Spec coverage: project structure, Chinese README, AGENTS guidance, tests, GitHub Actions deployment, lint, and TypeScript checks each have a task.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: test imports and helper names match the files they modify.
