import { chromium, expect, test } from "@playwright/test";
import { createServer, type IncomingHttpHeaders, type Server } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

function listen(server: Server) {
  return new Promise<number>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (typeof address === "object" && address) {
        resolve(address.port);
      }
    });
  });
}

function closeServer(server: Server) {
  if (!server.listening) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    server.closeAllConnections();
    server.close((error) => {
      if (error) {
        const errorCode =
          typeof error === "object" && "code" in error ? String(error.code) : "";
        if (errorCode === "ERR_SERVER_NOT_RUNNING") {
          resolve();
          return;
        }
        reject(error);
        return;
      }
      resolve();
    });
  });
}

test("real extension proxy modifies request headers through DNR", async () => {
  test.setTimeout(60_000);
  let latestHeaders: IncomingHttpHeaders = {};
  let pageObservedHeaders: Record<string, string> = {};
  let xhrObservedHeaders: Record<string, string> = {};
  let navigationObservedHeaders: Record<string, string> = {};
  let cdpNavigationObservedHeaders: Record<string, string> = {};
  const server = createServer((request, response) => {
    if (request.url?.startsWith("/api/check") || request.url?.startsWith("/api/xhr-check")) {
      latestHeaders = request.headers;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ ok: true }));
      return;
    }
    if (request.url?.startsWith("/page-check")) {
      latestHeaders = request.headers;
      response.setHeader("content-type", "text/html;charset=utf-8");
      response.end("<!doctype html><title>Flamingo document check</title>");
      return;
    }

    response.setHeader("content-type", "text/html;charset=utf-8");
    response.end("<!doctype html><title>Flamingo proxy E2E</title>");
  });
  const port = await test.step("start local target server", async () => await listen(server));
  const userDataDir = await mkdtemp(path.join(tmpdir(), "flamingo-extension-e2e-"));
  const extensionPath = path.resolve("build");
  const context = await test.step(
    "launch Chromium with the built extension",
    async () =>
      await chromium.launchPersistentContext(userDataDir, {
        headless: true,
        channel: "chromium",
        args: [
          "--headless=new",
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
        ],
      })
  );

  try {
    const serviceWorker = await test.step(
      "resolve extension service worker",
      async () =>
        context.serviceWorkers()[0] ??
        (await context.waitForEvent("serviceworker", { timeout: 10_000 }))
    );
    const extensionId = new URL(serviceWorker.url()).host;
    const now = Date.now();
    const extensionPage = await test.step("open extension page", async () => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/home.html`, {
        waitUntil: "domcontentloaded",
        timeout: 10_000,
      });
      return page;
    });
    await test.step(
      "persist a proxy rule and ask background to sync DNR",
      async () =>
        await extensionPage.evaluate(
          async ({ rule }) => {
            await chrome.storage.local.set({
              STORAGE_MODE: "local",
              WORKING: true,
              rules_storage_key: [rule],
            });
            await chrome.runtime.sendMessage({
              type: "FLAMINGO_SYNC_ACTION_STATE",
              enabledRuleCount: 1,
              isWorking: true,
            });
          },
          {
            rule: {
              id: 8801,
              priority: 1,
              name: "real-proxy",
              create: now,
              update: now,
              enable: true,
              action: {
                type: "modifyHeaders",
                requestHeaders: [
                  {
                    enabled: true,
                    operation: "set",
                    header: "x-use-ppe",
                    value: "1",
                  },
                  {
                    enabled: false,
                    operation: "set",
                    header: "x-disabled-proxy",
                    value: "should-not-appear",
                  },
                  {
                    enabled: true,
                    operation: "set",
                    header: "x-tt-env",
                    value: "ppe_magic_2026",
                  },
                ],
              },
              condition: {
                regexFilter: "*",
                resourceTypes: ["xmlhttprequest"],
              },
              uiActionType: "modifyHeaders",
            },
          }
        ),
      { timeout: 10_000 }
    );
    await test.step("assert DNR rule is installed", async () => {
      await expect
        .poll(async () => {
          return await extensionPage.evaluate(async () => {
            return await chrome.declarativeNetRequest.getDynamicRules();
          });
        })
        .toEqual([
          expect.objectContaining({
            id: 8801,
            condition: expect.objectContaining({
              regexFilter: "^.*$",
              resourceTypes: expect.arrayContaining(["main_frame", "xmlhttprequest"]),
            }),
            action: expect.objectContaining({
              requestHeaders: [
                {
                  operation: "set",
                  header: "x-use-ppe",
                  value: "1",
                },
                {
                  operation: "set",
                  header: "x-tt-env",
                  value: "ppe_magic_2026",
                },
              ],
            }),
          }),
        ]);
    });

    const page = await test.step("open local page", async () => {
      const page = await context.newPage();
      page.on("request", (request) => {
        if (request.url().includes("/api/check")) {
          pageObservedHeaders = request.headers();
        }
        if (request.url().includes("/api/xhr-check")) {
          xhrObservedHeaders = request.headers();
        }
        if (request.url().includes("/page-check")) {
          navigationObservedHeaders = request.headers();
        }
      });
      await page.goto(`http://127.0.0.1:${port}/`, {
        waitUntil: "domcontentloaded",
        timeout: 10_000,
      });
      const cdpSession = await context.newCDPSession(page);
      await cdpSession.send("Network.enable");
      const cdpRequestUrls = new Map<string, string>();
      cdpSession.on("Network.requestWillBeSent", (event) => {
        cdpRequestUrls.set(event.requestId, event.request.url);
      });
      cdpSession.on("Network.requestWillBeSentExtraInfo", (event) => {
        if (!cdpRequestUrls.get(event.requestId)?.includes("/page-check")) {
          return;
        }
        const headers = Object.fromEntries(
          Object.entries(event.headers).map(([key, value]) => [key.toLowerCase(), String(value)])
        );
        cdpNavigationObservedHeaders = headers;
      });
      return page;
    });

    await test.step("assert real request headers are modified", async () => {
      await expect
        .poll(async () => {
          latestHeaders = {};
          await page.evaluate(async () => {
            await fetch("/api/check");
          });
          return latestHeaders["x-use-ppe"];
        })
        .toBe("1");
    });

    expect(latestHeaders["x-tt-env"]).toBe("ppe_magic_2026");
    expect(latestHeaders["x-disabled-proxy"]).toBeUndefined();
    expect(pageObservedHeaders["x-use-ppe"]).toBe("1");
    expect(pageObservedHeaders["x-tt-env"]).toBe("ppe_magic_2026");

    await test.step("assert XHR request headers are visible", async () => {
      latestHeaders = {};
      await page.evaluate(async () => {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", "/api/xhr-check");
          xhr.onload = () => resolve();
          xhr.onerror = () => reject(new Error("xhr failed"));
          xhr.send();
        });
      });
      expect(latestHeaders["x-use-ppe"]).toBe("1");
      expect(latestHeaders["x-tt-env"]).toBe("ppe_magic_2026");
      expect(xhrObservedHeaders["x-use-ppe"]).toBe("1");
      expect(xhrObservedHeaders["x-tt-env"]).toBe("ppe_magic_2026");
    });

    await test.step("assert document navigation headers are modified", async () => {
      latestHeaders = {};
      await page.goto(`http://127.0.0.1:${port}/page-check`, {
        waitUntil: "domcontentloaded",
        timeout: 10_000,
      });
      expect(latestHeaders["x-use-ppe"]).toBe("1");
      expect(latestHeaders["x-tt-env"]).toBe("ppe_magic_2026");
      expect(navigationObservedHeaders["x-use-ppe"]).toBeUndefined();
      expect(cdpNavigationObservedHeaders["x-use-ppe"]).toBe("1");
      expect(cdpNavigationObservedHeaders["x-tt-env"]).toBe("ppe_magic_2026");
    });
  } finally {
    await context.close();
    await rm(userDataDir, { recursive: true, force: true });
    await closeServer(server);
  }
});
