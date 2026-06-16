import { Button, Drawer, Input, InputNumber, Segmented, Select, Switch, message } from "antd";
import { useEffect, useState } from "react";
import { AIProvider } from "../ai/types";
import {
  AI_PROVIDER_PRESETS,
  DEFAULT_AI_SETTINGS,
  getAISettings,
  setAISettings,
} from "../ai/runtime";
import { useI18n } from "../utils/i18n";
import { useConfig, useGlobalState } from "../utils/hooks";
import { StorageMode, getRules, getSelected, setRules as persistRules } from "../utils/storage";
import { applySingleActiveSelection } from "../utils";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const POPUP_WIDTH_MIN = 640;
const POPUP_WIDTH_MAX = 800;
const POPUP_HEIGHT_MIN = 420;
const POPUP_HEIGHT_MAX = 600;
const POPUP_WIDTH_STORAGE_KEY = "flamingo:popup-width";
const POPUP_HEIGHT_STORAGE_KEY = "flamingo:popup-height";
const PRIVACY_POLICY_URL = "https://ccctw-ma.github.io/flamingo/privacy-policy.html";

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { t } = useI18n();
  const {
    LOCALE,
    STORAGE_MODE,
    SINGLE_ACTIVE,
    HOME_WIDTH,
    HOME_HEIGHT,
    setConfig,
    switchStorageMode,
    initConfig,
  } = useConfig();
  const { refresh } = useGlobalState();
  const [messageApi, contextHolder] = message.useMessage();
  const [panelWidth, setPanelWidth] = useState(HOME_WIDTH);
  const [panelHeight, setPanelHeight] = useState(HOME_HEIGHT);
  const [aiSettings, setAISettingsDraft] = useState(DEFAULT_AI_SETTINGS);
  useEffect(() => {
    setPanelWidth(HOME_WIDTH);
    setPanelHeight(HOME_HEIGHT);
  }, [HOME_HEIGHT, HOME_WIDTH]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void getAISettings().then(setAISettingsDraft);
  }, [open]);

  const handleLocaleChange = (value: string | number) => {
    setConfig("LOCALE", value === "en" ? "en" : "zh-CN");
  };

  const handleSingleActiveChange = async (checked: boolean) => {
    setConfig("SINGLE_ACTIVE", checked);
    if (!checked) {
      return;
    }
    // Turning on single-active should leave only the current selection enabled.
    const [latestRules, [, selected]] = await Promise.all([getRules(), getSelected()]);
    const target = selected
      ? latestRules.find((rule) => rule.id === selected.id) ?? null
      : latestRules.find((rule) => rule.enable && rule.groupEnabled !== false) ?? null;
    const nextRules = applySingleActiveSelection(latestRules, target);
    await persistRules(nextRules);
    await refresh();
  };

  const handleStorageModeChange = async (value: string | number) => {
    const nextMode = value as StorageMode;
    if (nextMode === STORAGE_MODE) {
      return;
    }

    await switchStorageMode(nextMode);
    await initConfig();
    await refresh();
    messageApi.success(nextMode === "sync" ? t("currentStorageSync") : t("currentStorageLocal"));
  };

  const handlePanelSizeSave = () => {
    const nextWidth = Math.min(
      POPUP_WIDTH_MAX,
      Math.max(POPUP_WIDTH_MIN, Math.round(panelWidth || HOME_WIDTH))
    );
    const nextHeight = Math.min(
      POPUP_HEIGHT_MAX,
      Math.max(POPUP_HEIGHT_MIN, Math.round(panelHeight || HOME_HEIGHT))
    );
    setConfig("HOME_WIDTH", nextWidth);
    setConfig("HOME_HEIGHT", nextHeight);
    window.localStorage.setItem(POPUP_WIDTH_STORAGE_KEY, String(nextWidth));
    window.localStorage.setItem(POPUP_HEIGHT_STORAGE_KEY, String(nextHeight));
    document.documentElement.style.setProperty("--flamingo-popup-width", `${nextWidth}px`);
    document.documentElement.style.setProperty("--flamingo-popup-height", `${nextHeight}px`);
    messageApi.success(t("panelSizeSaved"));
  };

  const handleAIProviderChange = (provider: AIProvider) => {
    const preset = AI_PROVIDER_PRESETS[provider];
    setAISettingsDraft((current) => ({
      ...current,
      provider,
      baseUrl: preset.baseUrl,
      model: preset.defaultModel,
      apiKey: current.apiKeys[provider] || "",
    }));
  };

  const handleAISettingsSave = async () => {
    await setAISettings(aiSettings);
    messageApi.success(t("aiSettingsSaved"));
  };

  return (
    <>
      {contextHolder}
      <Drawer
        open={open}
        onClose={onClose}
        title={t("settingsTitle")}
        placement="right"
        width={320}
      >
        <div className="flex flex-col gap-4">
          <section className="editor-card !m-0">
            <div className="mb-1 text-sm font-semibold text-slate-900">{t("language")}</div>
            <div className="mb-3 text-xs leading-5 text-slate-500">{t("languageDescription")}</div>
            <Segmented
              block
              value={LOCALE}
              onChange={handleLocaleChange}
              options={[
                { label: t("chinese"), value: "zh-CN" },
                { label: t("english"), value: "en" },
              ]}
            />
          </section>

          <section className="editor-card !m-0">
            <div className="mb-1 text-sm font-semibold text-slate-900">{t("storageMode")}</div>
            <div className="mb-3 text-xs leading-5 text-slate-500">
              {t("storageModeDescription")}
            </div>
            <Segmented
              block
              value={STORAGE_MODE}
              onChange={handleStorageModeChange}
              options={[
                { label: t("localStorage"), value: "local" },
                { label: t("syncStorage"), value: "sync" },
              ]}
            />
            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
              {t("storageSwitchHint")}
            </div>
          </section>

          <section className="editor-card !m-0">
            <div className="mb-1 text-sm font-semibold text-slate-900">{t("singleActive")}</div>
            <div className="mb-3 text-xs leading-5 text-slate-500">
              {t("singleActiveDescription")}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
              <span className="text-xs font-medium text-slate-600">{t("singleActive")}</span>
              <Switch
                checked={SINGLE_ACTIVE}
                onChange={(checked) => void handleSingleActiveChange(checked)}
              />
            </div>
          </section>

          <section className="editor-card !m-0">
            <div className="mb-1 text-sm font-semibold text-slate-900">{t("panelSize")}</div>
            <div className="mb-3 text-xs leading-5 text-slate-500">{t("panelSizeDescription")}</div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
                <span>{t("panelWidth")}</span>
                <InputNumber
                  min={POPUP_WIDTH_MIN}
                  max={POPUP_WIDTH_MAX}
                  value={panelWidth}
                  onChange={(value) =>
                    setPanelWidth(typeof value === "number" ? value : HOME_WIDTH)
                  }
                  addonAfter="px"
                  className="w-full"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
                <span>{t("panelHeight")}</span>
                <InputNumber
                  min={POPUP_HEIGHT_MIN}
                  max={POPUP_HEIGHT_MAX}
                  value={panelHeight}
                  onChange={(value) =>
                    setPanelHeight(typeof value === "number" ? value : HOME_HEIGHT)
                  }
                  addonAfter="px"
                  className="w-full"
                />
              </label>
            </div>
            <Button className="mt-3" type="primary" block onClick={handlePanelSizeSave}>
              {t("panelSizeSave")}
            </Button>
          </section>

          <section className="editor-card !m-0">
            <div className="mb-1 text-sm font-semibold text-slate-900">{t("aiSettings")}</div>
            <div className="mb-3 text-xs leading-5 text-slate-500">
              {t("aiSettingsDescription")}
            </div>
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
              <span className="text-xs font-medium text-slate-600">{t("aiAssistantEnabled")}</span>
              <Switch
                checked={aiSettings.enabled}
                onChange={(enabled) =>
                  setAISettingsDraft((current) => ({
                    ...current,
                    enabled,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
                <span>{t("aiProvider")}</span>
                <Select
                  value={aiSettings.provider}
                  onChange={handleAIProviderChange}
                  options={Object.values(AI_PROVIDER_PRESETS).map((preset) => ({
                    label: preset.label,
                    value: preset.provider,
                  }))}
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
                <span>{t("aiModel")}</span>
                <Select
                  value={aiSettings.model}
                  onChange={(model) =>
                    setAISettingsDraft((current) => ({
                      ...current,
                      model,
                    }))
                  }
                  options={AI_PROVIDER_PRESETS[aiSettings.provider].models}
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
                <span>{t("aiApiKey")}</span>
                <Input.Password
                  value={aiSettings.apiKey}
                  onChange={(event) =>
                    setAISettingsDraft((current) => ({
                      ...current,
                      apiKey: event.target.value,
                      apiKeys: {
                        ...current.apiKeys,
                        [current.provider]: event.target.value,
                      },
                    }))
                  }
                  autoComplete="off"
                />
              </label>
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                {t("aiApiKeyLocalHint")}
              </div>
              <Button type="primary" block onClick={handleAISettingsSave}>
                {t("aiSettingsSave")}
              </Button>
            </div>
          </section>

          <section className="editor-card !m-0">
            <div className="mb-1 text-sm font-semibold text-slate-900">{t("privacyPolicy")}</div>
            <div className="mb-3 text-xs leading-5 text-slate-500">
              {t("privacyPolicyDescription")}
            </div>
            <Button block href={PRIVACY_POLICY_URL} target="_blank" rel="noreferrer">
              {t("openPrivacyPolicy")}
            </Button>
          </section>
        </div>
      </Drawer>
    </>
  );
}
