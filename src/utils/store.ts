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
  setGroups: (val: Array<Group>) => set({ groups: val }),
  setSelectedGroup: (val: Group) => set({ selectedGroup: val }),
}));

export const useRule = create<RuleStore>()((set) => ({
  rules: [],
  selectedRule: EMPTY_RULE,
  setRules: (val: Array<Rule>) => set({ rules: val }),
  setSelectedRule: (val: Rule) => set({ selectedRule: val }),
}));

export const useSelected = create<SelecedStore>()((set) => ({
  type: TYPE.Group,
  setType: (val: TYPE) => set({ type: val }),
  selected: DEMO_GROUP,
  setSelected: (val: Rule | Group) => set({ selected: val }),
  edit: DEMO_GROUP,
  setEdit: (val: Rule | Group) => set({ edit: val }),
  editType: TYPE.Group,
  setEditType: (val: TYPE) => set({ editType: val }),
  hasError: false,
  setHasError: (val: boolean) => set({ hasError: val }),
}));

export const useFlag = create<FalgStore>()((set) => ({
  isSaved: true,
  setIsSaved: (val: boolean) => set({ isSaved: val }),
  loaded: false,
  setIsLoaded: (val: boolean) => set({ loaded: val }),
}));

export const useConfigStore = create<ConfigStore>()((set) => ({
  ...CONFIG_OBJECT,
  setConfig: (key, val) =>
      set(() => {
      localSetBySingleKey(key, val);
      return { [key]: val };
    }),
}));
