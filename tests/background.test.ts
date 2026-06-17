import { beforeAll, beforeEach, describe, expect, test } from "bun:test";

type BeforeSendHeadersHandler = (
  details: chrome.webRequest.WebRequestHeadersDetails
) => chrome.webRequest.BlockingResponse | undefined;

type RuntimeMessageHandler = (message: unknown) => void;
type StorageChangeHandler = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: "sync" | "local" | "managed" | "session"
) => void;

const localStore = new Map<string, unknown>();
const syncStore = new Map<string, unknown>();
const dynamicRules: chrome.declarativeNetRequest.Rule[] = [];
const actionCalls: Array<{ badgeText?: chrome.action.BadgeTextDetails }> = [];

let beforeSendHeadersHandler: BeforeSendHeadersHandler | undefined;
let runtimeMessageHandler: RuntimeMessageHandler | undefined;
let storageChangeHandler: StorageChangeHandler | undefined;

function readKeys(store: Map<string, unknown>, keys: string | string[] | Record<string, unknown>) {
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
  return result;
}

(globalThis as unknown as { chrome: unknown }).chrome = {
  action: {
    setIcon: () => undefined,
    setBadgeBackgroundColor: () => undefined,
    setBadgeText: (details: chrome.action.BadgeTextDetails) => {
      actionCalls.push({ badgeText: details });
    },
  },
  runtime: {
    onMessage: {
      addListener: (handler: RuntimeMessageHandler) => {
        runtimeMessageHandler = handler;
      },
    },
  },
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
    getDynamicRules: async () => dynamicRules,
    updateDynamicRules: async ({
      addRules,
      removeRuleIds,
    }: chrome.declarativeNetRequest.UpdateRuleOptions) => {
      for (let index = dynamicRules.length - 1; index >= 0; index -= 1) {
        if (removeRuleIds?.includes(dynamicRules[index].id)) {
          dynamicRules.splice(index, 1);
        }
      }
      dynamicRules.push(...(addRules ?? []));
    },
    setExtensionActionOptions: () => undefined,
  },
  storage: {
    local: {
      async get(keys: string | string[] | Record<string, unknown>) {
        return readKeys(localStore, keys);
      },
      async set(obj: Record<string, unknown>) {
        for (const [key, value] of Object.entries(obj)) {
          localStore.set(key, value);
        }
      },
    },
    sync: {
      async get(keys: string | string[] | Record<string, unknown>) {
        return readKeys(syncStore, keys);
      },
      async set(obj: Record<string, unknown>) {
        for (const [key, value] of Object.entries(obj)) {
          syncStore.set(key, value);
        }
      },
    },
    onChanged: {
      hasListener: () => false,
      removeListener: () => undefined,
      addListener: (handler: StorageChangeHandler) => {
        storageChangeHandler = handler;
      },
    },
  },
  webRequest: {
    onBeforeSendHeaders: {
      hasListener: (handler: BeforeSendHeadersHandler) => beforeSendHeadersHandler === handler,
      removeListener: (handler: BeforeSendHeadersHandler) => {
        if (beforeSendHeadersHandler === handler) {
          beforeSendHeadersHandler = undefined;
        }
      },
      addListener: (handler: BeforeSendHeadersHandler) => {
        beforeSendHeadersHandler = handler;
      },
    },
  },
};

const { CONFIG_KEYSET, RULES_STORAGE_KEY } = await import("../src/utils/constants");
import type { Rule } from "../src/utils/types";

function makeHeaderRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 101,
    name: "headers",
    create: 1,
    update: 1,
    enable: true,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          enabled: true,
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          header: "x-use-ppe",
          value: "1",
        },
      ],
    } as unknown as Rule["action"],
    condition: {
      regexFilter: "*",
    },
    uiActionType: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
    ...overrides,
  };
}

async function flushAsyncWork() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function invokeBeforeSendHeaders(url = "https://github.com/") {
  return beforeSendHeadersHandler?.({
    url,
    requestHeaders: [{ name: "accept", value: "text/html" }],
  } as chrome.webRequest.WebRequestHeadersDetails);
}

async function syncRules() {
  storageChangeHandler?.(
    {
      [RULES_STORAGE_KEY]: {
        oldValue: undefined,
        newValue: localStore.get(RULES_STORAGE_KEY),
      },
    },
    "local"
  );
  await flushAsyncWork();
}

beforeAll(async () => {
  await import("../src/background");
  await flushAsyncWork();
});

beforeEach(() => {
  localStore.clear();
  syncStore.clear();
  dynamicRules.splice(0, dynamicRules.length);
  actionCalls.splice(0, actionCalls.length);
  localStore.set(CONFIG_KEYSET.WORKING, true);
});

describe("background webRequest runtime gating", () => {
  test("applies enabled request header rules while the global switch is on", async () => {
    localStore.set(RULES_STORAGE_KEY, [makeHeaderRule()]);
    await syncRules();

    expect(invokeBeforeSendHeaders()).toEqual({
      requestHeaders: [
        { name: "accept", value: "text/html" },
        { name: "x-use-ppe", value: "1" },
      ],
    });
  });

  test("stops applying cached webRequest rules immediately when the global switch turns off", async () => {
    localStore.set(RULES_STORAGE_KEY, [makeHeaderRule()]);
    await syncRules();
    expect(invokeBeforeSendHeaders()?.requestHeaders).toContainEqual({
      name: "x-use-ppe",
      value: "1",
    });

    runtimeMessageHandler?.({ type: "FLAMINGO_SYNC_ACTION_STATE", isWorking: false });

    expect(beforeSendHeadersHandler).toBeUndefined();
    expect(invokeBeforeSendHeaders()).toBeUndefined();
  });

  test("does not apply request header rules from disabled groups", async () => {
    localStore.set(RULES_STORAGE_KEY, [makeHeaderRule({ groupEnabled: false })]);
    await syncRules();

    expect(invokeBeforeSendHeaders()).toBeUndefined();
    expect(beforeSendHeadersHandler).toBeUndefined();
  });
});
