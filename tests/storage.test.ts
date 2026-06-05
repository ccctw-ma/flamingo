import { beforeEach, describe, expect, test } from "bun:test";

// In-memory chrome.storage.local mock installed before importing the module under test.
const store = new Map<string, unknown>();

function readKeys(keys: string | string[] | Record<string, unknown>) {
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
        return readKeys(keys);
      },
      async set(obj: Record<string, unknown>) {
        for (const [key, value] of Object.entries(obj)) {
          store.set(key, value);
        }
      },
    },
  },
};

const {
  GROUPS_STORAGE_KEY,
  RULES_STORAGE_KEY,
  SELECTED_KEY,
  DEMO_GROUP,
  DEMO_RULE,
} = await import("../src/utils/constants");
const storage = await import("../src/utils/storage");
const { TYPE } = await import("../src/utils/types");
import type { Group, Rule } from "../src/utils/types";

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

function makeGroup(id: number, name: string): Group {
  return { id, name, enable: false, create: 1, update: 1, rules: [] };
}

beforeEach(() => {
  store.clear();
});

describe("local key/value helpers", () => {
  test("set then get a single key", async () => {
    await storage.localSetBySingleKey("foo", { bar: 1 });
    expect(await storage.localGetBySingleKey("foo")).toEqual({ bar: 1 });
  });
});

describe("groups CRUD", () => {
  test("returns the demo group when storage is empty", async () => {
    const groups = await storage.getLocalGroups();
    expect(groups).toEqual([DEMO_GROUP]);
  });

  test("addGroup appends to existing groups", async () => {
    await storage.setLocalGroups([makeGroup(1, "a")]);
    await storage.addGroup(makeGroup(2, "b"));
    const groups = await storage.getLocalGroups();
    expect(groups.map((g: Group) => g.id)).toEqual([1, 2]);
  });

  test("updateGroups overrides only the matching group", async () => {
    await storage.setLocalGroups([makeGroup(1, "a"), makeGroup(2, "b")]);
    await storage.updateGroups({ ...makeGroup(2, "b"), name: "renamed" });
    const groups = await storage.getLocalGroups();
    expect(groups.find((g: Group) => g.id === 2)?.name).toBe("renamed");
    expect(groups.find((g: Group) => g.id === 1)?.name).toBe("a");
  });

  test("deleteGroup removes by id", async () => {
    await storage.setLocalGroups([makeGroup(1, "a"), makeGroup(2, "b")]);
    await storage.deleteGroup(makeGroup(1, "a"));
    const groups = await storage.getLocalGroups();
    expect(groups.map((g: Group) => g.id)).toEqual([2]);
  });

  test("persists under the expected storage key", async () => {
    await storage.setLocalGroups([makeGroup(9, "x")]);
    expect(store.has(GROUPS_STORAGE_KEY)).toBe(true);
  });
});

describe("rules CRUD", () => {
  test("returns demo rules when storage is empty", async () => {
    const rules = await storage.getLocalRules();
    expect(rules[0].id).toBe(DEMO_RULE.id);
    expect(rules.length).toBeGreaterThanOrEqual(1);
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
    expect(store.has(RULES_STORAGE_KEY)).toBe(true);
  });
});

describe("selected state", () => {
  test("defaults to the demo group selection", async () => {
    const [type, selected] = await storage.getLocalSelected();
    expect(type).toBe(TYPE.Group);
    expect(selected).toEqual(DEMO_GROUP);
  });

  test("round-trips a selection", async () => {
    const rule = makeRule(5, "selected");
    await storage.setLocalSelected(TYPE.Rule, rule);
    const [type, selected] = await storage.getLocalSelected();
    expect(type).toBe(TYPE.Rule);
    expect(selected).toEqual(rule);
    expect(store.has(SELECTED_KEY)).toBe(true);
  });
});
