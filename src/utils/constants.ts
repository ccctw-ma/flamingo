import { languages } from "monaco-editor";
import { ConfigKeySetType, Group, Rule } from "./types";

/**
 * base info constants
 */
export const FLAMINGO = "flamingo";
export const VERSION = "0.0.1";

export const AUTHOR = "ccctw-ma";
export const EMAIL = "mashichen1999@gmail.com";
export const GITHUB = "https://github.com/ccctw-ma";

export const ALL_URLS = "<all_urls>";

export const GROUPS_STORAGE_KEY = "groups_storage_key";
export const RULES_STORAGE_KEY = "rules_storage_key";
export const SELECTED_KEY = "selected_storage_key";

/**
 * config and default values
 */
export const CONFIG_OBJECT = {
  // view
  ASPECT_RATIO: 1.618,
  HOME_WIDTH: 800,
  HOME_HEIGHT: 494,
  LEFT_BAR_WIDTH: 200,
  LEFT_BAR_WIDTH_MIN_RATIO: 0.25,
  LEFT_BAR_WIDTH_MAX_RATIO: 0.5,

  LEFT_TAB_BAR_HEIGHT: 40,
  LEFT_TAB_ITEM_HEIGHT: 40,
  LEFT_TAB_ACTION_HEIGHT: 40,

  DIVIDER_WIDTH: 2,

  RIGHT_HEADER_HEIGHT: 40,
  RULE_CONTAINER_HEIGHT: 200,

  MATCHED_RULE_TIME_MINUTE_SPAN: 5,

  // flag
  DETAIL: false,
  WORKING: true,
  MATCH: false,
};

export const CONFIG_KEYSET = Object.keys(CONFIG_OBJECT).reduce((pre, cur) => {
  return {
    ...pre,
    [cur]: `${cur}`,
  };
}, {}) as ConfigKeySetType;


/**
 * demo rules 
 */

export const DEMO_RULE: Rule = {
  id: 1,
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
  id: 2,
  name: "",
  create: Date.now(),
  update: Date.now(),
  enable: false,
  action: {
    type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
  },
  condition: {
    regexFilter: "",
  },
};

export const CROS_RULE: Rule = {
  id: 520,
  name: "cros",
  create: Date.now(),
  update: Date.now(),
  enable: false,
  action: {
    responseHeaders: [
      {
        header: "access-control-allow-methods",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value: "*",
      },
      {
        header: "access-control-allow-credentials",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value: "true",
      },
      {
        header: "access-control-allow-origin",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value: "*",
      },
      {
        header: "access-control-allow-headers",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value:
          "Content-Type, access-control-allow-headers, Authorization, X-Requested-With, X-Referer",
      },
    ],
    type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
  },
  condition: {
    regexFilter: "http://*",
  },
};

export const DEMO_GROUP: Group = {
  id: 3,
  name: "demo-group",
  enable: false,
  create: Date.now(),
  update: Date.now(),
  rules: [],
};

export const EMPTY_GROUP: Group = {
  id: 4,
  name: "",
  enable: false,
  create: Date.now(),
  update: Date.now(),
  rules: [],
};


/**
 * rule schemas
 */
