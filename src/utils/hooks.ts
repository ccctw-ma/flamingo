import { useState } from "react";
import {
  getLocalGroups,
  getLocalRules,
  getLocalSelected,
  updateGroups,
  updateRules,
} from "./storage";
import { useGroup, useRule, useSelected, useFlag } from "./store";
import { Group, Rule, TYPE } from "./types";

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

export const useChange = () => {
  const [hasChange, setHasChange] = useState(false);

  const wrapChange = (setState: any) => {
    return (...rest: any) => {
      setHasChange(true);
      setState(...rest);
    };
  };
  return { hasChange, setHasChange, wrapChange };
};
