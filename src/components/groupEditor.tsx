import React, { useEffect, useRef, useState } from "react";
import { useFlag, useGroupsAndRules, useSelected } from "../utils/store";
import { Group, Rule } from "../utils/types";
import CompactEditor from "./compactEditor";
import { getLocalGroups, updateGroups, updateRules } from "../utils/storage";
import { noop } from "../utils";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Select } from "antd";
import { DEMO_RULE, RIGHT_HEADER_HEIGHT } from "../utils/constants";
import { calc } from "antd/es/theme/internal";

export default function GroupEditor() {
  const { groups, selected, rules, refresh } = useGroupsAndRules();
  const { isSaved, setIsSaved } = useFlag();
  const currentGroup = useRef<Group>(selected as Group);
  const [ruleAddId, setRuleAddId] = useState<number>(DEMO_RULE.id);

  const handleGroupChange = (group: Group) => {
    setIsSaved(false);
    currentGroup.current = group;
  };
  const handleGroupSave = async () => {
    await updateGroups(currentGroup.current);
    await refresh();
  };
  const handleGroupAddRule = async () => {
    const addRule = rules.find((rule) => rule.id === ruleAddId)!;
    const newGroup = {
      ...currentGroup.current,
      update: Date.now(),
      rules: [...currentGroup.current.rules, addRule],
    };
    currentGroup.current = newGroup;
    await handleGroupSave();
  };

  useEffect(() => {
    isSaved && handleGroupSave();
  }, [isSaved]);

  return (
    <div
      style={{ height: `calc(100% - ${RIGHT_HEADER_HEIGHT + 1}px)` }}
      className="w-full flex flex-col overflow-y-scroll no-scrollbar pb-10"
    >
      {(selected as Group).rules.map((rule) => (
        <CompactEditor rule={rule} onChange={noop} />
      ))}
      <div className="w-full flex mt-4 items-center justify-center gap-4">
        <Select
          style={{ minWidth: 150 }}
          value={ruleAddId}
          options={rules.map((r) => ({ value: r.id, label: r.name }))}
          onSelect={(value) => setRuleAddId(value)}
        />
        <Button
          shape="circle"
          onClick={handleGroupAddRule}
          icon={<PlusOutlined />}
          title="add a rule"
        ></Button>
      </div>
    </div>
  );
}
