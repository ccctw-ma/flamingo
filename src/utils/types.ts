import { CONFIG_OBJECT } from "./constants";

/**
 * enum
 */
export enum ACTION {
  Add,
  Search,
  OrderByName,
  OrderByCreateTime,
  OrderByUpdateTime,
}

export enum TYPE {
  Rule = "Rule",
}

export enum CUSTOM_ACTION {
  MOCK = "mock",
}

export enum STATUS {
  ERROR = "error",
  WARN = "warning",
  NONE = "",
}

/**
 * interfaces and types
 */
export interface Rule extends chrome.declarativeNetRequest.Rule {
  /** The name of this rule*/
  name: string;

  /** The timestamp when this rule is created */
  create: number;

  /** The timestamp when this rule is modified */
  update: number;

  /** Determin whether this rule is working*/
  enable: boolean;

  /** Optional project-level group id. Rules with the same id are managed as one scenario. */
  groupId?: number;

  /** Human readable group name shown in the rule list. */
  groupName?: string;

  /** Group-level switch. A disabled group prevents all child rules from being emitted. */
  groupEnabled?: boolean;

  /** Optional editable mock response body for redirect rules. */
  mockResponse?: {
    enabled: boolean;
    body: string;
  };

  uiActionType?: chrome.declarativeNetRequest.RuleActionType | CUSTOM_ACTION.MOCK;
}

export interface EditableModifyHeaderInfo
  extends chrome.declarativeNetRequest.ModifyHeaderInfo {
  /** UI-only flag. Disabled header operations are kept in storage but skipped in DNR rules. */
  enabled?: boolean;
}

export type RuleStore = {
  rules: Array<Rule>;
  selectedRule: Rule | null;
  setRules: (val: Array<Rule>) => void;
  setSelectedRule: (val: Rule | null) => void;
};

export type SelecedStore = {
  type: TYPE;
  selected: Rule | null;
  setSelected: (val: Rule | null) => void;
  setType: (val: TYPE) => void;
  edit: Rule | null;
  setEdit: (val: Rule | null) => void;
  editType: TYPE;
  setEditType: (val: TYPE) => void;
  hasError: boolean;
  setHasError: (val: boolean) => void;
};

export type FalgStore = {
  loaded: boolean;
  setIsLoaded: (val: boolean) => void;
};

export type configType = typeof CONFIG_OBJECT;
export type configKeyType = keyof configType;
export type ConfigKeySetType = {
  [key in configKeyType]: string;
};
export type ConfigStore = configType & {
  setConfig: (key: configKeyType, value: configType[configKeyType]) => void;
};
