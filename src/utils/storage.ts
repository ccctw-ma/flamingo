import {
  DEMO_GROUP,
  DEMO_RULE,
  GROUPS_STORAGE_KEY,
  RULES_STORAGE_KEY,
  SELECTED_KEY,
} from "./constants";
import { Group, Rule, TYPE } from "./types";

export type AreaName = "sync" | "local" | "managed" | "session";
export type StorageKey = string | string[] | { [key: string]: any };

/** function currying*/
function storageSet(areaName: AreaName) {
  return async function (obj: { [key: string]: any }) {
    await chrome.storage[areaName].set(obj);
  };
}

function storageGet(archName: AreaName) {
  return async function (key: StorageKey) {
    return await chrome.storage[archName].get(key);
  };
}

export async function localSet(obj: { [key: string]: any }) {
  return await storageSet("local")(obj);
}

export async function localGet(keys: StorageKey) {
  return await storageGet("local")(keys);
}

export async function localGetBySingleKey(key: string) {
  return (await localGet(key))[key];
}

export async function localSetBySingleKey(key: string, val: any) {
  return await localSet({ [key]: val });
}

/**
 * groups add delete update query
 */
export async function getLocalGroups() {
  let localGroups = (await localGet(GROUPS_STORAGE_KEY))[GROUPS_STORAGE_KEY] || [];
  if (localGroups.length === 0) {
    localGroups = [DEMO_GROUP];
  }
  return localGroups;
}

export async function setLocalGroups(groups: Array<Group>) {
  return await localSet({ [GROUPS_STORAGE_KEY]: groups });
}

export async function addGroup(group: Group) {
  const oldGroups: Array<Group> = await getLocalGroups();
  const newGroups = [...oldGroups, group];
  return await setLocalGroups(newGroups);
}

export async function updateGroups(group: Group) {
  const oldGroups: Array<Group> = await getLocalGroups();
  const newGroups = oldGroups.map((g) => {
    // override
    if (g.id === group.id) {
      return {
        ...g,
        ...group,
      };
    } else {
      return g;
    }
  });
  return await setLocalGroups(newGroups);
}

export async function deleteGroup(group: Group) {
  const oldGroups: Array<Group> = await getLocalGroups();
  const newGroups = oldGroups.filter((g) => g.id !== group.id);
  return await setLocalGroups(newGroups);
}

/**
 * rules add delete update query
 */
export async function getLocalRules() {
  let localRules = (await localGet(RULES_STORAGE_KEY))[RULES_STORAGE_KEY] || [];
  if (localRules.length === 0) {
    localRules = [DEMO_RULE];
  }
  return localRules;
}

export async function setLocalRules(rules: Array<Rule>) {
  return await localSet({ [RULES_STORAGE_KEY]: rules });
}

export async function addRule(rule: Rule) {
  const oldRules = await getLocalRules();
  const newRules = [...oldRules, rule];
  return await setLocalRules(newRules);
}

export async function updateRules(rule: Rule) {
  const oldRules: Array<Rule> = await getLocalRules();
  const newRules = oldRules.map((r) => {
    // override
    if (r.id === rule.id) {
      return {
        ...r,
        ...rule,
      };
    } else {
      return r;
    }
  });
  return await setLocalRules(newRules);
}

export async function deleteRule(rule: Rule) {
  const oldRules: Array<Rule> = await getLocalRules();
  const newRules = oldRules.filter((r) => r.id !== rule.id);
  return await setLocalRules(newRules);
}

/**
 * selelcted  update query
 */
export async function getLocalSelected() {
  return (await localGet(SELECTED_KEY))[SELECTED_KEY] || [TYPE.Group, DEMO_GROUP];
}

export async function setLocalSelected(type: TYPE, selected: Rule | Group) {
  return await localSet({ [SELECTED_KEY]: [type, selected] });
}
