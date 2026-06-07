import { mkdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chromium, type Browser, type Page } from "@playwright/test";

const rootDir = resolve(import.meta.dir, "..");
const imagesDir = join(rootDir, "images");
const port = Number(process.env.PORT || 4173);
const baseUrl = `http://127.0.0.1:${port}`;

const compactPath = join(imagesDir, "store_screenshot_compact_1280x800.jpg");
const detailPath = join(imagesDir, "store_screenshot_detail_1280x800.jpg");
const settingsPath = join(imagesDir, "store_screenshot_settings_1280x800.jpg");
const smallPromoPath = join(imagesDir, "store_promo_small_440x280.jpg");
const marqueePromoPath = join(imagesDir, "store_promo_marquee_1400x560.jpg");

const now = Date.now();
const rules = [
  {
    id: 101,
    name: "API redirect rule",
    create: now - 60000,
    update: now,
    enable: true,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        url: "https://api.example.com/mock",
      },
    },
    condition: {
      regexFilter: "^https://api\\.example\\.com/v1/(.*)",
      resourceTypes: ["xmlhttprequest"],
    },
  },
  {
    id: 102,
    name: "Block tracking pixel",
    create: now - 120000,
    update: now - 30000,
    enable: true,
    priority: 2,
    action: {
      type: "block",
    },
    condition: {
      urlFilter: "||tracker.example^",
      resourceTypes: ["image", "script"],
    },
  },
  {
    id: 103,
    name: "Attach debug header",
    create: now - 180000,
    update: now - 45000,
    enable: false,
    priority: 3,
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        {
          header: "x-flamingo-debug",
          operation: "set",
          value: "enabled",
        },
      ],
    },
    condition: {
      requestDomains: ["example.com"],
      resourceTypes: ["xmlhttprequest"],
    },
  },
];

async function waitForServer() {
  for (let index = 0; index < 50; index += 1) {
    try {
      const response = await fetch(`${baseUrl}/home.html`);
      if (response.ok) return;
    } catch {
      // Retry until the local build server is ready.
    }
    await Bun.sleep(100);
  }

  throw new Error("Timed out waiting for local build server.");
}

