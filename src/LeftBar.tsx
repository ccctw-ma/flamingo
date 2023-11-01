import { Tabs, TabsProps } from "antd";
import * as React from "react";
import { HOME_HEIGHT, LEFT_TAB_BAR_HEIGHT } from "./constants";

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
  return (
    <div style={{ height: HOME_HEIGHT - LEFT_TAB_BAR_HEIGHT }} className="overflow-y-scroll no-scrollbar">
      {new Array(100).fill(1).map((_) => {
        return <div>Hello world</div>;
      })}
    </div>
  );
}
