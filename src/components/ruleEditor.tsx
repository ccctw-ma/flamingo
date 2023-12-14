import React, { useEffect, useRef } from "react";
import { useFlag, useGroupsAndRules, useSelected } from "../utils/store";
import { Rule } from "../utils/types";
import CompactEditor from "./compactEditor";
import { updateRules } from "../utils/storage";

export default function RuleEditor() {
  const { selected } = useSelected();
  const currentRule = useRef<Rule>(selected as Rule);
  const { isSaved, setIsSaved } = useFlag();
  const { refresh } = useGroupsAndRules();
  const handleRuleChange = async (rule: Rule) => {
    setIsSaved(false);
    currentRule.current = rule;
  };
  const handleRuleSave = async () => {
    await updateRules(currentRule.current);
    await refresh();
  };

  useEffect(() => {
    isSaved && handleRuleSave();
  }, [isSaved]);

  return <CompactEditor rule={selected as Rule} onChange={handleRuleChange} />;
}
