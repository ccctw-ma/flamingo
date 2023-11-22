import {
  DEMO_GROUP,
  DEMO_RULE,
  GROUPS_STORAGE_KEY,
  RULES_STORAGE_KEY,
} from "./constants";
import { Group, Rule } from "./types";

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

/**
 * groups add delete update query
 */
export async function getLocalGroups() {
  return (
    (await localGet(GROUPS_STORAGE_KEY))[GROUPS_STORAGE_KEY] || [DEMO_GROUP]
  );
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
  return (await localGet(RULES_STORAGE_KEY))[RULES_STORAGE_KEY] || [DEMO_RULE];
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
