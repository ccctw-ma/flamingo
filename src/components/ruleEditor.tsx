import { Tag, Input, Switch, Select, Breadcrumb, Form } from "antd";
import React, { useRef, useState } from "react";
import { RULE_CONTAINER_HEIGHT } from "../utils/constants";
import { useGroupsAndRules, useSelected } from "../utils/store";
import { Rule } from "../utils/types";
import { noop } from "../utils";
import CompactEditor from "./compactEditor";
import { updateRules } from "../utils/storage";

export default function RuleEditor() {
  const { selected, setSelected } = useSelected();

  const { refresh } = useGroupsAndRules();
  const handleRuleChange = async (rule: Rule) => {
    await updateRules(rule);
    await refresh();
    setSelected(rule);
  };
  return (
    <div>
      <CompactEditor rule={selected as Rule} onChange={handleRuleChange} />
    </div>
  );
}
