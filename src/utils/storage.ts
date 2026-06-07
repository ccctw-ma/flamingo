import { CONFIG_KEYSET, RULES_STORAGE_KEY, SELECTED_KEY } from "./constants";
import { configKeyType, Rule, TYPE } from "./types";

export type AreaName = "sync" | "local" | "managed" | "session";
export type StorageObject = { [key: string]: unknown };
export type StorageKey = string | string[] | StorageObject;
export type StorageMode = "local" | "sync";

const STORAGE_MODE_FALLBACK: StorageMode = "local";
const STORAGE_MODE_KEY = CONFIG_KEYSET.STORAGE_MODE as configKeyType;
const ACTIVE_CONFIG_KEYS = new Set<configKeyType>([
  CONFIG_KEYSET.WORKING as configKeyType,
  CONFIG_KEYSET.LOCALE as configKeyType,
]);

function notifyActionStateChange() {
  if (!chrome.runtime?.sendMessage) {
    return;
  }

  chrome.runtime.sendMessage({ type: "FLAMINGO_SYNC_ACTION_STATE" }).catch(() => {
    // Background may be asleep or unavailable in tests.
  });
}

/** function currying*/
function storageSet(areaName: AreaName) {
  return async function (obj: StorageObject) {
    await chrome.storage[areaName].set(obj);
  };
}

function storageGet(archName: AreaName) {
  return async function (key: StorageKey) {
    return await chrome.storage[archName].get(key);
  };
}

export async function localSet(obj: StorageObject) {
  return await storageSet("local")(obj);
}

export async function localGet(keys: StorageKey) {
  return await storageGet("local")(keys);
}

export async function localGetBySingleKey(key: string) {
  return (await localGet(key))[key];
}

export async function localSetBySingleKey(key: string, val: unknown) {
  return await localSet({ [key]: val });
}

export async function syncSet(obj: StorageObject) {
  return await storageSet("sync")(obj);
}

export async function syncGet(keys: StorageKey) {
  return await storageGet("sync")(keys);
}

export async function syncGetBySingleKey(key: string) {
  return (await syncGet(key))[key];
}

export async function syncSetBySingleKey(key: string, val: unknown) {
  return await syncSet({ [key]: val });
}

function isStorageMode(value: unknown): value is StorageMode {
  return value === "local" || value === "sync";
}

async function getStorageValue(areaName: StorageMode, key: string) {
  return (await storageGet(areaName)(key))[key];
}

async function setStorageValue(areaName: StorageMode, key: string, value: unknown) {
  return await storageSet(areaName)({ [key]: value });
}

export async function getStorageMode(): Promise<StorageMode> {
  const localMode = await localGetBySingleKey(STORAGE_MODE_KEY);
  if (isStorageMode(localMode)) {
    return localMode;
  }

  const syncMode = await syncGetBySingleKey(STORAGE_MODE_KEY);
  if (isStorageMode(syncMode)) {
    return syncMode;
  }

  return STORAGE_MODE_FALLBACK;
}

export async function setStorageMode(mode: StorageMode) {
  await Promise.all([
    localSetBySingleKey(CONFIG_KEYSET.STORAGE_MODE, mode),
    syncSetBySingleKey(STORAGE_MODE_KEY, mode),
  ]);
  notifyActionStateChange();
}

async function getDataArea() {
  return await getStorageMode();
}

function ensureRules(value: unknown): Rule[] {
  return Array.isArray(value) ? (value as Rule[]) : [];
}

function ensureSelected(value: unknown): [TYPE, Rule | null] {
  if (!Array.isArray(value) || value.length !== 2) {
    return [TYPE.Rule, null];
  }

  const [type, selected] = value as [TYPE, Rule | null];
  if (type === TYPE.Rule) {
    return [type, selected];
  }

  return [TYPE.Rule, null];
}

async function getRulesFromArea(areaName: StorageMode) {
  return ensureRules(await getStorageValue(areaName, RULES_STORAGE_KEY));
}

async function setRulesToArea(areaName: StorageMode, rules: Rule[]) {
  return await setStorageValue(areaName, RULES_STORAGE_KEY, rules);
}

async function getSelectedFromArea(areaName: StorageMode) {
  return ensureSelected(await getStorageValue(areaName, SELECTED_KEY));
}

async function setSelectedToArea(areaName: StorageMode, type: TYPE, selected: Rule | null) {
  return await setStorageValue(areaName, SELECTED_KEY, [type, selected]);
}

