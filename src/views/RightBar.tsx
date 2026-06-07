import { Suspense, lazy, useEffect } from "react";
import { Empty } from "antd";
import ActionBar from "../components/actionBar";
import RuleEditor from "../components/ruleEditor";
import { useI18n } from "../utils/i18n";
import { useChange, useConfig, useGlobalState } from "../utils/hooks";
import { TYPE } from "../utils/types";

const DetailEditor = lazy(() => import("../components/detailEditor"));

interface RightBarProps {
  width: number;
}

export default function RightBar({ width }: RightBarProps) {
  const { selected, saveEdit, setEdit, setEditType } = useGlobalState();
  const { setHasChange } = useChange();
  const { DETAIL } = useConfig();
  const { t } = useI18n();

  // Sync editor state to the current rule when switching selection or mode.
  useEffect(() => {
    (async () => {
      await saveEdit();
      setEdit(selected);
      setEditType(TYPE.Rule);
      setHasChange(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, DETAIL]);

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
        {DETAIL ? (
          <Suspense
            fallback={<div className="p-4 text-sm text-slate-500">{t("loadingEditor")}</div>}
          >
            <DetailEditor width={width} />
          </Suspense>
        ) : (
          <RuleEditor />
        )}
      </div>
    </div>
  );
}
