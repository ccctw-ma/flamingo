import { create } from "zustand";

type GroupStore = {
  group: any;
  setGroup: (val: any) => void;
};
export const useGroup = create<GroupStore>()((set) => ({
  group: {},
  setGroup: (val: any) =>
    set((state: any) => ({ group: { ...state.group, ...val } })),
}));
