import { create } from "zustand";
import { Group, Rule, TYPE } from "./types";
import { DEMO_GROUP, EMPTY_GROUP, EMPTY_RULE } from "./constants";

type GroupStore = {
  groups: Array<Group>;
  selectedGroup: Group;
  setGroups: (val: Array<Group>) => void;
  setSelectedGroup: (val: Group) => void;
};
export const useGroup = create<GroupStore>()((set) => ({
  groups: [],
  selectedGroup: EMPTY_GROUP,
  setGroups: (val: Array<Group>) => set((state: any) => ({ groups: val })),
  setSelectedGroup: (val: Group) => set((state: any) => ({ selectedGroup: val })),
}));

type RuleStore = {
  rules: Array<Rule>;
  selectedRule: Rule;
  setRules: (val: Array<Rule>) => void;
  setSelectedRule: (val: Rule) => void;
};
export const useRule = create<RuleStore>()((set) => ({
  rules: [],
  selectedRule: EMPTY_RULE,
  setRules: (val: Array<Rule>) => set((state: any) => ({ rules: val })),
  setSelectedRule: (val: Rule) => set((state: any) => ({ selectedRule: val })),
}));

type SelecedStore = {
  type: TYPE;
  selected: Rule | Group;
  setSelected: (val: Rule | Group) => void;
  setType: (val: TYPE) => void;
  edit: Rule | Group;
  setEdit: (val: Rule | Group) => void;
  editType: TYPE;
  setEditType: (val: TYPE) => void;
  hasError: boolean;
  setHasError: (val: boolean) => void;
};

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

type FalgStore = {
  isSaved: boolean;
  setIsSaved: (val: boolean) => void;
};

export const useFlag = create<FalgStore>()((set) => ({
  isSaved: true,
  setIsSaved: (val: boolean) => set((state: any) => ({ isSaved: val })),
}));

type ConfigStore = {
  isDetail: boolean;
  setIsDetail: (val: boolean) => void;
  isWorking: boolean;
  setIsWorking: (val: boolean) => void;
};

export const useConfigStore = create<ConfigStore>()((set) => ({
  isDetail: false,
  setIsDetail: (val: boolean) => set((state: any) => ({ isDetail: val })),
  isWorking: true,
  setIsWorking: (val: boolean) => set((state: any) => ({ isWorking: val })),
}));
