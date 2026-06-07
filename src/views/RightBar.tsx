import { useEffect } from "react";
import { Empty } from "antd";
import ActionBar from "../components/actionBar";
import RuleEditor from "../components/ruleEditor";
import { useI18n } from "../utils/i18n";
import { useChange, useGlobalState } from "../utils/hooks";
import { TYPE } from "../utils/types";

export default function RightBar() {
  const { selected, setEdit, setEditType } = useGlobalState();
  const { setHasChange } = useChange();
  const { t } = useI18n();

  // Sync editor state to the current rule when switching selection or mode.
  useEffect(() => {
    setEdit(selected);
    setEditType(TYPE.Rule);
    setHasChange(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  if (!selected) {
    return (
      <div className="h-full w-full overflow-hidden">
        <ActionBar />
        <div className="editor-body flex items-center justify-center">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("emptySelection")} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <ActionBar />
      <div className="editor-body">
        <RuleEditor />
      </div>
    </div>
  );
}
