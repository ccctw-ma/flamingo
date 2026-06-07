import { expect, test } from "@playwright/test";

async function installChromeMock(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const createStorageArea = () => {
      const store = new Map<string, unknown>();
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
    };

    if (!globalState.__flamingoChromeMockStore__) {
      globalState.__flamingoChromeMockStore__ = {
        local: createStorageArea(),
        sync: createStorageArea(),
      };
    }

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
        async create() {
          return { id: 1 };
        },
      },
    };

    (window as unknown as { chrome: typeof chrome }).chrome = chromeMock as unknown as typeof chrome;
  });
}

async function seedRule(page: import("@playwright/test").Page, name: string) {
  await page.getByRole("button", { name: /^Add$|^新增$/i }).first().click();
  const addInput = page.locator(".sidebar-command input");
  await addInput.fill(name);
  await addInput.press("Enter");
  await page.locator(".item-row", { hasText: name }).first().waitFor();
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
    await expect(appPane).toHaveCSS("border-radius", "22px");

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
          getComputedStyle(document.documentElement).getPropertyValue("--flamingo-popup-width").trim()
        )
      )
      .toBe("760px");
    await expect
      .poll(() =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement).getPropertyValue("--flamingo-popup-height").trim()
        )
      )
      .toBe("520px");

    await page.reload({ waitUntil: "domcontentloaded" });

    await expect
      .poll(() =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement).getPropertyValue("--flamingo-popup-width").trim()
        )
      )
      .toBe("760px");
    await expect
      .poll(() =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement).getPropertyValue("--flamingo-popup-height").trim()
        )
      )
      .toBe("520px");

    const appWindow = page.locator(".app-window");
    await expect(appWindow).toBeVisible();
    await expect(appWindow).toHaveCSS("overflow", "hidden");
  });

  test("shows empty state and creates the first rule", async ({ page }) => {
    await installChromeMock(page);
    await page.goto("/home.html");

    await expect(page.locator(".item-row")).toHaveCount(0);
    await expect(page.locator(".sidebar-empty")).toBeVisible();

    await page.getByRole("button", { name: /^Add$|^新增$/i }).first().click();
    const addInput = page.locator(".sidebar-command input");
    await addInput.fill("alpha");
    await addInput.press("Enter");

    await expect(page.locator(".item-row", { hasText: "alpha" })).toHaveCount(1);
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
    await page.locator(".flamingo-list-menu").getByText(/Copy Rule|复制规则/i).click();

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
});
