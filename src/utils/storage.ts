import { noop } from ".";

export type AreaName = "sync" | "local" | "managed" | "session";

function storageSet(
  areaName: AreaName,
  obj: Object,
  callback: (args: any) => void
) {
  chrome.storage[areaName].set(obj).then(callback);
}

function storageGet(
  areaName: AreaName,
  keys: string | string[] | Object,
  callback: (items: Object) => void
) {
  chrome.storage[areaName].get(keys, callback);
}

export function localSet(obj: Object, callback: (args: any) => void = noop) {
  storageSet("local", obj, callback);
}

export function localGet(keys: any, callback: (items: any) => void) {
  storageGet("local", keys, callback);
}
