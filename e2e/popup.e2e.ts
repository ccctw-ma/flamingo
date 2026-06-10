import { expect, test } from "@playwright/test";

async function installChromeMock(
  page: import("@playwright/test").Page,
  initialLocalStorage: Record<string, unknown> = {}
) {
  await page.addInitScript((initialLocalStorageValues) => {
    const createStorageArea = (initialValues: Record<string, unknown> = {}) => {
      const store = new Map<string, unknown>();
      for (const [key, value] of Object.entries(initialValues)) {
        store.set(key, value);
      }
      return {
        async get(
          keys: string | string[] | Record<string, unknown>,
          callback?: (value: Record<string, unknown>) => void
        ) {
          const result: Record<string, unknown> = {};
          if (typeof keys === "string") {
            if (store.has(keys)) result[keys] = store.get(keys);
          } else if (Array.isArray(keys)) {
            for (const key of keys) {
              if (store.has(key)) result[key] = store.get(key);
            }
          } else {
            for (const key of Object.keys(keys)) {
              result[key] = store.has(key) ? store.get(key) : keys[key];
            }
          }
          callback?.(result);
          return result;
        },
        async set(obj: Record<string, unknown>) {
          for (const [key, value] of Object.entries(obj)) {
            store.set(key, value);
          }
        },
      };
    };

    const globalState = window as typeof window & {
      __flamingoChromeMockStore__?: {
        local: ReturnType<typeof createStorageArea>;
        sync: ReturnType<typeof createStorageArea>;
      };
      __flamingoChromeMockTabs__?: Array<{ url?: string }>;
    };

    if (!globalState.__flamingoChromeMockStore__) {
      globalState.__flamingoChromeMockStore__ = {
        local: createStorageArea(initialLocalStorageValues),
        sync: createStorageArea(),
      };
    }
    globalState.__flamingoChromeMockTabs__ = [];

    const { local, sync } = globalState.__flamingoChromeMockStore__;
    const noop = () => {};
    const hasListener = () => false;

    const chromeMock = {
      declarativeNetRequest: {
        RuleActionType: {
          BLOCK: "block",
          REDIRECT: "redirect",
          ALLOW: "allow",
          MODIFY_HEADERS: "modifyHeaders",
          ALLOW_ALL_REQUESTS: "allowAllRequests",
        },
        ResourceType: {
          MAIN_FRAME: "main_frame",
          SUB_FRAME: "sub_frame",
          STYLESHEET: "stylesheet",
          SCRIPT: "script",
          IMAGE: "image",
          FONT: "font",
          OBJECT: "object",
          XMLHTTPREQUEST: "xmlhttprequest",
          PING: "ping",
          CSP_REPORT: "csp_report",
          MEDIA: "media",
          WEBSOCKET: "websocket",
          OTHER: "other",
        },
        HeaderOperation: {
          APPEND: "append",
          SET: "set",
          REMOVE: "remove",
        },
        isRegexSupported(_input: unknown, callback?: (result: { isSupported: boolean }) => void) {
          if (!callback) {
            return Promise.resolve({ isSupported: true });
          }
          callback({ isSupported: true });
        },
      },
      storage: {
        local,
        sync,
        onChanged: {
          addListener: noop,
          removeListener: noop,
          hasListener,
        },
      },
      runtime: {
        getURL(path: string) {
          return path;
        },
      },
      tabs: {
        async create(options: { url?: string }) {
          globalState.__flamingoChromeMockTabs__?.push(options);
          return { id: 1 };
        },
      },
    };

    (window as unknown as { chrome: typeof chrome }).chrome =
      chromeMock as unknown as typeof chrome;

    const nativeFetch = window.fetch.bind(window);
    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/chat/completions")) {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          messages?: Array<{ content?: string }>;
        };
        const userPayload = JSON.parse(body.messages?.at(-1)?.content ?? "{}") as { task?: string };
        const content =
          userPayload.task === "Plan all Flamingo DNR rules needed for the user request."
            ? JSON.stringify({
                groupName: "Magic Proxy",
                rules: [
                  {
                    action: "modifyHeaders",
                    target: "https://magic-cn.bytedance.net/api/*",
                    needsMockResponse: false,
                    needsRedirectUrl: false,
                    needsHeaders: true,
                  },
                  {
                    action: "block",
                    target: "https://magic-cn.bytedance.net/tracking/*",
                    needsMockResponse: false,
                    needsRedirectUrl: false,
                    needsHeaders: false,
                  },
                ],
                confidence: 0.9,
                notes: ["project proxy group"],
              })
            : JSON.stringify({
                groupName: "Magic Proxy",
                rules: [
                  {
                    name: "API Headers",
                    action: "modifyHeaders",
                    regexFilter: "https://magic-cn.bytedance.net/api/",
                    requestHeaders: [
                      {
                        header: "x-use-ppe",
                        operation: "set",
                        value: "1",
                        enabled: true,
                      },
                    ],
                  },
                  {
                    name: "Block Track",
                    action: "block",
                    regexFilter: "https://magic-cn.bytedance.net/tracking/",
                  },
                ],
              });

        return Response.json({
          choices: [
            {
              message: {
                content,
              },
            },
          ],
        });
      }

      return nativeFetch(input, init);
    }) as typeof fetch;
  }, initialLocalStorage);
}

