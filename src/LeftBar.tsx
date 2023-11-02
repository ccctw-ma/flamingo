import { Checkbox, Tabs, TabsProps } from "antd";
import * as React from "react";
import {
  HOME_HEIGHT,
  LEFT_TAB_BAR_HEIGHT,
  LEFT_TAB_ITEM_HEIGHT,
} from "./constants";
import {
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import GroupItem from "./components/GroupItem";
import { useState } from "react";
export default function LeftBar() {
  const items: TabsProps["items"] = [
    {
      key: "groups",
      label: "Group",
      children: <Group />,
    },
    {
      key: "item",
      label: "Item",
      children: "Content of Tab Pane 2",
    },
  ];
  return (
    <div className="w-full h-full overflow-hidden">
      <Tabs
        defaultActiveKey="1"
        items={items}
        onChange={(k) => {
          console.log(k);
        }}
        size="small"
        centered
        tabBarStyle={{ marginBottom: 0, height: LEFT_TAB_BAR_HEIGHT }}
        style={{ height: "100%" }}
      />
    </div>
  );
}

function Group() {
  const groups = new Array(30).fill(null).map((_, idx) => ({
    id: idx,
    label: "Hello worldHello worldHello world".substring(
      0,
      Math.max(33 * Math.random(), 2)
    ),
    children: [],
  }));

  return (
    <div
      style={{ height: `calc(100vh - ${LEFT_TAB_BAR_HEIGHT}px)` }}
      className="relative overflow-y-scroll no-scrollbar pb-4"
    >
      {groups.map((val) => (
        <GroupItem group={val} />
      ))}
    </div>
  );
}
