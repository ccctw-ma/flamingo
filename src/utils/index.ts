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

// no operation for placeholder
export function noop() {}
