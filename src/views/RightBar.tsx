import * as React from "react";
import { useFlag } from "../utils/store";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import RuleEditor from "../components/ruleEditor";
import { Breadcrumb, Divider, Popover, Table } from "antd";
import {
  MATCHED_RULE_CONTENT_WIDTH,
  MATCHED_RULE_TIME_MINUTE_SPAN,
  RIGHT_HEADER_HEIGHT,
} from "../utils/constants";
import {
  ArrowsAltOutlined,
  FundOutlined,
  PoweroffOutlined,
  ShrinkOutlined,
} from "@ant-design/icons";
import { TYPE } from "../utils/types";
import GroupEditor from "../components/groupEditor";
import DetailEditor from "../components/detailEditor";
import { useConfig, useGlobalState } from "../utils/hooks";
import { padZero } from "../utils";

const RightBar = forwardRef((props: { width: number }, ref) => {
  const { type, selected, saveEdit, setEdit, setEditType } = useGlobalState();
  const { isDetail } = useConfig();
  const [containerWidth, setContainerWidth] = useState<number>(props.width);

  useImperativeHandle(ref, () => ({
    setContainerWidth,
  }));

  useEffect(() => {
    (async () => {
      await saveEdit();
      setEdit(selected);
      setEditType("rules" in selected ? TYPE.Group : TYPE.Rule);
    })();
  }, [selected.id]);

  useEffect(() => {
    saveEdit();
  }, [isDetail]);

  return (
    <div className="w-full h-full overflow-hidden">
      <ActionBar />
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

const ActionBar = () => {
  const { type, selected, saveEdit, groups, rules } = useGlobalState();
  const { isDetail, setIsDetail, isWorking, setIsWorking } = useConfig();
  const { isSaved } = useFlag();
  const [rulesMatchedInfo, setRulesMatchedInfo] = useState<
    chrome.declarativeNetRequest.MatchedRuleInfo[]
  >([]);

  const id2nameMap = useMemo(() => {
    const map: any = {};
    rules.forEach((rule) => (map[rule.id] = rule.name));
    groups.forEach((group) => group.rules.forEach((rule) => (map[rule.id] = group.name)));
    return map;
  }, [rules, groups]);

  const ruleMatchedInfoContent = useMemo(() => {
    const data = rulesMatchedInfo.map((info) => {
      const name = id2nameMap[info.rule.ruleId];
      const timeStamp = info.timeStamp;
      const date = new Date(timeStamp);
      const formateTime = `${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(
        date.getSeconds()
      )}`;
      return {
        name,
        timeStamp,
        formateTime,
      };
    });
    return (
      <div
        style={{ width: MATCHED_RULE_CONTENT_WIDTH }}
        className="flex justify-center items-center"
      >
        <Table
          className="w-full"
          columns={[
            {
              title: "name",
              dataIndex: "name",
            },
            {
              title: "time",
              dataIndex: "formateTime",
              defaultSortOrder: "descend",
              sorter: (a, b) => a.timeStamp - b.timeStamp,
            },
          ]}
          scroll={{ y: 300 }}
          dataSource={data}
          pagination={false}
          size="small"
          bordered
        />
      </div>
    );
  }, [rulesMatchedInfo]);
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

      <Popover
        placement="bottom"
        trigger="click"
        title={`matched rules within ${MATCHED_RULE_TIME_MINUTE_SPAN} minutes`}
        content={ruleMatchedInfoContent}
        onOpenChange={(visible) => {
          if (visible) {
            chrome.declarativeNetRequest.getMatchedRules(
              { minTimeStamp: Date.now() - MATCHED_RULE_TIME_MINUTE_SPAN * 60 * 1000 },
              (details) => {
                console.log(details);
                setRulesMatchedInfo(details.rulesMatchedInfo);
              }
            );
          }
        }}
      >
        <FundOutlined
          style={{ marginRight: "16px", fontSize: "16px", cursor: "pointer", color: "#1890ff" }}
        />
      </Popover>
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
        onClick={() => setIsWorking(isWorking ? false : true)}
      />
    </div>
  );
};

export default RightBar;
