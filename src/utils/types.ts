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
  Group = "Group",
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

export interface Group {
  /** An id which uniquely identifies a group
   *  its creation timestamp can be used as its id
   */
  id: number;

  /** The name of this group*/
  name: string;

  /** Determin whether this group is working*/
  enable: boolean;

  /** The timestamp when this group is created */
  create: number;

  /** The timestamp when this group is modified */
  update: number;

  /** All of rules of this group*/
  rules: Rule[];
}

export type GroupStore = {
  groups: Array<Group>;
  selectedGroup: Group;
  setGroups: (val: Array<Group>) => void;
  setSelectedGroup: (val: Group) => void;
};

export type RuleStore = {
  rules: Array<Rule>;
  selectedRule: Rule;
  setRules: (val: Array<Rule>) => void;
  setSelectedRule: (val: Rule) => void;
};

export type SelecedStore = {
  type: TYPE;
  selected: Rule | Group;
  setSelected: (val: Rule | Group) => void;
  setType: (val: TYPE) => void;
  edit: Rule | Group;
  setEdit: (val: Rule | Group) => void;
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
