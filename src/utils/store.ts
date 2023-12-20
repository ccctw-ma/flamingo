import { create } from "zustand";
import { Group, Rule, TYPE } from "./types";
import { DEMO_GROUP, EMPTY_GROUP, EMPTY_RULE } from "./constants";
import {
  getLocalGroups,
  getLocalRules,
  getLocalSelected,
  updateGroups,
  updateRules,
} from "./storage";
import { useState } from "react";
import { message } from "antd";

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

export function useGlobalState() {
  const { groups, setGroups } = useGroup();
  const { rules, setRules } = useRule();
  const { type, selected, setType, setSelected } = useSelected();
  const { edit, editType, setEdit, setEditType, hasError, setHasError } =
    useSelected();
  const [loaded, setIsLoaded] = useState(false);
  const { isSaved, setIsSaved } = useFlag();
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
    const currentSelected =
      localSelectedType === TYPE.Group
        ? localGroups.find((g) => g.id === localSelected.id)!
        : localRules.find((r) => r.id === localSelected.id)!;
    setSelected(currentSelected || localGroups[0]);
    setType(currentSelected ? localSelectedType : TYPE.Group);
    !loaded && setIsLoaded(true);
    console.log("refresh");
    return { localGroups, localRules, currentSelected };
  };
  const saveEdit = async (newEdit?: Rule | Group) => {
    if (isSaved && !newEdit) {
      return;
    }
    const updateEdit = newEdit || edit;
    if (editType === TYPE.Group) {
      await updateGroups(updateEdit as Group);
    } else {
      await updateRules(updateEdit as Rule);
    }
    setIsSaved(true);
    setEdit(updateEdit);
    return await refresh();
  };
  return {
    loaded,
    type,
    selected,
    groups,
    rules,
    edit,
    editType,
    setGroups,
    setRules,
    setSelected,
    setType,
    refresh,
    setEdit,
    setEditType,
    saveEdit,
    setHasError,
  };
}

type FalgStore = {
  isSaved: boolean;
  setIsSaved: (val: boolean) => void;
  isDetail: boolean;
  setIsDetail: (val: boolean) => void;
  isWorking: boolean;
  setIsWorking: (val: boolean) => void;
};

export const useFlag = create<FalgStore>()((set) => ({
  isSaved: true,
  setIsSaved: (val: boolean) => set((state: any) => ({ isSaved: val })),
  isDetail: false,
  setIsDetail: (val: boolean) => set((state: any) => ({ isDetail: val })),
  isWorking: true,
  setIsWorking: (val: boolean) => set((state: any) => ({ isWorking: val })),
}));
