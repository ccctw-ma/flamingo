import React from "react";
import { useFlag } from "../utils/store";
import { Rule, TYPE } from "../utils/types";
import CompactEditor from "./compactEditor";
import { noop } from "../utils";
import { useGlobalState } from "../utils/hooks";

export default function RuleEditor() {
  const { selected, setEdit, setEditType } = useGlobalState();
  const { setIsSaved } = useFlag();

  const handleRuleChange = async (rule: Rule) => {
    setIsSaved(false);
    setEdit(rule);
    setEditType(TYPE.Rule);
  };

  return (
    <CompactEditor
      rule={selected as Rule}
      onChange={handleRuleChange}
      handleError={noop}
    />
  );
}
