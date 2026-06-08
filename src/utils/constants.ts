import { ConfigKeySetType, CUSTOM_ACTION, Rule } from "./types";
import { getDefaultMockResponseBody } from "./mock";

/**
 * base info constants
 */
export const FLAMINGO = "flamingo";
export const VERSION = "0.0.1";

export const AUTHOR = "ccctw-ma";
export const EMAIL = "mashichen1999@gmail.com";
export const GITHUB = "https://github.com/ccctw-ma";

export const ALL_URLS = "<all_urls>";

export const RULES_STORAGE_KEY = "rules_storage_key";
export const SELECTED_KEY = "selected_storage_key";

export const MOCK_DEMO_ENDPOINT = "https://example.com/api/flamingo-demo";
export const MOCK_DEMO_REGEX = "^https://example\\.com/api/flamingo-demo(\\?.*)?$";
export const MOCK_DEMO_BODY = getDefaultMockResponseBody();

/**
 * config and default values
 */
export const CONFIG_OBJECT = {
  // view
  ASPECT_RATIO: 1.618,
  HOME_WIDTH: 800,
  HOME_HEIGHT: 494,
  LEFT_BAR_WIDTH: 200,
  LEFT_BAR_WIDTH_MIN_RATIO: 0.1,
  LEFT_BAR_WIDTH_MAX_RATIO: 0.5,

  LEFT_TAB_BAR_HEIGHT: 40,
  LEFT_TAB_ITEM_HEIGHT: 40,
  LEFT_TAB_ACTION_HEIGHT: 40,

  DIVIDER_WIDTH: 2,

  RIGHT_HEADER_HEIGHT: 40,
  RULE_CONTAINER_HEIGHT: 200,

  // flag
  WORKING: true,
  LOCALE: "zh-CN",
  STORAGE_MODE: "local",
};

export const CONFIG_KEYSET = Object.keys(CONFIG_OBJECT).reduce((pre, cur) => {
  return {
    ...pre,
    [cur]: `${cur}`,
  };
}, {}) as ConfigKeySetType;

/**
 * rule template for creating a new rule
 */
export const EMPTY_RULE: Rule = {
  id: 2,
  name: "",
  create: Date.now(),
  update: Date.now(),
  enable: false,
  action: {
    type: chrome.declarativeNetRequest.RuleActionType.BLOCK,
  },
  condition: {
    regexFilter: MOCK_DEMO_REGEX,
    resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
  },
  mockResponse: {
    enabled: true,
    body: MOCK_DEMO_BODY,
  },
  uiActionType: CUSTOM_ACTION.MOCK,
};
