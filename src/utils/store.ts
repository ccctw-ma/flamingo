import { create } from "zustand";
import { ConfigStore, FalgStore, Rule, RuleStore, SelecedStore, TYPE } from "./types";
import { CONFIG_OBJECT } from "./constants";
import { setConfigValue } from "./storage";

const POPUP_WIDTH_STORAGE_KEY = "flamingo:popup-width";
const POPUP_HEIGHT_STORAGE_KEY = "flamingo:popup-height";

function getBootstrapDimension(
  key: typeof POPUP_WIDTH_STORAGE_KEY | typeof POPUP_HEIGHT_STORAGE_KEY,
  fallback: number,
  min: number,
  max: number
) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = Number(window.localStorage.getItem(key));
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function getBootstrapConfig() {
  return {
    ...CONFIG_OBJECT,
    HOME_WIDTH: getBootstrapDimension(POPUP_WIDTH_STORAGE_KEY, CONFIG_OBJECT.HOME_WIDTH, 640, 800),
    HOME_HEIGHT: getBootstrapDimension(
      POPUP_HEIGHT_STORAGE_KEY,
      CONFIG_OBJECT.HOME_HEIGHT,
      420,
      600
    ),
  };
}

export const useRule = create<RuleStore>()((set) => ({
  rules: [],
  selectedRule: null,
  setRules: (val: Array<Rule>) => set({ rules: val }),
  setSelectedRule: (val: Rule | null) => set({ selectedRule: val }),
}));

export const useSelected = create<SelecedStore>()((set) => ({
  type: TYPE.Rule,
  setType: (val: TYPE) => set({ type: val }),
  selected: null,
  setSelected: (val: Rule | null) => set({ selected: val }),
  edit: null,
  setEdit: (val: Rule | null) => set({ edit: val }),
  editType: TYPE.Rule,
  setEditType: (val: TYPE) => set({ editType: val }),
  hasError: false,
  setHasError: (val: boolean) => set({ hasError: val }),
}));

export const useFlag = create<FalgStore>()((set) => ({
  loaded: false,
  setIsLoaded: (val: boolean) => set({ loaded: val }),
}));

export const useConfigStore = create<ConfigStore>()((set) => ({
  ...getBootstrapConfig(),
  setConfig: (key, val) =>
    set(() => {
      void setConfigValue(key, val);
      return { [key]: val };
    }),
}));
