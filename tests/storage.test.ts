import { beforeEach, describe, expect, test } from "bun:test";

// In-memory chrome.storage.local mock installed before importing the module under test.
const localStore = new Map<string, unknown>();
const syncStore = new Map<string, unknown>();

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
  },
};

const { RULES_STORAGE_KEY, SELECTED_KEY } = await import("../src/utils/constants");
const storage = await import("../src/utils/storage");
const { TYPE } = await import("../src/utils/types");
import type { Rule } from "../src/utils/types";

function makeRule(id: number, name: string): Rule {
  return {
    id,
    name,
    create: 1,
    update: 1,
    enable: false,
    action: { type: "block" } as Rule["action"],
    condition: { regexFilter: `rule-${id}` },
  };
}

beforeEach(() => {
  localStore.clear();
  syncStore.clear();
});

describe("local key/value helpers", () => {
  test("set then get a single key", async () => {
    await storage.localSetBySingleKey("foo", { bar: 1 });
    expect(await storage.localGetBySingleKey("foo")).toEqual({ bar: 1 });
  });
});

describe("rules CRUD", () => {
  test("returns an empty list when storage is empty", async () => {
    const rules = await storage.getLocalRules();
    expect(rules).toEqual([]);
  });

  test("addRule appends and updateRules overrides", async () => {
    await storage.setLocalRules([makeRule(1, "a")]);
    await storage.addRule(makeRule(2, "b"));
    await storage.updateRules({ ...makeRule(2, "b"), name: "renamed" });
    const rules = await storage.getLocalRules();
    expect(rules.map((r: Rule) => r.id)).toEqual([1, 2]);
    expect(rules.find((r: Rule) => r.id === 2)?.name).toBe("renamed");
  });

  test("deleteRule removes by id", async () => {
    await storage.setLocalRules([makeRule(1, "a"), makeRule(2, "b")]);
    await storage.deleteRule(makeRule(2, "b"));
    const rules = await storage.getLocalRules();
    expect(rules.map((r: Rule) => r.id)).toEqual([1]);
  });

  test("persists under the expected storage key", async () => {
    await storage.setLocalRules([makeRule(3, "c")]);
    expect(localStore.has(RULES_STORAGE_KEY)).toBe(true);
  });
});

describe("selected state", () => {
  test("defaults to no selection", async () => {
    const [type, selected] = await storage.getLocalSelected();
    expect(type).toBe(TYPE.Rule);
    expect(selected).toBeNull();
  });

  test("round-trips a selection", async () => {
    const rule = makeRule(5, "selected");
    await storage.setLocalSelected(TYPE.Rule, rule);
    const [type, selected] = await storage.getLocalSelected();
    expect(type).toBe(TYPE.Rule);
    expect(selected).toEqual(rule);
    expect(localStore.has(SELECTED_KEY)).toBe(true);
  });
});

describe("storage mode", () => {
  test("defaults to local mode", async () => {
    expect(await storage.getStorageMode()).toBe("local");
  });

  test("switchStorageMode copies current data into sync storage", async () => {
    const rule = makeRule(21, "sync-rule");

    await storage.setLocalRules([rule]);
    await storage.setLocalSelected(TYPE.Rule, rule);
    await storage.setConfigValue("WORKING", false);
    await storage.setConfigValue("LOCALE", "en");

    await storage.switchStorageMode("sync");

    expect(await storage.getStorageMode()).toBe("sync");
    expect(syncStore.get(RULES_STORAGE_KEY)).toEqual([rule]);
    expect(syncStore.get(SELECTED_KEY)).toEqual([TYPE.Rule, rule]);
    expect(syncStore.get("WORKING")).toBe(false);
    expect(syncStore.get("LOCALE")).toBe("en");
  });
});
