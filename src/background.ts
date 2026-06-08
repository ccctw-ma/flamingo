import { CONFIG_KEYSET, RULES_STORAGE_KEY } from "./utils/constants";
import { getConfigValue, getRules } from "./utils/storage";
import { CUSTOM_ACTION, EditableModifyHeaderInfo, Rule } from "./utils/types";

function toDynamicModifyHeaderInfo(
  header: EditableModifyHeaderInfo
): chrome.declarativeNetRequest.ModifyHeaderInfo {
  const { enabled: _enabled, ...dynamicHeader } = header;
  return dynamicHeader;
}

function toDynamicAction(
  action: Rule["action"]
): chrome.declarativeNetRequest.RuleAction | null {
  if (action.type !== chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS) {
    return action;
  }

  const requestHeaders = (action.requestHeaders as EditableModifyHeaderInfo[] | undefined)
    ?.filter((header) => header.enabled !== false)
    .map(toDynamicModifyHeaderInfo);
  const responseHeaders = (action.responseHeaders as EditableModifyHeaderInfo[] | undefined)
    ?.filter((header) => header.enabled !== false)
    .map(toDynamicModifyHeaderInfo);

  if (!requestHeaders?.length && !responseHeaders?.length) {
    return null;
  }

  return {
    type: action.type,
    ...(requestHeaders?.length ? { requestHeaders } : {}),
    ...(responseHeaders?.length ? { responseHeaders } : {}),
  };
}

function toDynamicRule(rule: Rule): chrome.declarativeNetRequest.Rule | null {
  if (rule.uiActionType === CUSTOM_ACTION.MOCK) {
    return null;
  }
  const action = toDynamicAction(rule.action);
  if (!action) {
    return null;
  }
  return {
    action,
    condition: rule.condition,
    id: rule.id,
    priority: rule.priority,
  };
}

async function getIsWorking() {
  return (
    ((await getConfigValue(
      CONFIG_KEYSET.WORKING as keyof typeof import("./utils/constants").CONFIG_OBJECT
    )) as boolean | undefined) ?? true
  );
}

async function getEnabledRules() {
  const rules: Rule[] = await getRules();
  return rules.filter((rule) => rule.enable);
}

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
  chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: false });
  syncActionState();
  setRules();
}

init();
