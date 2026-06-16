import { describe, expect, test } from "bun:test";
import {
  addKeys,
  applySingleActiveSelection,
  deepClone,
  filterEditContent,
  generateId,
  obj2str,
  padZero,
  removeKeys,
  str2obj,
  throttle,
} from "../src/utils";
import { getDefaultMockResponseBody } from "../src/utils/mock";
import type { Rule } from "../src/utils/types";
import { normalizeRegexFilter } from "../src/utils/urlPattern";

describe("padZero", () => {
  test("pads single digit numbers", () => {
    expect(padZero(0)).toBe("00");
    expect(padZero(9)).toBe("09");
  });

  test("keeps double digit numbers untouched", () => {
    expect(padZero(10)).toBe("10");
    expect(padZero(59)).toBe("59");
  });
});

describe("generateId", () => {
  test("returns a positive number", () => {
    expect(generateId()).toBeGreaterThan(0);
  });

  test("returns unique ids on consecutive calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("obj2str / str2obj", () => {
  test("round-trips an object", () => {
    const value = { a: 1, b: ["x", "y"], c: { d: true } };
    expect(str2obj<typeof value>(obj2str(value))).toEqual(value);
  });

  test("obj2str pretty prints with two spaces", () => {
    expect(obj2str({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
});

describe("mock helpers", () => {
  test("default mock response body is valid JSON", () => {
    expect(JSON.parse(getDefaultMockResponseBody())).toMatchObject({
      code: 0,
      message: "ok",
    });
  });
});

describe("normalizeRegexFilter", () => {
  test("keeps explicit regular expressions unchanged", () => {
    expect(normalizeRegexFilter("^https://example\\.com/api(\\?.*)?$")).toBe(
      "^https://example\\.com/api(\\?.*)?$"
    );
  });

  test("converts URL wildcard patterns to regular expressions", () => {
    const regexFilter = normalizeRegexFilter("https://magic-cn.bytedance.net/*");
    expect(regexFilter).toBe("^https://magic-cn\\.bytedance\\.net/.*$");
    expect(new RegExp(regexFilter).test("https://magic-cn.bytedance.net/path/api")).toBe(true);
  });

  test("converts plain URL patterns to prefix regular expressions", () => {
    const regexFilter = normalizeRegexFilter("https://magic-cn.bytedance.net/");
    expect(regexFilter).toBe("^https://magic-cn\\.bytedance\\.net/.*$");
    expect(new RegExp(regexFilter).test(
      "https://magic-cn.bytedance.net/api/alading_card/getAladingCardInfo"
    )).toBe(true);
  });

  test("repairs generated exact-origin regular expressions to prefix matches", () => {
    const regexFilter = normalizeRegexFilter("^https://magic-cn\\.bytedance\\.net/$");
    expect(regexFilter).toBe("^https://magic-cn\\.bytedance\\.net/.*$");
    expect(new RegExp(regexFilter).test(
      "https://magic-cn.bytedance.net/api/alading_card/getAladingCardInfo"
    )).toBe(true);
  });

  test("converts a bare wildcard to a match-all regular expression", () => {
    const regexFilter = normalizeRegexFilter("*");
    expect(regexFilter).toBe("^.*$");
    expect(new RegExp(regexFilter).test("https://magic-cn.bytedance.net/path/api")).toBe(true);
  });
});

describe("deepClone", () => {
  test("clones nested objects without sharing references", () => {
    const source = { a: { b: 1 }, list: [{ c: 2 }] };
    const clone = deepClone(source);
    expect(clone).toEqual(source);
    expect(clone).not.toBe(source);
    expect(clone.a).not.toBe(source.a);
    expect(clone.list[0]).not.toBe(source.list[0]);
  });

  test("handles circular references", () => {
    const node: Record<string, unknown> = { name: "root" };
    node.self = node;
    const clone = deepClone(node);
    expect(clone.self).toBe(clone);
  });

  test("clones Date and RegExp", () => {
    const date = new Date(0);
    const regexp = /abc/gi;
    expect(deepClone(date)).toEqual(date);
    expect(deepClone(date)).not.toBe(date);
    expect(deepClone(regexp).source).toBe("abc");
  });
});

describe("addKeys / removeKeys", () => {
  test("removeKeys strips meta fields", () => {
    const target: Record<string, unknown> = {
      id: 1,
      name: "x",
      create: 1,
      update: 1,
      enable: true,
      action: { type: "block" },
    };
    removeKeys(target);
    expect(target).toEqual({ action: { type: "block" } });
  });

  test("addKeys copies meta fields and refreshes update", () => {
    const target: Record<string, unknown> = {};
    const source = { id: 7, name: "rule", create: 100, update: 100, enable: false };
    addKeys(target, source);
    expect(target.id).toBe(7);
    expect(target.name).toBe("rule");
    expect(target.create).toBe(100);
    expect(target.enable).toBe(false);
    expect(typeof target.update).toBe("number");
    expect(target.update as number).toBeGreaterThanOrEqual(100);
  });
});

describe("filterEditContent", () => {
  const baseRule: Rule = {
    id: 1,
    name: "demo",
    create: 1,
    update: 1,
    enable: true,
    action: { type: "block" } as Rule["action"],
    condition: { regexFilter: "abc" },
  };

  test("removes meta fields from a rule but keeps original intact", () => {
    const filtered = filterEditContent(baseRule) as Record<string, unknown>;
    expect(filtered).not.toHaveProperty("id");
    expect(filtered).not.toHaveProperty("name");
    expect(filtered).toHaveProperty("action");
    expect(baseRule.id).toBe(1);
  });
});

describe("applySingleActiveSelection", () => {
  const standalone = (id: number, enable: boolean): Rule => ({
    id,
    name: `rule-${id}`,
    create: 1,
    update: 1,
    enable,
    action: { type: "block" } as Rule["action"],
    condition: { regexFilter: `rule-${id}` },
  });

  const grouped = (id: number, groupId: number, groupEnabled: boolean): Rule => ({
    ...standalone(id, true),
    groupId,
    groupName: `group-${groupId}`,
    groupEnabled,
  });

  test("enables only the selected standalone rule and disables the rest", () => {
    const rules = [standalone(1, true), standalone(2, true), standalone(3, false)];
    const next = applySingleActiveSelection(rules, rules[2]);
    expect(next.map((rule) => rule.enable)).toEqual([false, false, true]);
  });

  test("enables only the selected group and disables other groups and rules", () => {
    const rules = [
      standalone(1, true),
      grouped(2, 100, true),
      grouped(3, 100, true),
      grouped(4, 200, true),
    ];
    const next = applySingleActiveSelection(rules, rules[3]);
    expect(next[0].enable).toBe(false);
    expect(next[1].groupEnabled).toBe(false);
    expect(next[2].groupEnabled).toBe(false);
    expect(next[3].groupEnabled).toBe(true);
  });

  test("disables everything when nothing is selected and keeps untouched rules identical", () => {
    const rules = [standalone(1, false), grouped(2, 100, false)];
    const next = applySingleActiveSelection(rules, null);
    expect(next[0]).toBe(rules[0]);
    expect(next[1]).toBe(rules[1]);
  });
});

describe("throttle", () => {
  test("invokes immediately and blocks subsequent calls within the window", async () => {
    let calls = 0;
    const throttled = throttle(() => {
      calls += 1;
    }, 20);
    throttled();
    throttled();
    throttled();
    expect(calls).toBe(1);
    await new Promise((resolve) => setTimeout(resolve, 30));
    throttled();
    expect(calls).toBe(2);
  });

  test("forwards arguments to the wrapped function", () => {
    let received: number[] = [];
    const throttled = throttle((...args: number[]) => {
      received = args;
    });
    throttled(1, 2, 3);
    expect(received).toEqual([1, 2, 3]);
  });
});