async function installChromeMock(page: Page) {
  await page.addInitScript(
    ({ seededRules }) => {
      localStorage.setItem("flamingo:popup-width", "800");
      localStorage.setItem("flamingo:popup-height", "494");

      const createStorageArea = (initialValues: Record<string, unknown>) => {
        const store = new Map<string, unknown>(Object.entries(initialValues));
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

      const local = createStorageArea({
        STORAGE_MODE: "local",
        LOCALE: "en",
        WORKING: true,
        DETAIL: false,
        rules_storage_key: seededRules,
        selected_storage_key: ["Rule", seededRules[0]],
      });

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
          async getDynamicRules() {
            return [];
          },
          async updateDynamicRules() {
            return undefined;
          },
          async setExtensionActionOptions() {
            return undefined;
          },
          isRegexSupported(_input: unknown, callback?: (result: { isSupported: boolean }) => void) {
            if (!callback) {
              return Promise.resolve({ isSupported: true });
            }
            callback({ isSupported: true });
          },
        },
        action: {
          async setIcon() {
            return undefined;
          },
        },
        storage: {
          local,
          sync: createStorageArea({ STORAGE_MODE: "local" }),
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

      (window as unknown as { chrome: typeof chrome }).chrome =
        chromeMock as unknown as typeof chrome;
    },
    { seededRules: rules }
  );
}

async function preparePage(browser: Browser, width: number, height: number) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await installChromeMock(page);
  await page.goto(`${baseUrl}/home.html`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({
    content: `
      html, body, #root {
        width: 100vw !important;
        height: 100vh !important;
        min-width: 100vw !important;
        min-height: 100vh !important;
        overflow: hidden !important;
        background:
          radial-gradient(circle at 28% 18%, rgba(255, 93, 82, 0.16), transparent 28%),
          linear-gradient(135deg, #fff7f6 0%, #f8fafc 48%, #eef2ff 100%) !important;
      }

      #root > div {
        width: 100vw !important;
        height: 100vh !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      .app-window {
        box-shadow:
          0 32px 90px rgba(15, 23, 42, 0.18),
          0 4px 18px rgba(255, 93, 82, 0.10) !important;
      }
    `,
  });
  await page.locator(".app-window").waitFor({ state: "visible" });
  await page.locator(".app-loading-mask").waitFor({ state: "hidden" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function saveJpeg(page: Page, path: string) {
  await page.screenshot({
    path,
    type: "jpeg",
    quality: 92,
    fullPage: false,
  });
}

async function renderPromo(
  browser: Browser,
  path: string,
  width: number,
  height: number,
  mode: "small" | "marquee"
) {
  const screenshot = await readFile(compactPath);
  const logo = await readFile(join(imagesDir, "flamingo_128.png"));
  const screenshotData = `data:image/jpeg;base64,${screenshot.toString("base64")}`;
  const logoData = `data:image/png;base64,${logo.toString("base64")}`;
  const isSmall = mode === "small";
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });

  await page.setContent(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            width: ${width}px;
            height: ${height}px;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif;
            color: #0f172a;
            background:
              radial-gradient(circle at 20% 10%, rgba(255, 93, 82, 0.22), transparent 30%),
              radial-gradient(circle at 90% 15%, rgba(255, 93, 82, 0.12), transparent 28%),
              linear-gradient(135deg, #fff7f6 0%, #f8fafc 52%, #eef2ff 100%);
          }
          .wrap {
            position: relative;
            width: 100%;
            height: 100%;
            padding: ${isSmall ? "28px 28px" : "64px 78px"};
          }
          .brand {
            display: flex;
            align-items: center;
            gap: ${isSmall ? "10px" : "18px"};
            font-weight: 800;
            letter-spacing: -0.04em;
            font-size: ${isSmall ? "25px" : "72px"};
          }
          .brand img {
            width: ${isSmall ? "34px" : "82px"};
            height: ${isSmall ? "34px" : "82px"};
          }
          .headline {
            margin-top: ${isSmall ? "16px" : "34px"};
            max-width: ${isSmall ? "220px" : "610px"};
            font-size: ${isSmall ? "22px" : "52px"};
            line-height: 1.02;
            font-weight: 800;
            letter-spacing: -0.05em;
          }
          .sub {
            margin-top: ${isSmall ? "10px" : "20px"};
            max-width: ${isSmall ? "210px" : "560px"};
            color: #475569;
            font-size: ${isSmall ? "12px" : "24px"};
            line-height: 1.45;
            font-weight: 600;
          }
          .shot {
            position: absolute;
            right: ${isSmall ? "-154px" : "72px"};
            bottom: ${isSmall ? "18px" : "46px"};
            width: ${isSmall ? "360px" : "720px"};
            border-radius: ${isSmall ? "18px" : "32px"};
            box-shadow:
              0 30px 80px rgba(15, 23, 42, 0.20),
              0 8px 22px rgba(255, 93, 82, 0.14);
            border: 1px solid rgba(255,255,255,0.92);
          }
          .badge {
            display: inline-flex;
            align-items: center;
            margin-top: ${isSmall ? "14px" : "30px"};
            border-radius: 999px;
            padding: ${isSmall ? "6px 10px" : "12px 18px"};
            background: #ff5d52;
            color: #111827;
            font-size: ${isSmall ? "11px" : "20px"};
            font-weight: 800;
            box-shadow: 0 16px 35px rgba(255, 93, 82, 0.28);
          }
        </style>
      </head>
      <body>
        <main class="wrap">
          <div class="brand">
            <img src="${logoData}" alt="" />
            <span>Flamingo</span>
          </div>
          <div class="headline">Declarative Net Request rule editor</div>
          <div class="sub">Redirect, block, and modify request headers with local rules you control.</div>
          <div class="badge">Local first · Chrome Sync optional</div>
          <img class="shot" src="${screenshotData}" alt="" />
        </main>
      </body>
    </html>
  `);
  await page.evaluate(() => document.fonts.ready);
  await saveJpeg(page, path);
  await page.close();
}

await mkdir(imagesDir, { recursive: true });
await Bun.$`bun run build`;

const server = Bun.spawn(["bun", "scripts/serve-build.ts"], {
  cwd: rootDir,
  stdout: "pipe",
  stderr: "pipe",
});

let browser: Browser | undefined;

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });

  const compact = await preparePage(browser, 1280, 800);
  await saveJpeg(compact, compactPath);
  await compact.close();

  const detail = await preparePage(browser, 1280, 800);
  await detail.getByRole("button", { name: "Switch to detail mode" }).click();
  await detail.locator(".monaco-editor").waitFor({ state: "visible", timeout: 15000 });
  await saveJpeg(detail, detailPath);
  await detail.close();

  const settings = await preparePage(browser, 1280, 800);
  await settings.locator(".editor-toolbar button").last().click();
  await settings.locator(".ant-drawer-content-wrapper").waitFor({ state: "visible" });
  await settings.waitForTimeout(450);
  await saveJpeg(settings, settingsPath);
  await settings.close();

  await renderPromo(browser, smallPromoPath, 440, 280, "small");
  await renderPromo(browser, marqueePromoPath, 1400, 560, "marquee");
} finally {
  await browser?.close();
  server.kill();
}

console.log("Generated Chrome Web Store assets:");
for (const path of [compactPath, detailPath, settingsPath, smallPromoPath, marqueePromoPath]) {
  console.log(`- ${path}`);
}
