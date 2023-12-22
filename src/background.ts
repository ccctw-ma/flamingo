console.log("welcome to flamingo, a proxy extension");

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
}
async function setRules() {
  try {
    const newRules = await getNewRules();
    const oldRules = await getCurrentDynamicRules();
    // console.log(JSON.stringify(newRules));
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
    // console.log(changes);
    // console.log(area);
  });
}

(() => {
  addRuleMatchedDebugListener();
  addChromeStorageListener();
  setRules();
})();