async function seedRule(page: import("@playwright/test").Page, name: string) {
  await page
    .getByRole("button", { name: /^Add$|^新增$/i })
    .first()
    .click();
  await page
    .locator(".flamingo-list-menu")
    .last()
    .getByText(/Add rule|添加规则/i)
    .click();
  const addInput = page.locator(".sidebar-command input");
  await addInput.fill(name);
  await addInput.press("Enter");
  await page.locator(".item-row", { hasText: name }).first().waitFor();
}

function createNestedMockRule() {
  const rule = {
    id: 7001,
    name: "mock-json",
    create: Date.now(),
    update: Date.now(),
    enable: true,
    action: { type: "block" },
    condition: { regexFilter: "^https://example\\.com/api/mock$" },
    mockResponse: {
      enabled: true,
      body: JSON.stringify(
        {
          user: {
            id: "u-1",
            name: "Ada",
          },
          payload: JSON.stringify({
            nested: {
              value: 1,
            },
          }),
          status: "ok",
        },
        null,
        2
      ),
    },
    uiActionType: "mock",
  };
  return rule;
}

function createModifyHeadersRule() {
  const rule = {
    id: 7002,
    name: "headers",
    create: Date.now(),
    update: Date.now(),
    enable: true,
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        {
          operation: "set",
          header: "",
          value: "1",
        },
      ],
    },
    condition: { regexFilter: "^https://example\\.com/.*" },
    uiActionType: "modifyHeaders",
  };
  return rule;
}

