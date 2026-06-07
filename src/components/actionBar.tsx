import { FullscreenOutlined, PoweroffOutlined, SettingOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useState } from "react";
import { useGlobalState, useConfig } from "../utils/hooks";
import { useI18n } from "../utils/i18n";
import Hint from "./hint";
import SettingsPanel from "./settingsPanel";

const ActionBar = () => {
  const { selected, rules } = useGlobalState();
  const { WORKING, RIGHT_HEADER_HEIGHT, setConfig } = useConfig();
  const { t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const syncBrowserAction = (nextWorking: boolean) => {
    const iconPrefix = nextWorking ? "flamingo" : "flamingo_grey";
    const enabledRuleCount = rules.filter((rule) => rule.enable).length;

    if (chrome.action?.setIcon) {
      void chrome.action.setIcon({
        path: {
          16: `images/${iconPrefix}_16.png`,
          32: `images/${iconPrefix}_32.png`,
          48: `images/${iconPrefix}_48.png`,
          128: `images/${iconPrefix}_128.png`,
        },
      });
      void chrome.action.setBadgeText({ text: nextWorking ? String(enabledRuleCount) : "" });
    }

    if (chrome.runtime?.sendMessage) {
      void chrome.runtime.sendMessage({
        type: "FLAMINGO_SYNC_ACTION_STATE",
        isWorking: nextWorking,
        enabledRuleCount,
      });
    }
  };

  return (
    <>
      <div style={{ height: RIGHT_HEADER_HEIGHT }} className="editor-toolbar">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">
            {selected?.name || t("untitled")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Hint title={t("fullscreen")} placement="bottom">
            <Button
              icon={<FullscreenOutlined />}
              aria-label={t("fullscreen")}
              onClick={() => {
                void chrome.tabs.create({
                  url: chrome.runtime.getURL("home.html?mode=tab"),
                });
              }}
            />
          </Hint>
          <Hint title={WORKING ? t("disableRuleEngine") : t("enableRuleEngine")} placement="bottom">
            <Button
              danger={WORKING}
              type={WORKING ? "primary" : "default"}
              icon={<PoweroffOutlined />}
              aria-label={WORKING ? t("disableRuleEngine") : t("enableRuleEngine")}
              onClick={() => {
                const nextWorking = !WORKING;
                setConfig("WORKING", nextWorking);
                syncBrowserAction(nextWorking);
              }}
            />
          </Hint>
          <Hint title={t("settings")} placement="bottom">
            <Button
              icon={<SettingOutlined />}
              aria-label={t("settings")}
              onClick={() => setSettingsOpen(true)}
            />
          </Hint>
        </div>
      </div>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default ActionBar;
