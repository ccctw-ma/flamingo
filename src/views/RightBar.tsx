import { Divider } from "antd";
import { Suspense, lazy, useEffect } from "react";
import ActionBar from "../components/actionBar";
import GroupEditor from "../components/groupEditor";
import MatchedRules from "../components/matchedRules";
import RuleEditor from "../components/ruleEditor";
import { useChange, useConfig, useGlobalState } from "../utils/hooks";
import { TYPE } from "../utils/types";

const DetailEditor = lazy(() => import("../components/detailEditor"));

interface RightBarProps {
  width: number;
}

export default function RightBar({ width }: RightBarProps) {
  const { type, selected, saveEdit, setEdit, setEditType } = useGlobalState();
  const { hasChange, setHasChange } = useChange();
  const { DETAIL, MATCH, setConfig } = useConfig();

  useEffect(() => {
    (async () => {
      await saveEdit();
      setEdit(selected);
      setEditType("rules" in selected ? TYPE.Group : TYPE.Rule);
      if (hasChange) {
        setConfig("MATCH", false);
      }
      setHasChange(true);
    })();
  }, [selected, DETAIL]);

  return (
    <div className="w-full h-full overflow-hidden">
      <ActionBar />
      <Divider style={{ marginTop: 0, marginBottom: 0 }} />
      {MATCH ? (
        <MatchedRules />
      ) : DETAIL ? (
        <Suspense fallback={null}>
          <DetailEditor width={width} />
        </Suspense>
      ) : type === TYPE.Group ? (
        <GroupEditor />
      ) : (
        <RuleEditor />
      )}
    </div>
  );
}
