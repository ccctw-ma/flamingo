import { generateId } from "../utils";
import { EMPTY_RULE } from "../utils/constants";
import { toDynamicRule } from "../utils/dynamicRules";
import { normalizeRegexFilter } from "../utils/urlPattern";
import { CUSTOM_ACTION, EditableModifyHeaderInfo, Rule } from "../utils/types";
import {
  HeaderDraft,
  HeaderDraftOperation,
  RuleDraft,
  RuleDraftAction,
  RuleDraftValidation,
  ValidationIssue,
} from "./types";

export type RegexValidator = (regex: string) => Promise<{ ok: boolean; reason?: string }>;

const ACTIONS = new Set<RuleDraftAction>(["mock", "redirect", "block", "modifyHeaders"]);
const HEADER_OPERATIONS = new Set<HeaderDraftOperation>(["set", "append", "remove"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readHeaderDraft(value: unknown): HeaderDraft | null {
  if (!isObject(value)) {
    return null;
  }

  const operation = readString(value.operation) as HeaderDraftOperation;
  if (!HEADER_OPERATIONS.has(operation)) {
    return null;
  }

  const header: HeaderDraft = {
    header: readString(value.header),
    operation,
    enabled: typeof value.enabled === "boolean" ? value.enabled : true,
  };

  if (typeof value.value === "string") {
    header.value = value.value;
  }

  return header;
}

function readHeaderDrafts(value: unknown) {
  return Array.isArray(value)
    ? value.map(readHeaderDraft).filter((header): header is HeaderDraft => Boolean(header))
    : [];
}

export function verifyRuleDraft(value: unknown): RuleDraft {
  if (!isObject(value)) {
    throw new Error("Rule draft must be a JSON object");
  }

  const action = readString(value.action) as RuleDraftAction;
  if (!ACTIONS.has(action)) {
    throw new Error("Rule draft action is invalid");
  }
  const regexFilter = readString(value.regexFilter) || (action === "modifyHeaders" ? "*" : "");

  return {
    name: readString(value.name) || "AI Draft",
    action,
    regexFilter,
    redirectUrl: readString(value.redirectUrl) || undefined,
    mockResponse: "mockResponse" in value ? value.mockResponse : undefined,
    requestHeaders: readHeaderDrafts(value.requestHeaders),
    responseHeaders: readHeaderDrafts(value.responseHeaders),
    explanation: readString(value.explanation) || undefined,
  };
}

function formatJsonValue(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return JSON.stringify(value, null, 2);
    }
  }

  return JSON.stringify(value, null, 2);
}

function toHeaderInfo(header: HeaderDraft): EditableModifyHeaderInfo {
  const operation =
    header.operation === "append"
      ? chrome.declarativeNetRequest.HeaderOperation.APPEND
      : header.operation === "remove"
        ? chrome.declarativeNetRequest.HeaderOperation.REMOVE
        : chrome.declarativeNetRequest.HeaderOperation.SET;

  return {
    enabled: header.enabled !== false,
    operation,
    header: header.header,
    ...(operation === chrome.declarativeNetRequest.HeaderOperation.REMOVE
      ? {}
      : { value: header.value ?? "" }),
  };
}

function buildRedirect(target: string): chrome.declarativeNetRequest.Redirect {
  if (target.startsWith("/")) {
    return { extensionPath: target };
  }

  return { regexSubstitution: target };
}

export function ruleDraftToRule(draft: RuleDraft, currentRule: Rule): Rule {
  const now = Date.now();
  const nextRule: Rule = {
    ...currentRule,
    name: draft.name || currentRule.name || "AI Draft",
    update: now,
    enable: false,
    condition: {
      ...currentRule.condition,
      regexFilter: normalizeRegexFilter(draft.regexFilter),
    },
  };
  delete nextRule.condition.resourceTypes;

  if (draft.action === "mock") {
    nextRule.action = {
      type: chrome.declarativeNetRequest.RuleActionType.BLOCK,
    };
    nextRule.mockResponse = {
      enabled: true,
      body: formatJsonValue(draft.mockResponse ?? {}),
    };
    nextRule.uiActionType = CUSTOM_ACTION.MOCK;
    return nextRule;
  }

  delete nextRule.mockResponse;

  if (draft.action === "redirect") {
    nextRule.action = {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: buildRedirect(draft.redirectUrl ?? ""),
    };
    nextRule.uiActionType = chrome.declarativeNetRequest.RuleActionType.REDIRECT;
    return nextRule;
  }

  if (draft.action === "modifyHeaders") {
    const requestHeaders = (draft.requestHeaders ?? []).map(toHeaderInfo);
    const responseHeaders = (draft.responseHeaders ?? []).map(toHeaderInfo);
    nextRule.action = {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      ...(requestHeaders.length ? { requestHeaders } : {}),
      ...(responseHeaders.length ? { responseHeaders } : {}),
    };
    nextRule.uiActionType = chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS;
    return nextRule;
  }

  nextRule.action = {
    type: chrome.declarativeNetRequest.RuleActionType.BLOCK,
  };
  nextRule.uiActionType = chrome.declarativeNetRequest.RuleActionType.BLOCK;
  return nextRule;
}

