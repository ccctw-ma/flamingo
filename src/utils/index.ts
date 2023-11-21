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

/**
 * generate unique id for rule
 * here use timeStamp
 */
export function generateId() {
  return Date.now();
}

// no operation for placeholder
export function noop() {}

