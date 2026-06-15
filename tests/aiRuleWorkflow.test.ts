import { beforeEach, describe, expect, test } from "bun:test";

const localStore = new Map<string, unknown>();

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
    isRegexSupported(
      input: { regex: string },
      callback: (result: { isSupported: boolean; reason?: string }) => void
    ) {
      try {
        new RegExp(input.regex);
        callback({ isSupported: true });
      } catch (error) {
        callback({
          isSupported: false,
          reason: error instanceof Error ? error.message : "invalid regex",
        });
      }
    },
  },
  storage: {
    local: {
      async get(key: string) {
        return localStore.has(key) ? { [key]: localStore.get(key) } : {};
      },
      async set(obj: Record<string, unknown>) {
        for (const [key, value] of Object.entries(obj)) {
          localStore.set(key, value);
        }
      },
    },
  },
};

const { AI_SETTINGS_STORAGE_KEY, getAISettings, setAISettings } = await import("../src/ai/runtime");
const { runRuleDraftWorkflow, verifyRuleDraftPlan } = await import("../src/ai/workflows/ruleDraft");
const { ruleDraftToNewRule, ruleDraftToRule, validateRuleDraft, verifyRuleDraft } =
  await import("../src/ai/validators");
const { CUSTOM_ACTION } = await import("../src/utils/types");
import type { Rule } from "../src/utils/types";
import type { RuleDraftAgent } from "../src/ai/provider";

function makeRule(): Rule {
  return {
    id: 10,
    name: "Current rule",
    create: 1,
    update: 1,
    enable: true,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.BLOCK,
    },
    condition: {
      regexFilter: "*",
    },
  };
}

beforeEach(() => {
  localStore.clear();
});

describe("AI settings storage", () => {
  test("persists provider-specific API keys under chrome.storage.local", async () => {
    await setAISettings({
      enabled: true,
      provider: "deepseek",
      baseUrl: "https://malicious.example.com/v1",
      model: "deepseek-chat",
      apiKey: "deepseek-secret",
      apiKeys: {
        gpt: "openai-secret",
        deepseek: "deepseek-secret",
      },
    });

    expect(localStore.has(AI_SETTINGS_STORAGE_KEY)).toBe(true);
    expect(await getAISettings()).toEqual({
      enabled: true,
      provider: "deepseek",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      apiKey: "deepseek-secret",
      apiKeys: {
        gpt: "openai-secret",
        deepseek: "deepseek-secret",
      },
    });
  });

  test("migrates legacy single-key settings to the selected provider only", async () => {
    localStore.set(AI_SETTINGS_STORAGE_KEY, {
      enabled: true,
      provider: "gpt",
      baseUrl: "https://custom.example.com/v1",
      model: "custom-model",
      apiKey: "legacy-openai-key",
    });

    expect(await getAISettings()).toEqual({
      enabled: true,
      provider: "gpt",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      apiKey: "legacy-openai-key",
      apiKeys: {
        gpt: "legacy-openai-key",
        deepseek: "",
      },
    });
  });
});

