import {
  Button,
  Checkbox,
  FloatButton,
  Input,
  Popover,
  Select,
  Space,
  Tabs,
  TabsProps,
  Tooltip,
} from "antd";
import * as React from "react";
import {
  HOME_HEIGHT,
  LEFT_TAB_ACTION_HEIGHT,
  LEFT_TAB_BAR_HEIGHT,
  LEFT_TAB_ITEM_HEIGHT,
} from "./constants";

import {
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  OrderedListOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  AppstoreAddOutlined,
  CloudSyncOutlined,
  CloudUploadOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import Item from "./components/item";
import { useState } from "react";
import { noop } from "./utils";
import { ACTION, TYPE } from "./types";

function Groups() {
  const groups = new Array(30).fill(null).map((_, idx) => ({
    id: idx,
    label: Math.random().toString(36).substring(2, 10),
    children: [],
  }));

  return (
    <div
      style={{
        height: `calc(100vh - ${LEFT_TAB_BAR_HEIGHT}px)`,
        paddingBottom: LEFT_TAB_ACTION_HEIGHT * 2,
      }}
      className="relative overflow-y-scroll no-scrollbar"
    >
      {groups.map((val) => (
        <Item group={val} />
      ))}
    </div>
  );
}

function Rules() {
  const groups = new Array(30).fill(null).map((_, idx) => ({
    id: idx,
    label: Math.random()
      .toString(36)
      .substring(2, Math.max(33 * Math.random(), 3)),
    children: [],
  }));

  return (
    <div
      style={{
        height: `calc(100vh - ${LEFT_TAB_BAR_HEIGHT}px)`,
        paddingBottom: LEFT_TAB_ACTION_HEIGHT * 2,
      }}
      className="relative overflow-y-scroll no-scrollbar pb-4"
    >
      {groups.map((val) => (
        <Item group={val} />
      ))}
    </div>
  );
}

const actions = {
  [ACTION.Add]: { label: "add", icon: <PlusCircleOutlined /> },
  [ACTION.Search]: {
    label: "search",
    icon: <SearchOutlined />,
  },
  [ACTION.OrderByName]: {
    label: "order by name",
    icon: <SortAscendingOutlined />,
  },
  [ACTION.OrderByCreateTime]: {
    label: "order by create",
    icon: <CloudUploadOutlined />,
  },
  [ACTION.OrderByUpdateTime]: {
    label: "order by update",
    icon: <CloudSyncOutlined />,
  },
};

function generatePlaceHolder(tab: TYPE, action: ACTION): string {
  if (action === ACTION.Add || action === ACTION.Search) {
    return `${actions[action].label} a ${tab.toLowerCase()}`;
  } else {
    return `${actions[action].label}`;
  }
}

export default function LeftBar() {
  const [tab, setTab] = useState<TYPE>(TYPE.Group);
  const [action, setAction] = useState<ACTION>(ACTION.Add);
  const placeHolder = generatePlaceHolder(tab, action);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Tabs
        defaultActiveKey="group"
        items={[
          {
            key: "group",
            label: "Group",
            children: <Groups />,
          },
          {
            key: "rule",
            label: "Rule",
            children: <Rules />,
          },
        ]}
        onChange={(v: any) => {
          setTab(v);
        }}
        size="small"
        centered
        tabBarStyle={{ marginBottom: 0, height: LEFT_TAB_BAR_HEIGHT }}
        style={{ height: "100%" }}
      />
      <div
        style={{ height: LEFT_TAB_ACTION_HEIGHT }}
        className="absolute flex items-center justify-center bottom-0 w-full bg-transparent px-6 gap-2"
      >
        <Input placeholder={placeHolder} onPressEnter={noop} />
        <Popover
          content={
            <div className="flex flex-col items-center">
              {Object.entries(actions).map(([key, { label, icon }]) => (
                // todo add bg-color for tooltip
                <Tooltip placement="right" title={label}>
                  <span
                    className="block cursor-pointer"
                    // Object key is string, but enum key is number so need str2num
                    onClick={() => setAction(+key)}
                  >
                    {icon}
                  </span>
                </Tooltip>
              ))}
            </div>
          }
        >
          <Button icon={actions[action].icon} />
        </Popover>
      </div>
    </div>
  );
}
