import { Dispatch, SetStateAction, useState } from "react";
import {
  getConfigValues,
  getRules,
  getSelected,
  setLocalSelected,
  setRules as persistRules,
  switchStorageMode,
  updateRules,
} from "./storage";
import { useRule, useSelected, useFlag, useConfigStore } from "./store";
import { Rule, TYPE, configKeyType } from "./types";
import { CONFIG_OBJECT } from "./constants";
import { applySingleActiveSelection } from "./index";

export function useGlobalState() {
  const { rules, setRules } = useRule();
  const { type, selected, setType, setSelected } = useSelected();
  const { edit, editType, setEdit, setEditType, setHasError } = useSelected();
  const { loaded, setIsLoaded } = useFlag();
  const refresh = async () => {
    const localRules: Rule[] = await getRules();
    const [localSelectedType, localSelected] = await getSelected();
    setRules(localRules);
    const currentSelected =
      localSelectedType === TYPE.Rule && localSelected
        ? localRules.find((r) => r.id === localSelected.id)
        : undefined;
    const fallbackRule = currentSelected || localRules[0] || null;
    setSelected(fallbackRule);
    setType(TYPE.Rule);
    if (!loaded) setIsLoaded(true);
    return { localRules, currentSelected: fallbackRule };
  };
  const selectRule = async (rule: Rule) => {
    await setLocalSelected(TYPE.Rule, rule);
    if (useConfigStore.getState().SINGLE_ACTIVE) {
      const latestRules = await getRules();
      const nextRules = applySingleActiveSelection(latestRules, rule);
      await persistRules(nextRules);
      await refresh();
      return;
    }
    setType(TYPE.Rule);
    setSelected(rule);
  };
  const saveEdit = async (newEdit?: Rule) => {
    const updateEdit = newEdit || edit;
    if (!updateEdit) {
      return;
    }
    await updateRules(updateEdit);
    setEdit(updateEdit);
    return await refresh();
  };
  return {
    loaded,
    type,
    selected,
    rules,
    edit,
    editType,
    setRules,
    setSelected,
    setType,
    selectRule,
    refresh,
    setEdit,
    setEditType,
    saveEdit,
    setHasError,
  };
}

export const useChange = () => {
  const [hasChange, setHasChange] = useState(false);

  const wrapChange = <T>(setState: Dispatch<SetStateAction<T>>) => {
    return (value: SetStateAction<T>) => {
      setState(value);
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
    const res = await getConfigValues(configKeys as configKeyType[]);
    for (const [key, val] of Object.entries(res)) {
      setConfig(key as configKeyType, val as (typeof CONFIG_OBJECT)[configKeyType]);
    }
  };

  return {
    ...configStore,
    initConfig,
    switchStorageMode,
  };
};
