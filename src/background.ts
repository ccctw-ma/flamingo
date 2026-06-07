import { CONFIG_KEYSET, RULES_STORAGE_KEY } from "./utils/constants";
import { getConfigValue, getRules } from "./utils/storage";
import { Rule } from "./utils/types";

async function getNewRules(): Promise<Array<chrome.declarativeNetRequest.Rule>> {
  const rules: Rule[] = await getRules();
  const enableRules = rules.filter((rule) => rule.enable);
  const availableRules: chrome.declarativeNetRequest.Rule[] = enableRules.map((rule) => ({
    action: rule.action,
    condition: rule.condition,
    id: rule.id,
    priority: rule.priority,
  }));
  return availableRules;
}

async function setRules() {
  try {
    const newRules = await getNewRules();
    const oldRules = await getCurrentDynamicRules();
    const isWorking =
      (await getConfigValue(
        CONFIG_KEYSET.WORKING as keyof typeof import("./utils/constants").CONFIG_OBJECT
      )) ?? true;
    const workingRules = isWorking ? newRules : [];
    const removeIds = oldRules.map((r) => r.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: workingRules,
      removeRuleIds: removeIds,
    });
  } catch (err) {
    console.log("error: setRules", err);
  }
}

async function syncExtensionIcon() {
  const isWorking =
    (await getConfigValue(
      CONFIG_KEYSET.WORKING as keyof typeof import("./utils/constants").CONFIG_OBJECT
    )) ?? true;
  const iconPrefix = isWorking ? "flamingo" : "flamingo_grey";
  chrome.action.setIcon({
    path: {
      16: `images/${iconPrefix}_16.png`,
      32: `images/${iconPrefix}_32.png`,
      48: `images/${iconPrefix}_48.png`,
    },
  });
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
    syncExtensionIcon();
  }
};

function init() {
  console.log("welcome to flamingo, a proxy extension");
  if (chrome.storage.onChanged.hasListener(handleStorageChange)) {
    chrome.storage.onChanged.removeListener(handleStorageChange);
  }
  chrome.storage.onChanged.addListener(handleStorageChange);
  chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true });
  syncExtensionIcon();
  setRules();
}

init();
