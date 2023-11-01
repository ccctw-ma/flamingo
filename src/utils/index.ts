import { aa } from "./test";

export const calcTime = () => {
  return performance.now() + aa();
};

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

// no operation
export function noop() {}
