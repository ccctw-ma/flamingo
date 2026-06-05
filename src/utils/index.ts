import { Group, Rule, TYPE } from "./types";

/**
 * Throttle a function so it runs at most once per `delay` ms.
 */
export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay = 10
): (...args: Args) => void {
  let locked = false;
  return (...args: Args) => {
    if (locked) {
      return;
    }
    locked = true;
    fn(...args);
    setTimeout(() => {
      locked = false;
    }, delay);
  };
}

const nextCount = (() => {
  let count = 1;
  return () => count++;
})();

/**
 * Generate a (best-effort) unique id for a rule or group based on the timestamp.
 */
export function generateId(): number {
  return (Date.now() % (10 ** 9 + 7)) + nextCount();
}

/** No-op placeholder. */
export function noop(): void {}

/** Left-pad a number to at least two digits. */
export function padZero(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

export const obj2str = (value: unknown): string => JSON.stringify(value, null, 2);

export const str2obj = <T = unknown>(value: string): T => JSON.parse(value) as T;

export function deepClone<T>(obj: T, hash = new WeakMap()): T {
  if (obj === null) return obj;
  if (obj instanceof Date) return new Date(obj) as unknown as T;
  if (obj instanceof RegExp) return new RegExp(obj) as unknown as T;
  if (typeof obj !== "object") return obj;

  // Solve circular references.
  if (hash.has(obj as object)) return hash.get(obj as object);

  const newObj: Record<string, unknown> | unknown[] = Array.isArray(obj) ? [] : {};
  hash.set(obj as object, newObj);
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      (newObj as Record<string, unknown>)[key] = deepClone((obj as Record<string, unknown>)[key], hash);
    }
  }
  return newObj as T;
}

const unDisplayKeys = ["id", "name", "create", "update", "enable"] as const;

export const removeKeys = (target: Record<string, unknown>): void => {
  for (const key of unDisplayKeys) {
    delete target[key];
  }
};

export const addKeys = (target: Record<string, unknown>, source: Record<string, unknown>): void => {
  for (const key of unDisplayKeys) {
    target[key] = key === "update" ? Date.now() : source[key];
  }
};

export const filterEditContent = (edit: Group | Rule, type: TYPE): unknown => {
  const cloned = deepClone(edit);
  if (type === TYPE.Rule) {
    removeKeys(cloned as unknown as Record<string, unknown>);
    return cloned;
  }
  (cloned as Group).rules?.forEach((rule) => removeKeys(rule as unknown as Record<string, unknown>));
  return (cloned as Group).rules;
};
