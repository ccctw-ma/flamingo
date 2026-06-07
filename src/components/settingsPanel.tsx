import { Button, Drawer, InputNumber, Segmented, message } from "antd";
import { useEffect, useState } from "react";
import { useI18n } from "../utils/i18n";
import { useConfig, useGlobalState } from "../utils/hooks";
import { StorageMode } from "../utils/storage";

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

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { t } = useI18n();
  const {
    LOCALE,
    STORAGE_MODE,
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

  useEffect(() => {
    setPanelWidth(HOME_WIDTH);
    setPanelHeight(HOME_HEIGHT);
  }, [HOME_HEIGHT, HOME_WIDTH]);

  const handleLocaleChange = (value: string | number) => {
    setConfig("LOCALE", value === "en" ? "en" : "zh-CN");
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
        </div>
      </Drawer>
    </>
  );
}
