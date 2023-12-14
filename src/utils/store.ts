import { create } from "zustand";
import { Group, Rule, TYPE } from "./types";
import { EMPTY_GROUP, EMPTY_RULE } from "./constants";
import { getLocalGroups, getLocalRules, getLocalSelected } from "./storage";
import { useState } from "react";

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
  const { type, selected, setType, setSelected } = useSelected();
  const [loaded, setIsLoaded] = useState(false);
  const refresh = async () => {
    const localGroups: Group[] = await getLocalGroups();
    const localRules: Rule[] = await getLocalRules();
    const [localSelectedType, localSelected] = await getLocalSelected();
    setGroups(localGroups);
    setRules(localRules);
    /**
     * It is necessary to keep the selected rule or group
     * synchronized with the database storage
     */
    setSelected(
      localSelectedType === TYPE.Group
        ? localGroups.find((g) => g.id === localSelected.id)!
        : localRules.find((r) => r.id === localSelected.id)!
    );
    setType(localSelectedType);
    !loaded && setIsLoaded(true);
    console.log("refresh");
  };
  return {
    loaded,
    type,
    selected,
    groups,
    rules,
    setGroups,
    setRules,
    refresh,
  };
}

type FalgStore = {
  isSaved: boolean;
  setIsSaved: (val: boolean) => void;
};

export const useFlag = create<FalgStore>()((set) => ({
  isSaved: true,
  setIsSaved: (val: boolean) => set((state: any) => ({ isSaved: val })),
}));
