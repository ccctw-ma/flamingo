import { create } from "zustand";
import { Group, Rule, TYPE } from "./types";
import { EMPTY_GROUP, EMPTY_RULE } from "./constants";
import { getLocalGroups, getLocalRules } from "./storage";

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
  selectedRule: EMPTY_RULE,
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
  selected: EMPTY_GROUP,
  setSelected: (val: Rule | Group) => set((state: any) => ({ selected: val })),
  setType: (val: TYPE) => set((state: any) => ({ type: val })),
}));

export function useGroupsAndRules() {
  const { groups, setGroups } = useGroup();
  const { rules, setRules } = useRule();
  const refresh = async () => {
    const localGroups = await getLocalGroups();
    const localRules = await getLocalRules();
    setGroups(localGroups);
    setRules(localRules);
  };
  return {
    groups,
    rules,
    setGroups,
    setRules,
    refresh,
  };
}
