import React, { useState } from "react";
import { useFlag } from "../utils/store";
import { Group, Rule, TYPE } from "../utils/types";
import CompactEditor from "./compactEditor";
import { generateId, noop } from "../utils";
import {
  DeleteOutlined,
  ExportOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Select, message } from "antd";
import { DEMO_RULE, RIGHT_HEADER_HEIGHT } from "../utils/constants";
import { addRule } from "../utils/storage";
import { useGlobalState } from "../utils/hooks";

export default function GroupEditor() {
  const { selected, rules, setEdit, setEditType, saveEdit, edit } =
    useGlobalState();
  const { setIsSaved } = useFlag();
  const [ruleAddId, setRuleAddId] = useState<number>(DEMO_RULE.id);
  const [messageApi, contextHolder] = message.useMessage();

  const handleGroupChange = (newRule: Rule) => {
    setIsSaved(false);
    setEditType(TYPE.Group);
    const newGroup: Group = {
      ...selected,
      update: Date.now(),
      rules: (edit as Group).rules.map((r) => {
        if (r.id === newRule.id) {
          return {
            ...r,
            ...newRule,
          };
        } else {
          return r;
        }
      }),
    };
    setEdit(newGroup);
  };

  const handleGroupAddRule = () => {
    const addRule = rules.find((rule) => rule.id === ruleAddId)!;
    const newGroup = {
      ...(edit as Group),
      update: Date.now(),
      rules: [
        ...(edit as Group).rules,
        {
          ...addRule,
          name: "",
          id: generateId(),
        },
      ],
    };
    saveEdit(newGroup);
  };

  const handleGroupDeleteRule = (ruleId: number) => {
    const newGroup = {
      ...(edit as Group),
      update: Date.now(),
      rules: (edit as Group).rules.filter((rule) => rule.id !== ruleId),
    };
    saveEdit(newGroup);
  };

  const handleExportRule = async (ruleId: number) => {
    try {
      const rule = (edit as Group).rules.find((rule) => rule.id === ruleId)!;
      const exportRule: Rule = {
        ...rule,
        id: generateId(),
        name: `rule from ${edit.name}`,
        update: Date.now(),
      };
      await addRule(exportRule);
      await saveEdit(edit);
      messageApi.open({
        type: "success",
        content: "export successful",
      });
    } catch {
      messageApi.open({
        type: "error",
        content: "export failed",
      });
    }
  };

  return (
    <div
      style={{ height: `calc(100% - ${RIGHT_HEADER_HEIGHT + 1}px)` }}
      className="w-full flex flex-col overflow-y-scroll no-scrollbar pb-10"
    >
      {contextHolder}
      {(selected as Group).rules.map((rule) => (
        <div className="group w-full flex" key={rule.id}>
          <CompactEditor
            rule={rule}
            onChange={handleGroupChange}
            handleError={noop}
          />
          <div className="w-8 mt-4 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
            <ExportOutlined
              style={{ fontSize: "14px", cursor: "pointer" }}
              title="export"
              onClick={() => handleExportRule(rule.id)}
            />
            <DeleteOutlined
              style={{ fontSize: "14px", cursor: "pointer" }}
              title="delete"
              onClick={() => handleGroupDeleteRule(rule.id)}
            />
          </div>
        </div>
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