const definitions = {
  Rule: {
    type: "object",
    properties: {
      action: {
        $ref: "#/definitions/RuleAction",
        description: "The action to take if this rule is matched.",
      },
      condition: {
        $ref: "#/definitions/RuleCondition",
        description: "The condition under which this rule is triggered.",
      },
      priority: {
        description: "Rule priority.\nDefaults to 1.\nWhen specified, should be >= 1.",
        type: "number",
      },
    },
    required: ["action", "condition"],
  },
  RuleAction: {
    type: "object",
    properties: {
      redirect: {
        description:
          "Describes how the redirect should be performed.\nOnly valid for redirect rules.",
        $ref: "#/definitions/Redirect",
      },
      requestHeaders: {
        description:
          'The request headers to modify for the request.\nOnly valid if RuleActionType is "modifyHeaders".',
        type: "array",
        items: {
          $ref: "#/definitions/ModifyHeaderInfo",
        },
      },
      responseHeaders: {
        description:
          'The response headers to modify for the request.\nOnly valid if RuleActionType is "modifyHeaders".',
        type: "array",
        items: {
          $ref: "#/definitions/ModifyHeaderInfo",
        },
      },
      type: {
        $ref: "#/definitions/RuleActionType",
        description: "The type of action to perform.",
      },
    },
    required: ["type"],
  },
  Redirect: {
    type: "object",
    properties: {
      extensionPath: {
        description: "Path relative to the extension directory.\nShould start with '/'.",
        type: "string",
      },
      regexSubstitution: {
        description:
          "Substitution pattern for rules which specify a regexFilter.\nThe first match of regexFilter within the url will be replaced with this pattern.\nWithin regexSubstitution, backslash-escaped digits (\\1 to \\9) can be used to insert the corresponding capture groups.\n\\0 refers to the entire matching text.",
        type: "string",
      },
      transform: {
        description: "Url transformations to perform.",
        $ref: "#/definitions/URLTransform",
      },
      url: {
        description: "The redirect url.\nRedirects to JavaScript urls are not allowed.",
        type: "string",
      },
    },
  },
  URLTransform: {
    type: "object",
    properties: {
      fragment: {
        description:
          "The new fragment for the request.\nShould be either empty, in which case the existing fragment is cleared; or should begin with '#'.",
        type: "string",
      },
      host: {
        description: "The new host for the request.",
        type: "string",
      },
      password: {
        description: "The new password for the request.",
        type: "string",
      },
      path: {
        description: "The new path for the request.\nIf empty, the existing path is cleared.",
        type: "string",
      },
      port: {
        description: "The new port for the request.\nIf empty, the existing port is cleared.",
        type: "string",
      },
      query: {
        description:
          "The new query for the request.\nShould be either empty, in which case the existing query is cleared; or should begin with '?'.",
        type: "string",
      },
      queryTransform: {
        description: "Add, remove or replace query key-value pairs.",
        $ref: "#/definitions/QueryTransform",
      },
      scheme: {
        description:
          'The new scheme for the request.\nAllowed values are "http", "https", "ftp" and "chrome-extension".',
        type: "string",
      },
      username: {
        description: "The new username for the request.",
        type: "string",
      },
    },
  },
  QueryTransform: {
    type: "object",
    properties: {
      addOrReplaceParams: {
        description: "The list of query key-value pairs to be added or replaced.",
        type: "array",
        items: {
          $ref: "#/definitions/QueryKeyValue",
        },
      },
      removeParams: {
        description: "The list of query keys to be removed.",
        type: "array",
        items: {
          type: "string",
        },
      },
    },
  },
  QueryKeyValue: {
    type: "object",
    properties: {
      key: {
        type: "string",
      },
      value: {
        type: "string",
      },
    },
    required: ["key", "value"],
  },
  ModifyHeaderInfo: {
    type: "object",
    properties: {
      header: {
        description: "The name of the header to be modified.",
        type: "string",
      },
      operation: {
        $ref: "#/definitions/HeaderOperation",
        description: "The operation to be performed on a header.",
      },
      value: {
        description:
          "The new value for the header.\nMust be specified for append and set operations.",
        type: "string",
      },
    },
    required: ["header", "operation"],
  },
  HeaderOperation: {
    description: 'This describes the possible operations for a "modifyHeaders" rule.',
    type: "string",
    enum: ["append", "set", "remove"],
  },
  RuleActionType: {
    description: "Describes the kind of action to take if a given RuleCondition matches.",
    type: "string",
    enum: ["block", "redirect", "allow", "upgradeScheme", "modifyHeaders", "allowAllRequests"],
  },
  RuleCondition: {
    type: "object",
    properties: {
      domainType: {
        description:
          "Specifies whether the network request is first-party or third-party to the domain from which it originated.\nIf omitted, all requests are accepted.",
        enum: ["firstParty", "thirdParty"],
        type: "string",
      },
      domains: {
        type: "array",
        items: {
          type: "string",
        },
      },
      excludedDomains: {
        type: "array",
        items: {
          type: "string",
        },
      },
      initiatorDomains: {
        description:
          'The rule will only match network requests originating from the list of initiatorDomains.\nIf the list is omitted, the rule is applied to requests from all domains.\nAn empty list is not allowed.\n\nNotes:\nSub-domains like "a.example.com" are also allowed.\nThe entries must consist of only ascii characters.\nUse punycode encoding for internationalized domains.\nThis matches against the request initiator and not the request url.',
        type: "array",
        items: {
          type: "string",
        },
      },
      excludedInitiatorDomains: {
        description:
          'The rule will not match network requests originating from the list of excludedInitiatorDomains.\nIf the list is empty or omitted, no domains are excluded.\nThis takes precedence over initiatorDomains.\n\nNotes:\nSub-domains like "a.example.com" are also allowed.\nThe entries must consist of only ascii characters.\nUse punycode encoding for internationalized domains.\nThis matches against the request initiator and not the request url.',
        type: "array",
        items: {
          type: "string",
        },
      },
      requestDomains: {
        description:
          'The rule will only match network requests when the domain matches one from the list of requestDomains.\nIf the list is omitted, the rule is applied to requests from all domains.\nAn empty list is not allowed.\n\nNotes:\nSub-domains like "a.example.com" are also allowed.\nThe entries must consist of only ascii characters.\nUse punycode encoding for internationalized domains.',
        type: "array",
        items: {
          type: "string",
        },
      },
      excludedRequestDomains: {
        description:
          'The rule will not match network requests when the domains matches one from the list of excludedRequestDomains.\nIf the list is empty or omitted, no domains are excluded.\nThis takes precedence over requestDomains.\n\nNotes:\nSub-domains like "a.example.com" are also allowed.\nThe entries must consist of only ascii characters.\nUse punycode encoding for internationalized domains.',
        type: "array",
        items: {
          type: "string",
        },
      },
      excludedRequestMethods: {
        description:
          "List of request methods which the rule won't match.\nOnly one of requestMethods and excludedRequestMethods should be specified.\nIf neither of them is specified, all request methods are matched.",
        type: "array",
        items: {
          $ref: "#/definitions/RequestMethod",
        },
      },
      excludedResourceTypes: {
        description:
          'List of resource types which the rule won\'t match.\nOnly one of {@link chrome.declarativeNetRequest.RuleCondition.resourceTypes}\nand {@link chrome.declarativeNetRequest.RuleCondition.excludedResourceTypes} should be specified.\nIf neither of them is specified, all resource types except "main_frame" are blocked.',
        type: "array",
        items: {
          $ref: "#/definitions/ResourceType",
        },
      },
      excludedTabIds: {
        description:
          "List of {@link chrome.tabs.Tab.id} which the rule should not match.\nAn ID of {@link chrome.tabs.TAB_ID_NONE} excludes requests which don't originate from a tab.\nOnly supported for session-scoped rules.",
        type: "array",
        items: {
          type: "number",
        },
      },
      isUrlFilterCaseSensitive: {
        description:
          "Whether the urlFilter or regexFilter (whichever is specified) is case sensitive.\nDefault is true.",
        type: "boolean",
      },
      regexFilter: {
        description:
          "Regular expression to match against the network request url.\nThis follows the RE2 syntax.\n\nNote: Only one of urlFilter or regexFilter can be specified.\n\nNote: The regexFilter must be composed of only ASCII characters.\nThis is matched against a url where the host is encoded in the punycode format (in case of internationalized domains) and any other non-ascii characters are url encoded in utf-8.",
        type: "string",
      },
      requestMethods: {
        description:
          "List of HTTP request methods which the rule can match. An empty list is not allowed.\nNote: Specifying a {@link chrome.declarativeNetRequest.RuleCondition.requestMethods} rule condition will also exclude non-HTTP(s) requests,\nwhereas specifying {@link chrome.declarativeNetRequest.RuleCondition.excludedRequestMethods} will not.",
        type: "array",
        items: {
          $ref: "#/definitions/RequestMethod",
        },
      },
      tabIds: {
        description:
          "List of {@link chrome.tabs.Tab.id} which the rule should not match.\nAn ID of {@link chrome.tabs.TAB_ID_NONE} excludes requests which don't originate from a tab.\nAn empty list is not allowed. Only supported for session-scoped rules.",
        type: "array",
        items: {
          type: "number",
        },
      },
      urlFilter: {
        description:
          "The pattern which is matched against the network request url.\nSupported constructs:\n\n'*' : Wildcard: Matches any number of characters.\n\n'|' : Left/right anchor: If used at either end of the pattern, specifies the beginning/end of the url respectively.\n\n'||' : Domain name anchor: If used at the beginning of the pattern, specifies the start of a (sub-)domain of the URL.\n\n'^' : Separator character: This matches anything except a letter, a digit or one of the following: _ - . %.\nThis can also match the end of the URL.\n\nTherefore urlFilter is composed of the following parts: (optional Left/Domain name anchor) + pattern + (optional Right anchor).\n\nIf omitted, all urls are matched. An empty string is not allowed.\n\nA pattern beginning with || is not allowed. Use instead.\n\nNote: Only one of urlFilter or regexFilter can be specified.\n\nNote: The urlFilter must be composed of only ASCII characters.\nThis is matched against a url where the host is encoded in the punycode format (in case of internationalized domains) and any other non-ascii characters are url encoded in utf-8.\nFor example, when the request url is http://abc.рф?q=ф, the urlFilter will be matched against the url http://abc.xn--p1ai/?q=%D1%84.",
        type: "string",
      },
      resourceTypes: {
        description:
          "List of resource types which the rule can match.\nAn empty list is not allowed.\n\nNote: this must be specified for allowAllRequests rules and may only include the sub_frame and main_frame resource types.",
        type: "array",
        items: {
          $ref: "#/definitions/ResourceType",
        },
      },
    },
  },
  RequestMethod: {
    description: "This describes the HTTP request method of a network request.",
    type: "string",
    enum: ["connect", "delete", "get", "head", "options", "patch", "post", "put"],
  },
  ResourceType: {
    description: "This describes the resource type of the network request.",
    type: "string",
    enum: [
      "main_frame",
      "sub_frame",
      "stylesheet",
      "script",
      "image",
      "font",
      "object",
      "xmlhttprequest",
      "ping",
      "csp_report",
      "media",
      "websocket",
      "other",
    ],
  },
};

export const groupSchema: languages.json.DiagnosticsOptions = {
  validate: true,
  schemas: [
    {
      uri: "http://myserver/group-schema.json",
      fileMatch: ["*"],
      schema: {
        type: "array",
        items: {
          $ref: "#/definitions/Rule",
        },
        definitions: definitions,
      },
    },
  ],
};

export const ruleSchema: languages.json.DiagnosticsOptions = {
  validate: true,
  schemas: [
    {
      uri: "http://myserver/rule-schema.json",
      fileMatch: ["*"],
      schema: {
        $ref: "#/definitions/Rule",
        definitions: definitions,
      },
    },
  ],
};