export function ruleDraftToNewRule(draft: RuleDraft, index = 0): Rule {
  const now = Date.now();
  return ruleDraftToRule(draft, {
    ...EMPTY_RULE,
    id: generateId() + index,
    name: draft.name || "AI Draft",
    create: now,
    update: now,
    enable: false,
  });
}

async function validateRegexWithChrome(regex: string) {
  if (!chrome.declarativeNetRequest.isRegexSupported) {
    try {
      new RegExp(regex);
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : "Invalid regex" };
    }
  }

  return await new Promise<{ ok: boolean; reason?: string }>((resolve) => {
    chrome.declarativeNetRequest.isRegexSupported({ regex }, (result) => {
      resolve({
        ok: Boolean(result.isSupported),
        reason: result.reason,
      });
    });
  });
}

function validateHeaders(
  headers: HeaderDraft[] | undefined,
  path: string,
  issues: ValidationIssue[]
) {
  for (const [index, header] of (headers ?? []).entries()) {
    const headerPath = `${path}.${index}`;
    if (!header.header.trim()) {
      issues.push({ path: `${headerPath}.header`, message: "Header name is required" });
    }
    if (header.operation === "remove" && header.value !== undefined && header.value !== "") {
      issues.push({
        path: `${headerPath}.value`,
        message: "Remove header operations must not include a value",
      });
    }
    if (header.operation !== "remove" && !readString(header.value)) {
      issues.push({
        path: `${headerPath}.value`,
        message: "Set and append header operations require a value",
      });
    }
  }
}

export async function validateRuleDraft(
  draft: RuleDraft,
  currentRule: Rule,
  validateRegex: RegexValidator = validateRegexWithChrome
): Promise<RuleDraftValidation> {
  const issues: ValidationIssue[] = [];
  const warnings: string[] = [];
  const regexFilter = normalizeRegexFilter(draft.regexFilter);

  if (!draft.regexFilter.trim()) {
    issues.push({ path: "regexFilter", message: "Regex filter is required" });
  } else {
    const regexResult = await validateRegex(regexFilter);
    if (!regexResult.ok) {
      issues.push({
        path: "regexFilter",
        message: regexResult.reason || "Regex filter is not supported by Chrome DNR",
      });
    }
  }

  if (draft.action === "mock") {
    try {
      JSON.parse(formatJsonValue(draft.mockResponse ?? {}));
    } catch {
      issues.push({ path: "mockResponse", message: "Mock response must be valid JSON" });
    }
  }

  if (draft.action === "redirect" && !draft.redirectUrl?.trim()) {
    issues.push({ path: "redirectUrl", message: "Redirect URL is required" });
  }

  if (draft.action === "modifyHeaders") {
    const requestHeaders = draft.requestHeaders ?? [];
    const responseHeaders = draft.responseHeaders ?? [];
    if (!requestHeaders.length && !responseHeaders.length) {
      issues.push({
        path: "headers",
        message: "Modify headers rules need at least one request or response header operation",
      });
    }
    validateHeaders(requestHeaders, "requestHeaders", issues);
    validateHeaders(responseHeaders, "responseHeaders", issues);
  }

  if (issues.length) {
    return { ok: false, draft, issues };
  }

  const rule = ruleDraftToRule(draft, currentRule);
  if (draft.action !== "mock" && !toDynamicRule(rule)) {
    return {
      ok: false,
      draft,
      issues: [{ path: "action", message: "Draft cannot be converted to a Chrome DNR rule" }],
    };
  }

  if (rule.enable) {
    warnings.push("AI generated rules are forced to disabled until the user enables them");
  }

  return {
    ok: true,
    draft: {
      ...draft,
      regexFilter,
    },
    warnings,
  };
}