describe("AI provider request", () => {
  test("retries without JSON mode when the selected model rejects response_format", async () => {
    const { createProviderAgent } = await import("../src/ai/provider");
    const requests: unknown[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(JSON.parse(String(init?.body)));
      if (requests.length === 1) {
        return new Response("unsupported response_format", { status: 400 });
      }

      return Response.json({
        choices: [
          {
            message: {
              content: '{"ok":true}',
            },
          },
        ],
      });
    }) as typeof fetch;

    try {
      const agent = createProviderAgent({
        enabled: true,
        provider: "gpt",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o",
        apiKey: "openai-secret",
        apiKeys: {
          gpt: "openai-secret",
          deepseek: "",
        },
      });

      await expect(
        agent({
          kind: "draft",
          system: "Return JSON",
          user: "Generate",
        })
      ).resolves.toEqual({ ok: true });
      expect(requests).toHaveLength(2);
      expect(requests[0]).toMatchObject({ response_format: { type: "json_object" } });
      expect(requests[1]).not.toHaveProperty("response_format");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("AI rule draft validator", () => {
  test("verifies drafts with supported headers and ignores malformed header entries", () => {
    const draft = verifyRuleDraft({
      name: "Header rule",
      action: "modifyHeaders",
      regexFilter: "https://api.example.com/*",
      requestHeaders: [
        { header: "x-a", operation: "append", value: "1", enabled: false },
        { header: "x-invalid", operation: "bad", value: "ignored" },
        "bad-entry",
      ],
      responseHeaders: [{ header: "x-remove", operation: "remove" }],
      explanation: "demo",
    });

    expect(draft).toEqual({
      name: "Header rule",
      action: "modifyHeaders",
      regexFilter: "https://api.example.com/*",
      requestHeaders: [{ header: "x-a", operation: "append", value: "1", enabled: false }],
      responseHeaders: [{ header: "x-remove", operation: "remove", enabled: true }],
      explanation: "demo",
    });
  });

  test("rejects invalid draft payloads and actions", () => {
    expect(() => verifyRuleDraft(null)).toThrow("Rule draft must be a JSON object");
    expect(() => verifyRuleDraft({ action: "allow" })).toThrow("Rule draft action is invalid");
  });

  test("defaults modify header drafts to all requests when no filter is provided", () => {
    const draft = verifyRuleDraft({
      name: "PPE headers",
      action: "modifyHeaders",
      requestHeaders: [{ header: "x-use-ppe", operation: "set", value: "1" }],
    });

    expect(draft.regexFilter).toBe("*");
  });

  test("converts mock drafts into disabled Flamingo rules", async () => {
    const currentRule = makeRule();
    const validation = await validateRuleDraft(
      {
        name: "Mock user",
        action: "mock",
        regexFilter: "https://api.example.com/user",
        mockResponse: {
          name: "demo",
        },
      },
      currentRule
    );

    expect(validation.ok).toBe(true);
    if (!validation.ok) {
      return;
    }

    const rule = ruleDraftToRule(validation.draft, currentRule);
    expect(rule.enable).toBe(false);
    expect(rule.uiActionType).toBe(CUSTOM_ACTION.MOCK);
    expect(rule.condition.regexFilter).toBe("^https://api\\.example\\.com/user.*$");
    expect(JSON.parse(rule.mockResponse?.body ?? "{}")).toEqual({ name: "demo" });
  });

  test("rejects remove header operations with values", async () => {
    const validation = await validateRuleDraft(
      {
        name: "Remove debug header",
        action: "modifyHeaders",
        regexFilter: "*",
        requestHeaders: [
          {
            header: "x-debug",
            operation: "remove",
            value: "1",
          },
        ],
      },
      makeRule()
    );

    expect(validation.ok).toBe(false);
    if (validation.ok) {
      return;
    }

    expect(validation.issues).toContainEqual({
      path: "requestHeaders.0.value",
      message: "Remove header operations must not include a value",
    });
  });

  test("converts redirect and header drafts into disabled DNR rules", async () => {
    const extensionRedirect = ruleDraftToRule(
      {
        name: "Local redirect",
        action: "redirect",
        regexFilter: "https://api.example.com/local",
        redirectUrl: "/mock.json",
      },
      makeRule()
    );
    expect(extensionRedirect.uiActionType).toBe(
      chrome.declarativeNetRequest.RuleActionType.REDIRECT
    );
    expect(extensionRedirect.action.redirect).toEqual({ extensionPath: "/mock.json" });

    const headerRule = ruleDraftToNewRule({
      name: "Headers",
      action: "modifyHeaders",
      regexFilter: "https://api.example.com/headers",
      requestHeaders: [{ header: "x-a", operation: "append", value: "1", enabled: false }],
      responseHeaders: [{ header: "x-b", operation: "remove" }],
    });

    expect(headerRule.enable).toBe(false);
    expect(headerRule.action.type).toBe(chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS);
    const requestHeaders = headerRule.action.requestHeaders as Array<{
      enabled: boolean;
      operation: chrome.declarativeNetRequest.HeaderOperation;
      header: string;
      value?: string;
    }>;
    const responseHeaders = headerRule.action.responseHeaders as Array<{
      enabled: boolean;
      operation: chrome.declarativeNetRequest.HeaderOperation;
      header: string;
      value?: string;
    }>;
    expect(requestHeaders).toEqual([
      {
        enabled: false,
        operation: chrome.declarativeNetRequest.HeaderOperation.APPEND,
        header: "x-a",
        value: "1",
      },
    ]);
    expect(responseHeaders).toEqual([
      {
        enabled: true,
        operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
        header: "x-b",
      },
    ]);
  });

  test("reports validation issues for empty filters, invalid regex and missing action details", async () => {
    const missingFilter = await validateRuleDraft(
      {
        name: "Missing filter",
        action: "redirect",
        regexFilter: "",
        redirectUrl: "",
      },
      makeRule()
    );
    expect(missingFilter.ok).toBe(false);
    if (!missingFilter.ok) {
      expect(missingFilter.issues.map((issue) => issue.path)).toEqual([
        "regexFilter",
        "redirectUrl",
      ]);
    }

    const invalidRegex = await validateRuleDraft(
      {
        name: "Bad regex",
        action: "block",
        regexFilter: "[",
      },
      makeRule(),
      async () => ({ ok: false, reason: "bad regex" })
    );
    expect(invalidRegex.ok).toBe(false);
    if (!invalidRegex.ok) {
      expect(invalidRegex.issues).toContainEqual({
        path: "regexFilter",
        message: "bad regex",
      });
    }

    const missingHeaderValue = await validateRuleDraft(
      {
        name: "Missing header",
        action: "modifyHeaders",
        regexFilter: "*",
        requestHeaders: [{ header: "", operation: "set", value: "" }],
      },
      makeRule()
    );
    expect(missingHeaderValue.ok).toBe(false);
    if (!missingHeaderValue.ok) {
      expect(missingHeaderValue.issues.map((issue) => issue.path)).toEqual([
        "requestHeaders.0.header",
        "requestHeaders.0.value",
      ]);
    }
  });
});

describe("runRuleDraftWorkflow", () => {
  test("verifies draft plans and rejects plans without valid rules", () => {
    expect(
      verifyRuleDraftPlan({
        groupName: "非常长的中文分组名称用于截断",
        rules: [
          {
            action: "block",
            target: "https://api.example.com",
            needsMockResponse: true,
            needsRedirectUrl: false,
            needsHeaders: true,
          },
          { action: "invalid", target: "ignored" },
        ],
        confidence: 2,
        notes: ["keep"],
      })
    ).toEqual({
      generationMode: "rule",
      groupName: "非常长的中文分组名称",
      rules: [
        {
          action: "block",
          target: "https://api.example.com",
          needsMockResponse: true,
          needsRedirectUrl: false,
          needsHeaders: true,
        },
      ],
      confidence: 1,
      notes: ["keep"],
    });

    expect(() => verifyRuleDraftPlan({ rules: [{ action: "invalid" }] })).toThrow(
      "Rule draft plan must include at least one valid rule"
    );
  });

  test("returns settings issue when no agent or provider settings are available", async () => {
    await expect(
      runRuleDraftWorkflow({
        prompt: "block tracking",
        currentRules: [],
      })
    ).resolves.toEqual({
      ok: false,
      issues: [{ path: "settings", message: "AI provider settings are required" }],
    });
  });

  test("returns rules without repair when the generated draft is valid", async () => {
    const events: string[] = [];
    const agent: RuleDraftAgent = async (prompt) => {
      if (prompt.kind === "plan") {
        return {
          groupName: "Tracking",
          action: "block",
          target: "https://api.example.com/tracking",
          needsMockResponse: false,
          needsRedirectUrl: false,
          needsHeaders: false,
          confidence: 0.5,
          notes: ["single"],
        };
      }

      return {
        groupName: "Tracking",
        rules: [
          {
            name: "Block Tracking",
            action: "block",
            regexFilter: "https://api.example.com/tracking",
          },
        ],
      };
    };

    const result = await runRuleDraftWorkflow(
      {
        prompt: "block tracking",
        currentRules: [],
      },
      {
        agent,
        onEvent: (event) => events.push(event.type),
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.repaired).toBe(false);
    expect(result.generationMode).toBe("rule");
    expect(result.groupName).toBeUndefined();
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].groupId).toBeUndefined();
    expect(events).toContain("complete");
  });

  test("returns grouped rules when the plan explicitly asks for a group", async () => {
    const agent: RuleDraftAgent = async (prompt) => {
      if (prompt.kind === "plan") {
        return {
          generationMode: "group",
          groupName: "Magic Proxy",
          rules: [
            {
              action: "modifyHeaders",
              target: "https://api.example.com",
              needsMockResponse: false,
              needsRedirectUrl: false,
              needsHeaders: true,
            },
            {
              action: "block",
              target: "https://api.example.com/tracking",
              needsMockResponse: false,
              needsRedirectUrl: false,
              needsHeaders: false,
            },
          ],
          confidence: 0.8,
          notes: [],
        };
      }

      return {
        generationMode: "group",
        groupName: "Magic Proxy",
        rules: [
          {
            name: "API Headers",
            action: "modifyHeaders",
            regexFilter: "https://api.example.com",
            requestHeaders: [{ header: "x-use-ppe", operation: "set", value: "1" }],
          },
          {
            name: "Block Track",
            action: "block",
            regexFilter: "https://api.example.com/tracking",
          },
        ],
      };
    };

    const result = await runRuleDraftWorkflow(
      {
        prompt: "给 api 项目生成 header 和 tracking 拦截",
        currentRules: [],
      },
      { agent }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.generationMode).toBe("group");
    expect(result.groupName).toBe("Magic Proxy");
    expect(result.rules).toHaveLength(2);
  });

  test("repairs an invalid draft before returning a rule", async () => {
    const agent: RuleDraftAgent = async (prompt) => {
      if (prompt.kind === "plan") {
        return {
          groupName: "Very Long Proxy Group Name",
          rules: [
            {
              action: "redirect",
              target: "api.example.com/v1",
              needsMockResponse: false,
              needsRedirectUrl: true,
              needsHeaders: false,
            },
            {
              action: "block",
              target: "api.example.com/tracking",
              needsMockResponse: false,
              needsRedirectUrl: false,
              needsHeaders: false,
            },
          ],
          confidence: 0.9,
          notes: ["redirect user traffic"],
        };
      }

      if (prompt.kind === "draft") {
        return {
          rules: [
            {
              name: "Redirect API",
              action: "redirect",
              regexFilter: "https://api.example.com/v1",
            },
            {
              name: "Block tracking",
              action: "block",
              regexFilter: "https://api.example.com/tracking",
            },
          ],
        };
      }

      return {
        groupName: "Magic接口代理规则",
        rules: [
          {
            name: "Redirect API With Extra Words",
            action: "redirect",
            regexFilter: "https://api.example.com/v1",
            redirectUrl: "http://localhost:3000",
          },
          {
            name: "拦截追踪请求规则",
            action: "block",
            regexFilter: "https://api.example.com/tracking",
          },
        ],
      };
    };

    const result = await runRuleDraftWorkflow(
      {
        prompt: "把 api.example.com/v1 重定向到 localhost:3000",
        currentRules: [makeRule()],
        locale: "zh-CN",
      },
      { agent }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.repaired).toBe(true);
    expect(result.generationMode).toBe("group");
    expect(result.groupName).toBe("Magic接口代理规则".slice(0, 10));
    expect(result.rules).toHaveLength(2);
    expect(result.rules[0].name).toBe("Redirect API With");
    expect(result.rules[1].name).toBe("拦截追踪请求规则".slice(0, 10));
    expect(result.rules[0].enable).toBe(false);
    expect(result.rules[0].action.type).toBe(chrome.declarativeNetRequest.RuleActionType.REDIRECT);
    expect(result.rules[0].action.redirect?.regexSubstitution).toBe("http://localhost:3000");
    expect(result.rules[1].action.type).toBe(chrome.declarativeNetRequest.RuleActionType.BLOCK);
  });

  test("returns repair issues when repaired drafts still fail validation", async () => {
    const agent: RuleDraftAgent = async (prompt) => {
      if (prompt.kind === "plan") {
        return {
          groupName: "Broken",
          rules: [
            {
              action: "redirect",
              target: "https://api.example.com",
              needsMockResponse: false,
              needsRedirectUrl: true,
              needsHeaders: false,
            },
          ],
          confidence: 0.5,
          notes: [],
        };
      }

      return {
        groupName: "Broken",
        rules: [
          {
            name: "Bad Redirect",
            action: "redirect",
            regexFilter: "https://api.example.com",
          },
        ],
      };
    };

    const result = await runRuleDraftWorkflow(
      {
        prompt: "redirect api",
        currentRules: [],
      },
      { agent }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        path: "rules.0.redirectUrl",
        message: "Redirect URL is required",
      });
    }
  });
});
