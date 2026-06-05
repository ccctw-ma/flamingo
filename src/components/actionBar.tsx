import {
  ArrowsAltOutlined,
  ShrinkOutlined,
  PoweroffOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Tag } from "antd";
import { useState } from "react";
import { useGlobalState, useConfig } from "../utils/hooks";
import { useI18n } from "../utils/i18n";
import { useFlag } from "../utils/store";
import Hint from "./hint";
import SettingsPanel from "./settingsPanel";

const ActionBar = () => {
  const { selected, saveEdit } = useGlobalState();
  const { DETAIL, WORKING, RIGHT_HEADER_HEIGHT, setConfig } = useConfig();
  const { isSaved } = useFlag();
  const { t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div
        style={{ height: RIGHT_HEADER_HEIGHT }}
        className="editor-toolbar"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">
            {selected?.name || t("untitled")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tag
            color={isSaved ? "success" : "error"}
            className="!m-0 cursor-pointer !rounded-full !px-2 !py-[2px]"
            onClick={() => !isSaved && saveEdit()}
          >
            {isSaved ? t("saved") : t("savePending")}
          </Tag>
          <Hint title={DETAIL ? t("switchCompactMode") : t("switchDetailMode")} placement="bottom">
            <Button
              type={DETAIL ? "primary" : "default"}
              icon={DETAIL ? <ArrowsAltOutlined /> : <ShrinkOutlined />}
              aria-label={DETAIL ? t("switchCompactMode") : t("switchDetailMode")}
              onClick={() => setConfig("DETAIL", !DETAIL)}
            />
          </Hint>
          <Hint title={WORKING ? t("disableRuleEngine") : t("enableRuleEngine")} placement="bottom">
            <Button
              danger={WORKING}
              type={WORKING ? "primary" : "default"}
              icon={<PoweroffOutlined />}
              aria-label={WORKING ? t("disableRuleEngine") : t("enableRuleEngine")}
              onClick={() => setConfig("WORKING", !WORKING)}
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
