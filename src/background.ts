import { CONFIG_KEYSET, GROUPS_STORAGE_KEY, RULES_STORAGE_KEY } from "./utils/constants";
import { getLocalGroups, getLocalRules, localGetBySingleKey } from "./utils/storage";
import { Group, Rule } from "./utils/types";

const demoRules = [
  {
    id: 1,
    priority: 200,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        // url: "https://jsonplaceholder.typicode.com/posts/2",
        regexSubstitution: "https://jsonplaceholder.typicode.com/posts/\\2",
      },
    },
    condition: {
      // urlFilter: "bilibili",
      // domains: ["www.bilibili.com"],
      regexFilter: "https://(\\w*).typicode.com/posts/(\\d)",
      // resourceTypes: [
      //   chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
      // ],
    },
  },
  {
    id: 2,
    priority: 200,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          header: "hello",
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          value: "world",
        },
      ],
    },
    condition: {
      regexFilter: "https://(\\w*).typicode.com/posts/(\\d)",
    },
  },
  {
    id: 3,
    priority: 200,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.BLOCK,
    },
    condition: {
      regexFilter: "https://jsonplaceholder.typicode.com/posts/3",
    },
  },
];

async function getNewRules(): Promise<Array<chrome.declarativeNetRequest.Rule>> {
  const groups: Group[] = await getLocalGroups();
  const rules: Rule[] = await getLocalRules();
  const enableRules: Rule[] = [];
  groups.forEach((group) => {
    if (group.enable) {
      enableRules.push(...group.rules);
    }
  });
  rules.forEach((rule) => {
    if (rule.enable) {
      enableRules.push(rule);
    }
  });
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
    const isWorking = (await localGetBySingleKey(CONFIG_KEYSET.WORKING)) ?? true;
    const workingRules = isWorking ? newRules : [];
    const removeIds = oldRules.map((r) => r.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: workingRules,
      removeRuleIds: removeIds,
    });
  } catch (err) {
    console.log("error", err);
  }
}

async function getCurrentDynamicRules() {
  return await chrome.declarativeNetRequest.getDynamicRules();
}

const handleRuleMatched = (info: chrome.declarativeNetRequest.MatchedRuleInfoDebug) => {
  console.log(info);
};

const handleStorageChange = (
  changes: { [key: string]: chrome.storage.StorageChange },
  area: "sync" | "local" | "managed" | "session"
) => {
  console.log(changes);
  const changeKeys = Object.keys(changes);
  if (
    changeKeys.includes(GROUPS_STORAGE_KEY) ||
    changeKeys.includes(RULES_STORAGE_KEY) ||
    changeKeys.includes(CONFIG_KEYSET.WORKING)
  ) {
    setRules();
  }
  if (changeKeys.includes(CONFIG_KEYSET.WORKING)) {
    const isWorking = changes[CONFIG_KEYSET.WORKING].newValue;
    chrome.action.setIcon({
      path: isWorking ? "../images/flamingo_red_48.png" : "../images/flamingo_grey_48.png",
    });
  }
};

function init() {
  console.log("welcome to flamingo, a proxy extension");
  if (chrome.storage.onChanged.hasListener(handleStorageChange)) {
    chrome.storage.onChanged.removeListener(handleStorageChange);
  }
  if (chrome.declarativeNetRequest.onRuleMatchedDebug.hasListener(handleRuleMatched)) {
    chrome.declarativeNetRequest.onRuleMatchedDebug.removeListener(handleRuleMatched);
  }
  chrome.storage.onChanged.addListener(handleStorageChange);
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(handleRuleMatched);
  chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true });
  setRules();
}

init();
