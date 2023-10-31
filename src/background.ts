console.log("hello this is background scripts");

async function getNewRules(): Promise<
  Array<chrome.declarativeNetRequest.Rule>
> {
  return [
    {
      id: 1,
      priority: 200,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: {
          url: "https://jsonplaceholder.typicode.com/posts/2",
        },
      },
      condition: {
        // urlFilter: "bilibili",
        // domains: ["www.bilibili.com"],
        regexFilter: "https://jsonplaceholder.typicode.com/posts/1",
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
        ],
      },
    },
  ];
}
async function setRules() {
  try {
    const newRules = await getNewRules();
    const oldRules = await getCurrentDynamicRules();
    console.log(newRules, oldRules);
    const removeIds = oldRules.map((r) => r.id);
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: newRules,
      removeRuleIds: removeIds,
    });
  } catch {
    console.log("error");
  }
}
async function getCurrentDynamicRules() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  return rules;
}

function addRuleMatchedDebugListener() {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    console.log(info);
  });
}

function addChromeStorageListener() {
  chrome.storage.onChanged.addListener((changes, area) => {
    console.log(changes);
    console.log(area);
  });
}

(() => {
  addRuleMatchedDebugListener();
  addChromeStorageListener();
  setRules();
})();
