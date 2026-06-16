import {
  FullscreenOutlined,
  PoweroffOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useState } from "react";
import { useGlobalState, useConfig } from "../utils/hooks";
import { useI18n } from "../utils/i18n";
import Hint from "./hint";
import SettingsPanel from "./settingsPanel";
import AIRuleAssistant from "./aiRuleAssistant";
import { setRules as persistRules, setLocalSelected } from "../utils/storage";
import { Rule, TYPE } from "../utils/types";

const ActionBar = () => {
  const { selected, rules, refresh } = useGlobalState();
  const { WORKING, RIGHT_HEADER_HEIGHT, setConfig } = useConfig();
  const { t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  const syncBrowserAction = (nextWorking: boolean) => {
    const enabledRuleCount = rules.filter(
      (rule) => rule.enable && rule.groupEnabled !== false
    ).length;
    const hasActiveRules = nextWorking && enabledRuleCount > 0;
    const iconPrefix = hasActiveRules ? "flamingo" : "flamingo_grey";

    if (chrome.action?.setIcon) {
      void chrome.action.setIcon({
        path: {
          16: `images/${iconPrefix}_16.png`,
          32: `images/${iconPrefix}_32.png`,
          48: `images/${iconPrefix}_48.png`,
          128: `images/${iconPrefix}_128.png`,
        },
      });
      void chrome.action.setBadgeText({ text: hasActiveRules ? String(enabledRuleCount) : "" });
    }

    if (chrome.runtime?.sendMessage) {
      void chrome.runtime.sendMessage({
        type: "FLAMINGO_SYNC_ACTION_STATE",
        isWorking: nextWorking,
        enabledRuleCount,
      });
    }
  };

  const applyAIRules = async (draftRules: Rule[], options?: { replaceIds?: number[] }) => {
    const replaceIds = new Set(options?.replaceIds ?? []);
    const firstReplaceIndex = replaceIds.size
      ? rules.findIndex((rule) => replaceIds.has(rule.id))
      : -1;
    const nextRules = replaceIds.size
      ? rules.filter((rule) => !replaceIds.has(rule.id))
      : [...rules];
    if (firstReplaceIndex >= 0) {
      nextRules.splice(firstReplaceIndex, 0, ...draftRules);
    } else {
      nextRules.push(...draftRules);
    }
    await persistRules(nextRules);
    await setLocalSelected(TYPE.Rule, draftRules[0] ?? selected);
    await refresh();
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
          <Hint title={t("aiGenerateRule")} placement="bottom">
            <Button
              icon={<ThunderboltOutlined />}
              aria-label={t("aiGenerateRule")}
              onClick={() => setAiAssistantOpen(true)}
            />
          </Hint>
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
      <AIRuleAssistant
        open={aiAssistantOpen}
        rules={rules}
        selectedRule={selected}
        onClose={() => setAiAssistantOpen(false)}
        onApply={applyAIRules}
      />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default ActionBar;
