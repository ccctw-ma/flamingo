import typia from "typia";

export function throttle(fn: any, delay = 10) {
  let f = false;
  return (...rest: any) => {
    if (f) {
      return;
    }
    f = true;
    fn.call(null, ...rest);
    setTimeout(() => {
      f = false;
    }, delay);
  };
}

const Count = (() => {
  let c = 1;
  return () => {
    return c++;
  };
})();

/**
 * generate unique id for rule
 * here use timeStamp
 */
export function generateId() {
  return Date.now() + Count();
}

// no operation just for placeholder
export function noop() {}

/**
 * loop until the condition is readched,
 * action can be executed or time out
 *  */
export function loop(condition: () => any, action: () => void, time: number) {
  const start = Date.now();
  const end = start + time;
  const fn = () => {
    console.log(condition());
    if (condition()) {
      action();
      return;
    }
    if (Date.now() > end) {
      return;
    }
    requestIdleCallback(fn);
  };

  fn();
}

export const obj2str = (x: any) => JSON.stringify(x, null, "\t");

export const str2obj = (x: string) => JSON.parse(x);

export function deepClone(obj: any, hash = new WeakMap()) {
  if (obj === null) return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (typeof obj !== "object") return obj;

  // 解决循环依赖问题
  if (hash.get(obj)) return hash.get(obj);

  let newObj: any = {};
  hash.set(obj, newObj);
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[key] = deepClone(obj[key], hash);
    }
  }
  return newObj;
}

const unDisplayKeys = ["id", "name", "create", "update", "enable"];

export const removeKeys = (o: any) => {
  for (let key of unDisplayKeys) {
    delete o[key];
  }
};

export const addKeys = (o: any, cur: any) => {
  for (let key of unDisplayKeys) {
    o[key] = cur[key];
  }
};