test.describe("popup shell", () => {
  test("renders the full panel immediately and clears the loading mask", async ({ page }) => {
    await installChromeMock(page);
    const start = Date.now();
    await page.goto("/home.html", { waitUntil: "domcontentloaded" });

    const appWindow = page.locator(".app-window");
    const appShell = page.locator(".app-shell");
    const appPane = page.locator(".app-pane").first();
    const loadingMask = page.locator(".app-loading-mask");

    await expect(appWindow).toBeVisible();
    await expect(appShell).toBeVisible();
    await expect(appPane).toHaveCSS("border-radius", "0px");
    await expect(page.getByRole("button", { name: "menu" })).toHaveCount(0);

    const bounds = await appWindow.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThanOrEqual(640);
    expect(bounds!.height).toBeGreaterThanOrEqual(420);

    await expect(loadingMask).toBeHidden();
    expect(Date.now() - start).toBeLessThan(3000);
  });

  test("opens settings, switches language and applies panel size", async ({ page }) => {
    await installChromeMock(page);
    await page.goto("/home.html");

    await page.getByRole("button", { name: /settings|设置/i }).click();

    const drawerTitle = page.getByText(/Preferences|偏好设置/);
    await expect(drawerTitle).toBeVisible();

    await page.locator(".ant-drawer").getByText("English", { exact: true }).click();
    await expect(page.getByText("Preferences")).toBeVisible();

    const numberInputs = page.locator(".ant-input-number input");
    await numberInputs.nth(0).fill("760");
    await numberInputs.nth(1).fill("520");
    await page.getByRole("button", { name: /Apply Size|应用尺寸/i }).click();

    await expect
      .poll(() =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--flamingo-popup-width")
            .trim()
        )
      )
      .toBe("760px");
    await expect
      .poll(() =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--flamingo-popup-height")
            .trim()
        )
      )
      .toBe("520px");

    await page.reload({ waitUntil: "domcontentloaded" });

    await expect
      .poll(() =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--flamingo-popup-width")
            .trim()
        )
      )
      .toBe("760px");
    await expect
      .poll(() =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--flamingo-popup-height")
            .trim()
        )
      )
      .toBe("520px");

    const appWindow = page.locator(".app-window");
    await expect(appWindow).toBeVisible();
    await expect(appWindow).toHaveCSS("overflow", "hidden");
  });

  test("generates and applies a project-level AI rule group", async ({ page }) => {
    await installChromeMock(page, {
      "flamingo:ai-settings": {
        enabled: true,
        provider: "deepseek",
        model: "deepseek-v4-flash",
        apiKey: "test-key",
        apiKeys: {
          gpt: "",
          deepseek: "test-key",
        },
      },
    });
    await page.goto("/home.html");
    await seedRule(page, "Standalone");

    await page.getByRole("button", { name: /AI Generate Rule|AI 生成规则/i }).click();
    await page
      .getByPlaceholder(/Mock https:\/\/api\.example\.com\/user|例如：把/)
      .fill("给 magic 项目生成代理规则：API 加 header，tracking 拦截");
    await page
      .getByRole("button", { name: /AI Generate Rule|AI 生成规则/i })
      .last()
      .click();
    await expect(page.getByText(/Generation Progress|生成过程/)).toBeVisible();
    await expect(page.getByText(/正在分析需求并规划规则/)).toBeVisible();
    await expect(page.getByText(/草稿生成完成：2 条/)).toBeVisible();
    await expect(page.getByText(/Draft passed validation|草稿已通过校验/)).toBeVisible();
    const assistantScroll = page.locator(".ai-assistant-scroll");
    await expect(assistantScroll).toBeVisible();
    await expect
      .poll(async () => {
        return await assistantScroll.evaluate((element) => ({
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
        }));
      })
      .toMatchObject({
        clientHeight: expect.any(Number),
        scrollHeight: expect.any(Number),
      });
    const canScrollAssistant = await assistantScroll.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      return element.scrollTop > 0 && element.scrollHeight > element.clientHeight;
    });
    expect(canScrollAssistant).toBe(true);
    await page.getByRole("button", { name: /Apply Draft|应用草稿/i }).click();

    const folder = page.locator(".rule-folder", { hasText: "Magic Proxy" });
    await expect(folder).toHaveCount(1);
    await expect(folder.locator(".rule-folder-count")).toHaveCount(0);
    await expect(folder.locator(".anticon-folder, .anticon-down, .anticon-right")).toHaveCount(0);
    await expect(folder.locator(".rule-folder-badge")).toHaveCount(0);
    await expect(folder.locator(".rule-folder-handle")).toBeVisible();
    await expect(folder.locator(".rule-folder-row")).toHaveCSS("display", "flex");
    await expect(folder.locator(".rule-folder-row")).toHaveCSS("min-height", "46px");
    await expect(folder.locator(".rule-folder-row")).toHaveCSS(
      "border-color",
      /rgba\(239, 127, 141, 0\.32\)/
    );
    await expect
      .poll(async () => {
        const folderBackground = await folder
          .locator(".rule-folder-row")
          .evaluate((element) => getComputedStyle(element).backgroundImage);
        const rowBackground = await page
          .locator(".item-row", { hasText: "Standalone" })
          .evaluate((element) => getComputedStyle(element).backgroundColor);
        return { folderBackground, rowBackground };
      })
      .toEqual({
        folderBackground: expect.stringContaining("rgba(239, 127, 141, 0.11)"),
        rowBackground: "rgba(255, 255, 255, 0.3)",
      });
    await folder
      .locator(".rule-folder-handle")
      .dragTo(page.locator(".item-row", { hasText: "Standalone" }));
    await expect
      .poll(async () => {
        const result = await page.evaluate(async () => {
          return await chrome.storage.local.get("rules_storage_key");
        });
        return (result.rules_storage_key as Array<{ name: string }>).map((rule) => rule.name);
      })
      .toEqual(["API Headers", "Block Track", "Standalone"]);
    const firstFolder = page.locator(".rule-folder").first();
    await expect(page.locator(".item-row", { hasText: "API Headers" })).toHaveCount(1);
    await expect(page.locator(".item-row", { hasText: "Block Track" })).toHaveCount(1);
    await folder.locator(".rule-folder-row").click();
    await expect(folder.locator(".rule-folder-row")).toHaveClass(/rule-folder-row-active/);
    await expect(folder.locator(".rule-folder-row")).toHaveCSS(
      "border-color",
      /rgba\(239, 127, 141, 0\.32\)/
    );
    await expect
      .poll(async () => {
        const result = await page.evaluate(async () => {
          return await chrome.storage.local.get("selected_storage_key");
        });
        const selected = result.selected_storage_key as [string, { name?: string } | null];
        return selected?.[1]?.name;
      })
      .toBe("API Headers");
    await expect(page.locator(".item-row", { hasText: "API Headers" })).toHaveCount(0);
    await expect(folder.locator(".rule-folder-children")).toHaveCount(0);
    await folder.locator(".rule-folder-row").click();
    await expect(folder.locator(".rule-folder-children")).toHaveCount(1);
    await expect(folder.locator(".rule-folder-children")).toHaveCSS("margin-left", "10px");
    await expect(folder.locator(".rule-folder-children")).toHaveCSS("padding-left", "6px");
    await expect(page.locator(".item-row", { hasText: "API Headers" })).toHaveCount(1);
    await folder.locator(".rule-folder-row .ant-checkbox-input").click({ force: true });
    await expect
      .poll(async () => {
        const result = await page.evaluate(async () => {
          return await chrome.storage.local.get("rules_storage_key");
        });
        return (
          result.rules_storage_key as Array<{
            groupId?: number;
            groupName?: string;
            groupEnabled?: boolean;
            enable: boolean;
          }>
        ).map((rule) => ({
          hasGroup: typeof rule.groupId === "number",
          groupName: rule.groupName,
          groupEnabled: rule.groupEnabled,
          enable: rule.enable,
        }));
      })
      .toEqual([
        { hasGroup: true, groupName: "Magic Proxy", groupEnabled: true, enable: false },
        { hasGroup: true, groupName: "Magic Proxy", groupEnabled: true, enable: false },
        { hasGroup: false, groupName: undefined, groupEnabled: undefined, enable: false },
      ]);
    await expect(folder.locator(".rule-folder-row .ant-checkbox-inner")).toHaveCSS(
      "background-color",
      "rgb(239, 127, 141)"
    );
    await page.locator(".item-row", { hasText: "API Headers" }).getByRole("checkbox").click();
    await expect
      .poll(async () => {
        const groupCheckedColor = await folder
          .locator(".rule-folder-row .ant-checkbox-inner")
          .evaluate((element) => getComputedStyle(element).backgroundColor);
        const rowCheckedColor = await page
          .locator(".item-row", { hasText: "API Headers" })
          .locator(".ant-checkbox-inner")
          .evaluate((element) => getComputedStyle(element).backgroundColor);
        return { groupCheckedColor, rowCheckedColor };
      })
      .toEqual({
        groupCheckedColor: "rgb(239, 127, 141)",
        rowCheckedColor: "rgb(255, 136, 122)",
      });
    await expect
      .poll(async () => {
        const result = await page.evaluate(async () => {
          return await chrome.storage.local.get("rules_storage_key");
        });
        return (
          result.rules_storage_key as Array<{
            name: string;
            groupEnabled?: boolean;
            enable: boolean;
          }>
        ).find((rule) => rule.name === "API Headers");
      })
      .toMatchObject({ groupEnabled: true, enable: true });
    await folder.locator(".rule-folder-handle").click();
    await page
      .locator(".flamingo-list-menu")
      .last()
      .getByText(/Edit Rule|编辑规则/i)
      .click();
    await firstFolder.locator(".rule-folder-input").fill("Magic Group");
    await firstFolder.locator(".rule-folder-input").press("Enter");
    const renamedFolder = page.locator(".rule-folder", { hasText: "Magic Group" });
    await expect(renamedFolder).toHaveCount(1);
    await renamedFolder.locator(".rule-folder-handle").click({ force: true });
    await expect(page.locator(".flamingo-list-menu").last()).toBeVisible();
    await page
      .locator(".flamingo-list-menu")
      .last()
      .getByText(/Copy Rule|复制规则/i)
      .click();
    const copiedFolder = page.locator(".rule-folder", { hasText: /Magic Group (Copy|副本)/ });
    await expect(copiedFolder).toHaveCount(1);
    await page.mouse.move(1, 1);
    await expect(copiedFolder.locator(".rule-folder-row")).toHaveCSS(
      "border-color",
      /rgba\(255, 132, 122, 0\.18\)/
    );
    await copiedFolder.locator(".rule-folder-handle").click({ force: true });
    await expect(page.locator(".flamingo-list-menu").last()).toBeVisible();
    await page
      .locator(".flamingo-list-menu")
      .last()
      .getByText(/Delete Rule|删除/i)
      .click();
    await expect(copiedFolder).toHaveCount(0);
    const divider = page.locator(".app-divider");
    const dividerBox = await divider.boundingBox();
    expect(dividerBox).not.toBeNull();
    await page.mouse.move(dividerBox!.x + dividerBox!.width / 2, dividerBox!.y + 20);
    await page.mouse.down();
    await page.mouse.move(74, dividerBox!.y + 20);
    await page.mouse.up();
    await expect(renamedFolder.locator(".rule-folder-children")).toHaveCount(0);
    await expect(renamedFolder.locator(".rule-folder-badge")).toHaveCount(0);
    await expect(renamedFolder.locator(".rule-folder-name")).toBeHidden();
    await expect(renamedFolder.locator(".rule-folder-row .ant-checkbox")).toBeVisible();
    await expect(renamedFolder.locator(".rule-folder-handle")).toBeVisible();
    await expect(renamedFolder.locator(".rule-folder-row")).toHaveCSS("justify-content", "center");
    await expect(renamedFolder.locator(".rule-folder-row")).toHaveCSS(
      "border-color",
      /rgba\(239, 127, 141, 0\.16\)/
    );
    await expect(renamedFolder.locator(".rule-folder-index")).toBeVisible();
  });

  test("shows empty state and creates the first rule", async ({ page }) => {
    await installChromeMock(page);
    await page.goto("/home.html");

    await expect(page.locator(".item-row")).toHaveCount(0);
    await expect(page.locator(".sidebar-empty")).toBeVisible();

    await page
      .getByRole("button", { name: /^Add$|^新增$/i })
      .first()
      .click();
    await page
      .locator(".flamingo-list-menu")
      .last()
      .getByText(/Add rule|添加规则/i)
      .click();
    const addInput = page.locator(".sidebar-command input");
    await addInput.fill("alpha");
    await addInput.press("Enter");

    await expect(page.locator(".item-row", { hasText: "alpha" })).toHaveCount(1);
  });

  test("creates a group from the add menu and keeps submit button visible", async ({ page }) => {
    await installChromeMock(page);
    await page.goto("/home.html");

    await page
      .getByRole("button", { name: /^Add$|^新增$/i })
      .first()
      .click();
    await page
      .locator(".flamingo-list-menu")
      .last()
      .getByText(/Add group|新增 Group/i)
      .click();

    const addButton = page.getByRole("button", { name: /^Add$|^新增$/i }).first();
    const addInput = page.locator(".sidebar-command input");
    const submitButton = page.locator(".sidebar-command").getByRole("button", {
      name: /^Add$|^新增$/i,
    });
    await expect(addButton).toHaveCSS("background-color", "rgb(255, 93, 82)");
    await expect(addButton).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveCSS("background-color", "rgb(255, 93, 82)");
    await addInput.fill("Manual Group");
    await submitButton.click();

    const folder = page.locator(".rule-folder", { hasText: "Manual Group" });
    await expect(folder).toHaveCount(1);
    await expect(
      folder.locator(".rule-folder-count, .rule-folder-badge, .anticon-folder")
    ).toHaveCount(0);
    await expect(page.locator(".item-row", { hasText: /Default rule|默认规则/ })).toHaveCount(1);
  });

  test("filters rule list from the sidebar tools", async ({ page }) => {
    await installChromeMock(page);
    await page.goto("/home.html");

    await seedRule(page, "cros");
    await seedRule(page, "demo-rule");

    await page.getByRole("button", { name: /Search|搜索/i }).click();
    const searchInput = page.locator(".sidebar-command input");
    await searchInput.fill("cro");

    await expect(page.locator(".item-row", { hasText: "cros" })).toHaveCount(1);
    await expect(page.locator(".item-row", { hasText: "demo-rule" })).toHaveCount(0);
  });

  test("duplicates a rule directly from the list", async ({ page }) => {
    await installChromeMock(page);
    await page.goto("/home.html");

    await seedRule(page, "demo-rule");

    const demoRow = page.locator(".item-row", { hasText: "demo-rule" }).first();
    await demoRow.hover();
    await demoRow.locator(".item-handle").click();
    await page
      .locator(".flamingo-list-menu")
      .getByText(/Copy Rule|复制规则/i)
      .click();

    await expect(page.locator(".item-row", { hasText: /demo-rule (副本|Copy)/ })).toHaveCount(1);
  });

  test("reorders rules by dragging list items", async ({ page }) => {
    await installChromeMock(page);
    await page.goto("/home.html");

    await seedRule(page, "demo-rule");
    await seedRule(page, "cros");

    const rows = page.locator(".item-row");
    await expect(rows.nth(0)).toContainText("demo-rule");
    await expect(rows.nth(1)).toContainText("cros");

    await rows.nth(1).locator(".item-handle").dragTo(rows.nth(0));

    await expect(rows.nth(0)).toContainText("cros");
    await expect(rows.nth(1)).toContainText("demo-rule");
  });

  test("collapses the left bar to index and drag controls", async ({ page }) => {
    await installChromeMock(page);
    await page.goto("/home.html");

    await seedRule(page, "demo-rule");
    await seedRule(page, "cros");

    const divider = page.locator(".app-divider");
    const dividerBox = await divider.boundingBox();
    expect(dividerBox).not.toBeNull();
    await page.mouse.move(dividerBox!.x + dividerBox!.width / 2, dividerBox!.y + 20);
    await page.mouse.down();
    await page.mouse.move(74, dividerBox!.y + 20);
    await page.mouse.up();

    const sidebar = page.locator(".app-sidebar");
    await expect
      .poll(async () => {
        const box = await sidebar.boundingBox();
        return Math.round(box?.width ?? 0);
      })
      .toBeGreaterThanOrEqual(80);
    await expect
      .poll(async () => {
        const box = await sidebar.boundingBox();
        return Math.round(box?.width ?? 0);
      })
      .toBeLessThanOrEqual(110);

    const firstRow = page.locator(".item-row").first();
    await expect(firstRow.locator(".item-index")).toBeVisible();
    await expect(firstRow.locator(".item-index")).toHaveText("1");
    await expect(firstRow.locator(".item-name")).toBeHidden();
    await expect(firstRow.locator(".item-handle")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Add$|^新增$/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Search|搜索/i }).first()).toBeVisible();
  });

  test("keeps focus while editing modify header names", async ({ page }) => {
    const modifyHeadersRule = createModifyHeadersRule();
    await installChromeMock(page, {
      STORAGE_MODE: "local",
      WORKING: true,
      rules_storage_key: [modifyHeadersRule],
      selected_storage_key: ["Rule", modifyHeadersRule],
    });
    await page.goto("/home.html");

    const headerInput = page.locator(".editor-card input[placeholder='header']").first();
    await expect(headerInput).toBeVisible();
    await headerInput.fill("x-use");
    await expect(headerInput).toHaveValue("x-use");
    await expect
      .poll(async () => {
        return await headerInput.evaluate((element) => element === document.activeElement);
      })
      .toBe(true);

    await headerInput.fill("x-use-ppe");
    await expect(headerInput).toHaveValue("x-use-ppe");
    await expect
      .poll(async () => {
        return await headerInput.evaluate((element) => element === document.activeElement);
      })
      .toBe(true);
  });

  test("toggles individual modify header operations", async ({ page }) => {
    const modifyHeadersRule = createModifyHeadersRule();
    await installChromeMock(page, {
      STORAGE_MODE: "local",
      WORKING: true,
      rules_storage_key: [modifyHeadersRule],
      selected_storage_key: ["Rule", modifyHeadersRule],
    });
    await page.goto("/home.html");

    const headerToggle = page
      .locator(".editor-card")
      .getByRole("checkbox", { name: /Enable header operation|启用 Header 操作/i })
      .first();
    await expect(headerToggle).toBeVisible();
    await headerToggle.click();

    await expect
      .poll(async () => {
        const result = await page.evaluate(async () => {
          return await chrome.storage.local.get("rules_storage_key");
        });
        return (
          result.rules_storage_key as Array<{
            action: { requestHeaders: Array<{ enabled?: boolean }> };
          }>
        )[0].action.requestHeaders[0].enabled;
      })
      .toBe(false);

    await headerToggle.click();
    await expect
      .poll(async () => {
        const result = await page.evaluate(async () => {
          return await chrome.storage.local.get("rules_storage_key");
        });
        return (
          result.rules_storage_key as Array<{
            action: { requestHeaders: Array<{ enabled?: boolean }> };
          }>
        )[0].action.requestHeaders[0].enabled;
      })
      .toBe(true);
  });

  test("normalizes URL wildcard conditions before persisting proxy rules", async ({ page }) => {
    const modifyHeadersRule = createModifyHeadersRule();
    await installChromeMock(page, {
      STORAGE_MODE: "local",
      WORKING: true,
      rules_storage_key: [modifyHeadersRule],
      selected_storage_key: ["Rule", modifyHeadersRule],
    });
    await page.goto("/home.html");

    const conditionInput = page.locator(".editor-card textarea").first();
    await expect(conditionInput).toBeVisible();
    await conditionInput.fill("https://magic-cn.bytedance.net/*");

    await expect
      .poll(async () => {
        const result = await page.evaluate(async () => {
          return await chrome.storage.local.get("rules_storage_key");
        });
        return (
          result.rules_storage_key as Array<{
            condition: { regexFilter?: string };
          }>
        )[0].condition.regexFilter;
      })
      .toBe("^https://magic-cn\\.bytedance\\.net/.*$");
  });

  test("normalizes bare wildcard conditions before persisting proxy rules", async ({ page }) => {
    const modifyHeadersRule = createModifyHeadersRule();
    await installChromeMock(page, {
      STORAGE_MODE: "local",
      WORKING: true,
      rules_storage_key: [modifyHeadersRule],
      selected_storage_key: ["Rule", modifyHeadersRule],
    });
    await page.goto("/home.html");

    const conditionInput = page.locator(".editor-card textarea").first();
    await expect(conditionInput).toBeVisible();
    await conditionInput.fill("*");

    await expect
      .poll(async () => {
        const result = await page.evaluate(async () => {
          return await chrome.storage.local.get("rules_storage_key");
        });
        return (
          result.rules_storage_key as Array<{
            condition: { regexFilter?: string };
          }>
        )[0].condition.regexFilter;
      })
      .toBe("^.*$");
  });

  test("normalizes plain URL conditions to prefix matches before persisting proxy rules", async ({
    page,
  }) => {
    const modifyHeadersRule = createModifyHeadersRule();
    await installChromeMock(page, {
      STORAGE_MODE: "local",
      WORKING: true,
      rules_storage_key: [modifyHeadersRule],
      selected_storage_key: ["Rule", modifyHeadersRule],
    });
    await page.goto("/home.html");

    const conditionInput = page.locator(".editor-card textarea").first();
    await expect(conditionInput).toBeVisible();
    await conditionInput.fill("https://magic-cn.bytedance.net/");

    await expect
      .poll(async () => {
        const result = await page.evaluate(async () => {
          return await chrome.storage.local.get("rules_storage_key");
        });
        return (
          result.rules_storage_key as Array<{
            condition: { regexFilter?: string };
          }>
        )[0].condition.regexFilter;
      })
      .toBe("^https://magic-cn\\.bytedance\\.net/.*$");
  });

  test("edits mock response with Monaco folding and automatic nested JSON entry", async ({
    page,
  }) => {
    const nestedMockRule = createNestedMockRule();
    await installChromeMock(page, {
      STORAGE_MODE: "local",
      WORKING: true,
      rules_storage_key: [nestedMockRule],
      selected_storage_key: ["Rule", nestedMockRule],
    });
    await page.goto("/home.html");

    const inlineEditor = page.locator(".editor-card textarea").nth(1);
    await expect(inlineEditor).toBeVisible();
    await inlineEditor.fill(
      JSON.stringify(
        {
          user: {
            id: "u-2",
            name: "Grace",
          },
          payload: JSON.stringify({
            nested: {
              value: 2,
            },
          }),
          status: "edited-inline",
        },
        null,
        2
      )
    );
    await expect(page.getByRole("button", { name: /详细编辑|Detailed Editor/i })).toBeVisible();
    await page.getByRole("button", { name: /^全屏$|^Fullscreen$/i }).click();

    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const state = window as typeof window & {
            __flamingoChromeMockTabs__?: Array<{ url?: string }>;
          };
          return state.__flamingoChromeMockTabs__?.at(-1)?.url;
        });
      })
      .toBe("home.html?mode=tab");

    await expect
      .poll(async () => {
        const result = await page.evaluate(async () => {
          return await chrome.storage.local.get("rules_storage_key");
        });
        return JSON.parse(
          (result.rules_storage_key as Array<{ mockResponse: { body: string } }>)[0].mockResponse
            .body
        ).status;
      })
      .toBe("edited-inline");

    await page.getByRole("button", { name: /详细编辑|Detailed Editor/i }).click();

    const editor = page.locator(".monaco-editor").first();
    await expect(editor).toBeVisible();
    await expect(page.getByRole("button", { name: /Format|格式化/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Fold|折叠/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Edit Nested JSON|编辑嵌套 JSON/i })).toHaveCount(
      0
    );

    await expect
      .poll(async () => {
        return await page.locator(".margin-view-overlays .codicon-folding-expanded").count();
      })
      .toBeGreaterThan(0);
    await expect
      .poll(async () => {
        return await page
          .locator(".margin-view-overlays .codicon-folding-expanded")
          .first()
          .evaluate((element) => getComputedStyle(element).fontFamily);
      })
      .toContain("codicon");

    await editor
      .locator(".view-line", { hasText: "payload" })
      .first()
      .click({
        position: { x: 80, y: 10 },
      });
    await expect(page.getByText(/Mock 响应 \/ payload|Mock Response \/ payload/)).toHaveCount(1);
    await expect(page.getByRole("button", { name: /应用到上层|Apply to Parent/i })).toBeVisible();
  });
});
