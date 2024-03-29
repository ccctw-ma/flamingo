import { useState } from "react";
import {
  getLocalGroups,
  getLocalRules,
  getLocalSelected,
  localGet,
  updateGroups,
  updateRules,
} from "./storage";
import { useGroup, useRule, useSelected, useFlag, useConfigStore } from "./store";
import { Group, Rule, TYPE, configKeyType } from "./types";
import { message } from "antd";
import { CONFIG_OBJECT } from "./constants";

export function useGlobalState() {
  const { groups, setGroups } = useGroup();
  const { rules, setRules } = useRule();
  const { type, selected, setType, setSelected } = useSelected();
  const { edit, editType, setEdit, setEditType, hasError, setHasError } = useSelected();
  const { isSaved, setIsSaved, loaded, setIsLoaded } = useFlag();
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
    if (hasError) {
      setHasError(false);
      message.error(
        "The edited rule or group has errors and has been restored to a state without errors"
      );
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
      setState(...rest);
      setHasChange(true);
    };
  };
  return { hasChange, setHasChange, wrapChange };
};

export const useConfig = () => {
  const configStore = useConfigStore();
  const setConfig = configStore.setConfig;
  const initConfig = async () => {
    const configKeys = Object.keys(CONFIG_OBJECT);
    const res = await localGet(configKeys);
    for (const [key, val] of Object.entries(res)) {
      setConfig(key as configKeyType, val);
    }
  };

  return {
    ...configStore,
    initConfig,
  };
};
