import { aa } from "./test";

export const calcTime = () => {
  return performance.now() + aa();
};
