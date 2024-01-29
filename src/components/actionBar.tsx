import {
  FundOutlined,
  ArrowsAltOutlined,
  ShrinkOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Divider } from "antd";
import React from "react";
import { useGlobalState, useConfig } from "../utils/hooks";
import { useFlag } from "../utils/store";

const ActionBar = () => {
  const { type, selected, saveEdit } = useGlobalState();
  const { DETAIL, WORKING, RIGHT_HEADER_HEIGHT, MATCH, MATCHED_RULE_TIME_MINUTE_SPAN, setConfig } =
    useConfig();
  const { isSaved } = useFlag();

  return (
    <div
      style={{
        height: RIGHT_HEADER_HEIGHT,
      }}
      className="flex justify-between items-center px-6"
    >
      <Breadcrumb
        separator="/"
        items={[
          {
            title: type,
          },
          {
            title: selected.name,
          },
        ]}
      />

      <Divider type="vertical" />
      <p
        className={`text-base ${isSaved ? "text-green-400" : "text-red-400"} cursor-pointer`}
        onClick={() => !isSaved && saveEdit()}
        title={!isSaved ? "save" : ""}
      >
        {isSaved ? "saved" : "unsaved"}
      </p>
      <div className="flex-1" />

      <FundOutlined
        style={{
          marginRight: "16px",
          fontSize: "16px",
          cursor: "pointer",
          color: MATCH ? "#1890ff" : "#000000",
        }}
        onClick={() => setConfig("MATCH", !MATCH)}
        title={`matched rules within ${MATCHED_RULE_TIME_MINUTE_SPAN} minutes`}
      />

      {DETAIL ? (
        <ArrowsAltOutlined
          style={{ marginRight: "16px", fontSize: "16px", cursor: "pointer" }}
          title="Detail Mode"
          onClick={() => setConfig("DETAIL", false)}
        />
      ) : (
        <ShrinkOutlined
          style={{ marginRight: "16px", fontSize: "16px", cursor: "pointer" }}
          title="Compact Mode"
          onClick={() => setConfig("DETAIL", true)}
        />
      )}
      <PoweroffOutlined
        className="transition-all"
        style={{ color: `${WORKING ? "red" : ""}`, fontSize: "16px" }}
        title={`${WORKING ? "Off" : "On"}`}
        onClick={() => setConfig("WORKING", WORKING ? false : true)}
      />
    </div>
  );
};

export default ActionBar;
