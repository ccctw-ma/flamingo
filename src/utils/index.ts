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
