import * as React from "react";
import { useFlag, useSelected } from "../utils/store";
import { forwardRef, useImperativeHandle, useState } from "react";
import RuleEditor from "../components/ruleEditor";
import { Breadcrumb, Divider } from "antd";
import { RIGHT_HEADER_HEIGHT } from "../utils/constants";
import {
  ArrowsAltOutlined,
  FileDoneOutlined,
  PoweroffOutlined,
  ShrinkOutlined,
} from "@ant-design/icons";
import { TYPE } from "../utils/types";
import GroupEditor from "../components/groupEditor";
import DetailEditor from "../components/detailEditor";

const RightBar = forwardRef((props: { width: number }, ref) => {
  const [containerWidth, setContainerWidth] = useState<number>(props.width);
  const { type, selected } = useSelected();
  const { isSaved, setIsSaved } = useFlag();
  const [isDetail, setIsDetail] = useState(false);
  const [isWorking, setIsWorking] = useState(true);

  useImperativeHandle(ref, () => ({
    setContainerWidth,
  }));

  return (
    <div className="w-full h-full overflow-hidden">
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
          className={`text-base ${isSaved ? "text-green-400" : "text-red-400"}`}
        >
          {isSaved ? "saved" : "not saved"}
        </p>
        <div className="flex-1" />
        <FileDoneOutlined
          style={{ marginRight: "16px", fontSize: "16px", cursor: "pointer" }}
          title="save"
          onClick={() => setIsSaved(true)}
        />
        {isDetail ? (
          <ArrowsAltOutlined
            style={{ marginRight: "16px", fontSize: "16px", cursor: "pointer" }}
            title="Detail Mode"
            onClick={() => setIsDetail(false)}
          />
        ) : (
          <ShrinkOutlined
            style={{ marginRight: "16px", fontSize: "16px", cursor: "pointer" }}
            title="Compact Mode"
            onClick={() => setIsDetail(true)}
          />
        )}
        <PoweroffOutlined
          className="transition-all"
          style={{ color: `${isWorking ? "red" : ""}`, fontSize: "16px" }}
          title={`${isWorking ? "Off" : "On"}`}
          onClick={() => setIsWorking((v) => !v)}
        />
      </div>
      <Divider style={{ marginTop: 0, marginBottom: 0 }} />
      {isDetail ? (
        <DetailEditor width={containerWidth} />
      ) : type === TYPE.Group ? (
        <GroupEditor />
      ) : (
        <RuleEditor />
      )}
    </div>
  );
});

export default RightBar;
