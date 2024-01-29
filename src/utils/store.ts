import { create } from "zustand";
import {
  ConfigStore,
  FalgStore,
  Group,
  GroupStore,
  Rule,
  RuleStore,
  SelecedStore,
  TYPE,
} from "./types";
import { CONFIG_OBJECT, DEMO_GROUP, EMPTY_GROUP, EMPTY_RULE } from "./constants";
import { localSetBySingleKey } from "./storage";

export const useGroup = create<GroupStore>()((set) => ({
  groups: [],
  selectedGroup: EMPTY_GROUP,
  setGroups: (val: Array<Group>) => set((state: any) => ({ groups: val })),
  setSelectedGroup: (val: Group) => set((state: any) => ({ selectedGroup: val })),
}));

export const useRule = create<RuleStore>()((set) => ({
  rules: [],
  selectedRule: EMPTY_RULE,
  setRules: (val: Array<Rule>) => set((state: any) => ({ rules: val })),
  setSelectedRule: (val: Rule) => set((state: any) => ({ selectedRule: val })),
}));

export const useSelected = create<SelecedStore>()((set) => ({
  type: TYPE.Group,
  setType: (val: TYPE) => set((state: any) => ({ type: val })),
  selected: DEMO_GROUP,
  setSelected: (val: Rule | Group) => set((state: any) => ({ selected: val })),
  edit: DEMO_GROUP,
  setEdit: (val: Rule | Group) => set((state: any) => ({ edit: val })),
  editType: TYPE.Group,
  setEditType: (val: TYPE) => set((state: any) => ({ editType: val })),
  hasError: false,
  setHasError: (val: boolean) => set((state: any) => ({ hasError: val })),
}));

export const useFlag = create<FalgStore>()((set) => ({
  isSaved: true,
  setIsSaved: (val: boolean) => set((state: any) => ({ isSaved: val })),
  loaded: false,
  setIsLoaded: (val: boolean) => set((state: any) => ({ loaded: val })),
}));

export const useConfigStore = create<ConfigStore>()((set) => ({
  ...CONFIG_OBJECT,
  setConfig: (key, val) =>
    set((state: any) => {
      localSetBySingleKey(key, val);
      return { [key]: val };
    }),
}));
