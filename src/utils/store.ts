import { create } from "zustand";
import { Group, Rule, TYPE } from "./types";

type GroupStore = {
  groups: Array<Group>;
  selectedGroup: Group;
  setGroups: (val: Array<Group>) => void;
  setSelectedGroup: (val: Group) => void;
};
export const useGroup = create<GroupStore>()((set) => ({
  groups: [],
  selectedGroup: {
    id: -1,
    name: "",
    enable: false,
    update: 0,
    rules: [],
  },
  setGroups: (val: Array<Group>) => set((state: any) => ({ groups: val })),
  setSelectedGroup: (val: Group) =>
    set((state: any) => ({ selectedGroup: val })),
}));

type RuleStore = {
  rules: Array<Rule>;
  selectedRule: Rule;
  setRules: (val: Array<Rule>) => void;
  setSelectedRule: (val: Rule) => void;
};
export const useRule = create<RuleStore>()((set) => ({
  rules: [],
  selectedRule: {
    id: -1,
    name: "",
    enable: false,
    update: 0,
    isGlobal: 0,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.ALLOW,
    },
    condition: {
      regexFilter: "",
    },
  },
  setRules: (val: Array<Rule>) => set((state: any) => ({ rules: val })),
  setSelectedRule: (val: Rule) => set((state: any) => ({ selectedRule: val })),
}));

type SelecedStore = {
  type: TYPE;
  selected: Rule | Group;
  setSelected: (val: Rule | Group) => void;
  setType: (val: TYPE) => void;
};

export const useSelected = create<SelecedStore>()((set) => ({
  type: TYPE.Group,
  selected: {
    id: -1,
    name: "",
    enable: false,
    update: 0,
    rules: [],
  },
  setSelected: (val: Rule | Group) => set((state: any) => ({ selected: val })),
  setType: (val: TYPE) => set((state: any) => ({ type: val })),
}));
