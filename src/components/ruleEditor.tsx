import React from "react";
import { useFlag, useGlobalState } from "../utils/store";
import { Rule, TYPE } from "../utils/types";
import CompactEditor from "./compactEditor";

export default function RuleEditor() {
  const { selected, setEdit, setEditType } = useGlobalState();
  const { setIsSaved } = useFlag();

  const handleRuleChange = async (rule: Rule) => {
    setIsSaved(false);
    setEdit(rule);
    setEditType(TYPE.Rule);
  };

  return <CompactEditor rule={selected as Rule} onChange={handleRuleChange} />;
}
