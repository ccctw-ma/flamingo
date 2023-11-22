import { generateId } from ".";
import { Group, Rule } from "./types";

/**
 * infos
 */
export const FLAMINGO = "flamingo";
export const VERSION = "0.0.1";

export const AUTHOR = "ccctw-ma";
export const EMAIL = "mashichen1999@gmail.com";
export const GITHUB = "https://github.com/ccctw-ma";

export const ALL_URLS = "<all_urls>";

export const GROUPS_STORAGE_KEY = "groups_storage_key";
export const RULES_STORAGE_KEY = "rules_storage_key";

/**
 * view config
 */

export const ASPECT_RATIO = 1.618;
export const HOME_WIDTH = 800;
export const HOME_HEIGHT = HOME_WIDTH / ASPECT_RATIO;

export const LEFT_BAR_WIDTH_KEY = "left_bar_with";
export const LEFT_BAR_WIDTH_MIN_RATIO = 1 / 4;
export const LEFT_BAR_WIDTH_MAX_RATIO = 2 / 3;

export const LEFT_TAB_BAR_HEIGHT = 40;
export const LEFT_TAB_ITEM_HEIGHT = 40;
export const LEFT_TAB_ACTION_HEIGHT = 40;

export const DIVIDER_WIDTH = 2;

/**
 * demo
 */

export const DEMO_RULE: Rule = {
  id: generateId(),
  name: "demo-rule",
  create: Date.now(),
  update: Date.now(),
  enable: false,
  action: {
    type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
    redirect: {
      regexSubstitution: "https://jsonplaceholder.typicode.com/posts/\\2",
    },
  },
  condition: {
    regexFilter: "https://(\\w*).typicode.com/posts/(\\d)",
  },
};

export const EMPTY_RULE: Rule = {
  name: "",
  create: Date.now(),
  update: Date.now(),
  enable: false,
  action: {
    type: chrome.declarativeNetRequest.RuleActionType.ALLOW,
  },
  condition: {
    regexFilter: "",
  },
  id: generateId(),
};

export const DEMO_GROUP: Group = {
  id: generateId(),
  name: "demo-group",
  enable: false,
  create: Date.now(),
  update: Date.now(),
  rules: [],
};

export const EMPTY_GROUP: Group = {
  id: generateId(),
  name: "",
  enable: false,
  create: Date.now(),
  update: Date.now(),
  rules: [],
};