async function getConfigValueFromArea<Key extends configKeyType>(areaName: StorageMode, key: Key) {
  return (await getStorageValue(
    areaName,
    key
  )) as (typeof import("./constants").CONFIG_OBJECT)[Key];
}

async function setConfigValueToArea<Key extends configKeyType>(
  areaName: StorageMode,
  key: Key,
  value: (typeof import("./constants").CONFIG_OBJECT)[Key]
) {
  return await setStorageValue(areaName, key, value);
}

export async function getConfigValues(keys: configKeyType[]) {
  const mode = await getStorageMode();
  const localKeys = keys.filter(
    (key) => key !== CONFIG_KEYSET.STORAGE_MODE && !ACTIVE_CONFIG_KEYS.has(key)
  );
  const activeKeys = keys.filter((key) => ACTIVE_CONFIG_KEYS.has(key));

  const [localValues, activeValues] = await Promise.all([
    localKeys.length > 0 ? localGet(localKeys) : Promise.resolve({}),
    activeKeys.length > 0 ? storageGet(mode)(activeKeys) : Promise.resolve({}),
  ]);

  return {
    ...localValues,
    ...activeValues,
    [STORAGE_MODE_KEY]: mode,
  };
}

export async function getConfigValue<Key extends configKeyType>(key: Key) {
  const values = await getConfigValues([key]);
  return (values as Record<configKeyType, unknown>)[
    key
  ] as (typeof import("./constants").CONFIG_OBJECT)[Key];
}

export async function setConfigValue<Key extends configKeyType>(
  key: Key,
  value: (typeof import("./constants").CONFIG_OBJECT)[Key]
) {
  if (key === STORAGE_MODE_KEY) {
    await setStorageMode(value as StorageMode);
    return;
  }

  if (ACTIVE_CONFIG_KEYS.has(key)) {
    await setConfigValueToArea(await getDataArea(), key, value);
    if (key === CONFIG_KEYSET.WORKING) {
      notifyActionStateChange();
    }
    return;
  }

  await localSetBySingleKey(key, value);
}

export async function switchStorageMode(nextMode: StorageMode) {
  const currentMode = await getStorageMode();
  if (currentMode === nextMode) {
    await setStorageMode(nextMode);
    return;
  }

  const [rules, selected, working, locale] = await Promise.all([
    getRulesFromArea(currentMode),
    getSelectedFromArea(currentMode),
    getConfigValueFromArea(currentMode, CONFIG_KEYSET.WORKING as configKeyType),
    getConfigValueFromArea(currentMode, CONFIG_KEYSET.LOCALE as configKeyType),
  ]);

  await Promise.all([
    setRulesToArea(nextMode, rules),
    setSelectedToArea(nextMode, selected[0], selected[1]),
    setConfigValueToArea(nextMode, CONFIG_KEYSET.WORKING as configKeyType, working ?? true),
    setConfigValueToArea(nextMode, CONFIG_KEYSET.LOCALE as configKeyType, locale ?? "zh-CN"),
  ]);

  await setStorageMode(nextMode);
}

/**
 * rules add delete update query
 */
export async function getRules() {
  return await getRulesFromArea(await getDataArea());
}

export async function setRules(rules: Array<Rule>) {
  await setRulesToArea(await getDataArea(), rules);
  notifyActionStateChange();
}

export async function addRule(rule: Rule) {
  const oldRules = await getRules();
  const newRules = [...oldRules, rule];
  return await setRules(newRules);
}

export async function updateRules(rule: Rule) {
  const oldRules: Array<Rule> = await getRules();
  const newRules = oldRules.map((r) => {
    if (r.id === rule.id) {
      return rule;
    } else {
      return r;
    }
  });
  return await setRules(newRules);
}

export async function deleteRule(rule: Rule) {
  const oldRules: Array<Rule> = await getRules();
  const newRules = oldRules.filter((r) => r.id !== rule.id);
  return await setRules(newRules);
}

/**
 * selelcted  update query
 */
export async function getSelected() {
  return await getSelectedFromArea(await getDataArea());
}

export async function setSelected(type: TYPE, selected: Rule | null) {
  return await setSelectedToArea(await getDataArea(), type, selected);
}

export const getLocalRules = getRules;
export const setLocalRules = setRules;
export const getLocalSelected = getSelected;
export const setLocalSelected = setSelected;
