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

/**
 * interfaces and types
 */
export interface Rule extends chrome.declarativeNetRequest.Rule {
  /** The name of this rule*/
  name: string;

  /** The timestamp when this rule is modified */
  update: number;

  /**  Determine whether this rule is global*/
  isGlobal: number;
}

export interface Group {
  /** An id which uniquely identifies a group
   *  its creation timestamp can be used as its id
   */
  id: number;

  /** The name of this group*/
  name: string;

  /** All of rules of this group*/
  rules: Rule[];

  /** The timestamp when this group is modified */
  update: number;
}
