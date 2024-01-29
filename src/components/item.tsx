import { Checkbox, Popconfirm } from "antd";
import React, { useEffect, useState } from "react";
import { CROS_RULE, DEMO_GROUP, DEMO_RULE } from "../utils/constants";
import { EditOutlined, DeleteOutlined, CheckOutlined } from "@ant-design/icons";
import Input from "antd/es/input/Input";
import { Group, Rule, TYPE } from "../utils/types";
import {
  deleteGroup,
  deleteRule,
  setLocalSelected,
  updateGroups,
  updateRules,
} from "../utils/storage";
import { useConfig, useGlobalState } from "../utils/hooks";

interface Props {
  item: Group | Rule;
  type: TYPE;
}

export default function Item(props: Props) {
  const { item: current, type: curType } = props;
  const { type, selected, setType, setSelected, groups, rules, refresh, saveEdit } =
    useGlobalState();
  const { LEFT_TAB_ITEM_HEIGHT } = useConfig();
  // item built-in states
  const [isEdit, setIsEdit] = useState(false);
  const [name, setName] = useState(current.name);
  const [checked, setChecked] = useState(current.enable);

  const deleteItem = async (item: Group | Rule) => {
    await saveEdit();
    if (curType === TYPE.Group) {
      await deleteGroup(item as Group);
      await setLocalSelected(curType, groups.find((g) => g.id === DEMO_GROUP.id)!);
    } else {
      await deleteRule(item as Rule);
      await setLocalSelected(curType, rules.find((r) => r.id === DEMO_RULE.id)!);
    }
    refresh();
  };

  const updateItem = async (item: Group | Rule) => {
    await saveEdit();
    if (curType === TYPE.Group) {
      await updateGroups({ ...item, update: Date.now() } as Group);
    } else {
      await updateRules({ ...item, update: Date.now() } as Rule);
    }
    refresh();
  };

  const isDemo = (item: Group | Rule) => {
    return item.id === DEMO_GROUP.id || item.id === DEMO_RULE.id || item.id === CROS_RULE.id;
  };

  useEffect(() => {
    if (selected.id === current.id) {
      setName(selected.name);
      setChecked(selected.enable);
    } else {
      setIsEdit(false);
    }
  }, [selected]);

  return (
    <div
      style={{ width: "100%", height: LEFT_TAB_ITEM_HEIGHT }}
      className={`border-solid border-b-2 border-b-slate-200 flex justify-between items-center px-2 ${
        selected.id === current.id && curType === type && "bg-slate-200"
      }`}
      onClick={() => {
        setLocalSelected(curType, current);
        setType(curType);
        setSelected(current);
      }}
    >
      <Checkbox
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
          updateItem({ ...current, enable: e.target.checked });
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />
      {isEdit ? (
        <Input
          value={name}
          style={{
            flex: "1 1 0%",
            marginLeft: "0.5rem",
            marginRight: "0.5rem",
            borderColor: "#243c5a",
          }}
          onChange={(e) => {
            setName(e.target.value);
          }}
          onPressEnter={() => {
            setName(name);
            updateItem({ ...current, name });
            setIsEdit(false);
          }}
        />
      ) : (
        <span className="flex-1 inline-block ml-[17px] mr-[6px] text-clip overflow-clip whitespace-nowrap">
          {name}
        </span>
      )}
      {isEdit ? (
        <div className={`flex justify-between transition-all space-x-2 `}>
          <CheckOutlined
            onClick={() => {
              updateItem({ ...current, name });
              setIsEdit(false);
            }}
          />
        </div>
      ) : (
        <div
          className={`flex justify-between transition-all space-x-2 ${
            selected.id === current.id ? "opacity-100" : "opacity-0"
          }`}
        >
          {!isDemo(current) && <EditOutlined onClick={() => setIsEdit(true)} />}

          {!isDemo(current) && (
            <Popconfirm
              title={`Delete the ${curType}`}
              description={`Are you sure to delete this ${curType.toLocaleLowerCase()}?`}
              onConfirm={() => {
                deleteItem(current);
              }}
              okText="Yes"
              cancelText="No"
            >
              <DeleteOutlined />
            </Popconfirm>
          )}
        </div>
      )}
    </div>
  );
}
