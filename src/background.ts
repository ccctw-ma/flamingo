import { CONFIG_KEYSET, RULES_STORAGE_KEY } from "./utils/constants";
import { toDynamicRule } from "./utils/dynamicRules";
import { getConfigValue, getRules } from "./utils/storage";
import { EditableModifyHeaderInfo, Rule } from "./utils/types";
import { normalizeRegexFilter } from "./utils/urlPattern";

type WebRequestRule = {
  id: number;
  regexFilter: string;
  requestHeaders: chrome.declarativeNetRequest.ModifyHeaderInfo[];
};

let webRequestRules: WebRequestRule[] = [];

async function getIsWorking() {
  return (
    ((await getConfigValue(
      CONFIG_KEYSET.WORKING as keyof typeof import("./utils/constants").CONFIG_OBJECT
    )) as boolean | undefined) ?? true
  );
}

async function getEnabledRules() {
  const rules: Rule[] = await getRules();
  return rules.filter((rule) => rule.enable && rule.groupEnabled !== false);
}

function toWebRequestRule(rule: Rule): WebRequestRule | null {
  if (rule.action.type !== chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS) {
    return null;
  }

  const requestHeaders = (rule.action.requestHeaders as EditableModifyHeaderInfo[] | undefined)
    ?.filter((header) => header.enabled !== false)
    .map(({ enabled: _enabled, ...header }) => header);
  if (!requestHeaders?.length) {
    return null;
  }

  return {
    id: rule.id,
    regexFilter: normalizeRegexFilter(rule.condition.regexFilter ?? ""),
    requestHeaders,
  };
}

function syncWebRequestRules(enabledRules: Rule[]) {
  webRequestRules = enabledRules.flatMap((rule) => {
    const webRequestRule = toWebRequestRule(rule);
    return webRequestRule ? [webRequestRule] : [];
  });
}

function matchesWebRequestRule(rule: WebRequestRule, url: string) {
  if (!rule.regexFilter) {
    return false;
  }
  try {
    return new RegExp(rule.regexFilter).test(url);
  } catch {
    return false;
  }
}

function applyRequestHeaderOperations(
  headers: chrome.webRequest.HttpHeader[] | undefined,
  operations: chrome.declarativeNetRequest.ModifyHeaderInfo[]
) {
  const nextHeaders = [...(headers ?? [])];

  for (const operation of operations) {
    const headerName = operation.header.toLowerCase();
    const index = nextHeaders.findIndex((header) => header.name.toLowerCase() === headerName);
    if (operation.operation === chrome.declarativeNetRequest.HeaderOperation.REMOVE) {
      for (let idx = nextHeaders.length - 1; idx >= 0; idx -= 1) {
        if (nextHeaders[idx].name.toLowerCase() === headerName) {
          nextHeaders.splice(idx, 1);
        }
      }
      continue;
    }

    if (operation.operation === chrome.declarativeNetRequest.HeaderOperation.APPEND) {
      nextHeaders.push({ name: operation.header, value: operation.value ?? "" });
      continue;
    }

    if (index >= 0) {
      nextHeaders[index] = { name: operation.header, value: operation.value ?? "" };
    } else {
      nextHeaders.push({ name: operation.header, value: operation.value ?? "" });
    }
  }

  return nextHeaders;
}

const handleBeforeSendHeaders = (
  details: chrome.webRequest.WebRequestHeadersDetails
): chrome.webRequest.BlockingResponse | undefined => {
  const matchedRules = webRequestRules.filter((rule) => matchesWebRequestRule(rule, details.url));
  if (!matchedRules.length) {
    return undefined;
  }

  const requestHeaders = matchedRules.reduce(
    (headers, rule) => applyRequestHeaderOperations(headers, rule.requestHeaders),
    details.requestHeaders
  );
  return { requestHeaders };
};

async function setRules(isWorkingOverride?: boolean) {
  try {
    const enableRules = await getEnabledRules();
    const newRules = enableRules.flatMap((rule) => {
      const dynamicRule = toDynamicRule(rule);
      return dynamicRule ? [dynamicRule] : [];
    });
    const oldRules = await getCurrentDynamicRules();
    const isWorking = isWorkingOverride ?? (await getIsWorking());
    const workingRules = isWorking ? newRules : [];
    syncWebRequestRules(isWorking ? enableRules : []);
    const removeIds = oldRules.map((r) => r.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: workingRules,
      removeRuleIds: removeIds,
    });
    await syncActionState(enableRules.length, isWorking);
  } catch (err) {
    console.log("error: setRules", err);
  }
}

async function syncActionState(enabledRuleCount?: number, isWorking?: boolean) {
  const [resolvedEnabledRuleCount, resolvedIsWorking] = await Promise.all([
    enabledRuleCount === undefined
      ? getEnabledRules().then((rules) => rules.length)
      : Promise.resolve(enabledRuleCount),
    isWorking === undefined ? getIsWorking() : Promise.resolve(isWorking),
  ]);
  const iconPrefix = resolvedIsWorking ? "flamingo" : "flamingo_grey";
  chrome.action.setIcon({
    path: {
      16: `images/${iconPrefix}_16.png`,
      32: `images/${iconPrefix}_32.png`,
      48: `images/${iconPrefix}_48.png`,
      128: `images/${iconPrefix}_128.png`,
    },
  });
  chrome.action.setBadgeBackgroundColor({ color: resolvedIsWorking ? "#ff5d52" : "#94a3b8" });
  chrome.action.setBadgeText({ text: resolvedIsWorking ? String(resolvedEnabledRuleCount) : "" });
}

async function getCurrentDynamicRules() {
  return await chrome.declarativeNetRequest.getDynamicRules();
}

const handleStorageChange = (
  changes: { [key: string]: chrome.storage.StorageChange },
  _area: "sync" | "local" | "managed" | "session"
) => {
  const changeKeys = Object.keys(changes);
  if (
    changeKeys.includes(RULES_STORAGE_KEY) ||
    changeKeys.includes(CONFIG_KEYSET.WORKING) ||
    changeKeys.includes(CONFIG_KEYSET.STORAGE_MODE)
  ) {
    setRules();
  }
  if (
    changeKeys.includes(CONFIG_KEYSET.WORKING) ||
    changeKeys.includes(CONFIG_KEYSET.STORAGE_MODE)
  ) {
    syncActionState();
  }
};

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "FLAMINGO_SYNC_ACTION_STATE"
  ) {
    const payload = message as { enabledRuleCount?: number; isWorking?: boolean };
    if (typeof payload.enabledRuleCount === "number" || typeof payload.isWorking === "boolean") {
      syncActionState(payload.enabledRuleCount, payload.isWorking);
    }
    setRules(payload.isWorking);
  }
});

function init() {
  console.log("welcome to flamingo, a proxy extension");
  if (chrome.storage.onChanged.hasListener(handleStorageChange)) {
    chrome.storage.onChanged.removeListener(handleStorageChange);
  }
  chrome.storage.onChanged.addListener(handleStorageChange);
  if (chrome.webRequest?.onBeforeSendHeaders) {
    if (chrome.webRequest.onBeforeSendHeaders.hasListener(handleBeforeSendHeaders)) {
      chrome.webRequest.onBeforeSendHeaders.removeListener(handleBeforeSendHeaders);
    }
    chrome.webRequest.onBeforeSendHeaders.addListener(
      handleBeforeSendHeaders,
      { urls: ["http://*/*", "https://*/*"] },
      ["blocking", "requestHeaders", "extraHeaders"]
    );
  }
  chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: false });
  syncActionState();
  setRules();
}

init();
