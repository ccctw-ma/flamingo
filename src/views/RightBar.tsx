import * as React from "react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import RuleEditor from "../components/ruleEditor";
import { Divider } from "antd";

import { TYPE } from "../utils/types";
import GroupEditor from "../components/groupEditor";
import DetailEditor from "../components/detailEditor";
import { useChange, useConfig, useGlobalState } from "../utils/hooks";
import ActionBar from "../components/actionBar";
import MatchedRules from "../components/matchedRules";

const RightBar = forwardRef((props: { width: number }, ref) => {
  const { type, selected, saveEdit, setEdit, setEditType, loaded } = useGlobalState();
  const { hasChange, setHasChange } = useChange();
  const { DETAIL, MATCH, setConfig } = useConfig();
  const [containerWidth, setContainerWidth] = useState<number>(props.width);

  useImperativeHandle(ref, () => ({
    setContainerWidth,
  }));

  useEffect(() => {
    (async () => {
      await saveEdit();
      setEdit(selected);
      setEditType("rules" in selected ? TYPE.Group : TYPE.Rule);
      hasChange && setConfig("MATCH", false);
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
        <DetailEditor width={containerWidth} />
      ) : type === TYPE.Group ? (
        <GroupEditor />
      ) : (
        <RuleEditor />
      )}
    </div>
  );
});

export default RightBar;
