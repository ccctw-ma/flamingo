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

export async function getLocalGroups() {
  return (
    (await localGet(GROUPS_STORAGE_KEY))[GROUPS_STORAGE_KEY] || [DEMO_GROUP]
  );
}

export async function setLocalGroups(groups: Array<Group>) {
  return await localSet({ [GROUPS_STORAGE_KEY]: groups });
}
export async function getLocalRules() {
  return (await localGet(RULES_STORAGE_KEY))[RULES_STORAGE_KEY] || [DEMO_RULE];
}

export async function setLocalRules(rules: Array<Rule>) {
  return await localSet({ [RULES_STORAGE_KEY]: rules });
}
