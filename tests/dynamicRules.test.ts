import { describe, expect, test } from "bun:test";

(globalThis as unknown as { chrome: unknown }).chrome = {
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
  },
};

const { toDynamicRule } = await import("../src/utils/dynamicRules");
import type { Rule } from "../src/utils/types";

describe("toDynamicRule", () => {
  test("normalizes URL wildcard conditions and strips disabled header operations", () => {
    const dynamicRule = toDynamicRule({
      id: 1,
      name: "magic",
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
          {
            enabled: false,
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            header: "x-tt-env",
            value: "disabled",
          },
          {
            enabled: true,
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            header: "x-tt-env",
            value: "ppe_magic_2026",
          },
        ],
      } as unknown as Rule["action"],
      condition: {
        regexFilter: "https://magic-cn.bytedance.net/*",
      },
      uiActionType: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
    });

    expect(dynamicRule?.condition.regexFilter).toBe("^https://magic-cn\\.bytedance\\.net/.*$");
    expect(
      new RegExp(dynamicRule?.condition.regexFilter ?? "").test(
        "https://magic-cn.bytedance.net/api/user"
      )
    ).toBe(true);
    expect(dynamicRule?.condition.resourceTypes).toContain(
      chrome.declarativeNetRequest.ResourceType.MAIN_FRAME
    );
    expect(dynamicRule?.condition.resourceTypes).toContain(
      chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST
    );
    expect(dynamicRule?.action).toEqual({
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          header: "x-use-ppe",
          value: "1",
        },
        {
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          header: "x-tt-env",
          value: "ppe_magic_2026",
        },
      ],
    });
  });

  test("does not emit modifyHeaders rules when all header operations are disabled", () => {
    const dynamicRule = toDynamicRule({
      id: 2,
      name: "disabled",
      create: 1,
      update: 1,
      enable: true,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          {
            enabled: false,
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            header: "x-use-ppe",
            value: "1",
          },
        ],
      } as unknown as Rule["action"],
      condition: {
        regexFilter: "https://magic-cn.bytedance.net/*",
      },
      uiActionType: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
    });

    expect(dynamicRule).toBeNull();
  });

  test("normalizes bare wildcard conditions to match-all regular expressions", () => {
    const dynamicRule = toDynamicRule({
      id: 3,
      name: "match-all",
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
    });

    expect(dynamicRule?.condition.regexFilter).toBe("^.*$");
    expect(
      new RegExp(dynamicRule?.condition.regexFilter ?? "").test(
        "https://magic-cn.bytedance.net/api/user"
      )
    ).toBe(true);
  });

  test("overrides stale resourceTypes for non-mock DNR rules", () => {
    const dynamicRule = toDynamicRule({
      id: 4,
      name: "block-page",
      create: 1,
      update: 1,
      enable: true,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.BLOCK,
      } as Rule["action"],
      condition: {
        regexFilter: "*",
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
      },
      uiActionType: chrome.declarativeNetRequest.RuleActionType.BLOCK,
    });

    expect(dynamicRule?.condition.resourceTypes).toContain(
      chrome.declarativeNetRequest.ResourceType.MAIN_FRAME
    );
    expect(dynamicRule?.condition.resourceTypes).toContain(
      chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST
    );
  });

  test("repairs generated exact-origin conditions before emitting DNR rules", () => {
    const dynamicRule = toDynamicRule({
      id: 5,
      name: "exact-origin",
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
        regexFilter: "^https://magic-cn\\.bytedance\\.net/$",
      },
      uiActionType: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
    });

    expect(dynamicRule?.condition.regexFilter).toBe("^https://magic-cn\\.bytedance\\.net/.*$");
    expect(
      new RegExp(dynamicRule?.condition.regexFilter ?? "").test(
        "https://magic-cn.bytedance.net/api/alading_card/getAladingCardInfo"
      )
    ).toBe(true);
  });

  test("does not emit rules from disabled groups", () => {
    const dynamicRule = toDynamicRule({
      id: 6,
      name: "group-disabled",
      create: 1,
      update: 1,
      enable: true,
      groupId: 10,
      groupName: "Proxy Group",
      groupEnabled: false,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.BLOCK,
      } as Rule["action"],
      condition: {
        regexFilter: "*",
      },
      uiActionType: chrome.declarativeNetRequest.RuleActionType.BLOCK,
    });

    expect(dynamicRule).toBeNull();
  });
});
