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

  /**  Determine whether this rule is global
   *   todo! not sure whether need this key
   */
  isGlobal?: number;
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
