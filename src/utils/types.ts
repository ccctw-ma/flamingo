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
  isSaved: boolean;
  setIsSaved: (val: boolean) => void;
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
