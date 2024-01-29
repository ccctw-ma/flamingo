import { Table } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { padZero } from "../utils";
import { useConfig, useGlobalState } from "../utils/hooks";

export default function MatchedRules() {
  const { rules, groups } = useGlobalState();
  const { MATCHED_RULE_TIME_MINUTE_SPAN, RIGHT_HEADER_HEIGHT } = useConfig();
  const [rulesMatchedInfo, setRulesMatchedInfo] = useState<
    chrome.declarativeNetRequest.MatchedRuleInfo[]
  >([]);
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);

  const id2nameMap = useMemo(() => {
    const map: any = {};
    rules.forEach((rule) => (map[rule.id] = rule.name));
    groups.forEach((group) => group.rules.forEach((rule) => (map[rule.id] = group.name)));
    return map;
  }, [rules, groups]);

  const tabId2InfoMap: any = tabs.reduce((pre, cur) => {
    return {
      ...pre,
      [cur.id || chrome.tabs.TAB_ID_NONE]: cur,
    };
  }, {});

  const ruleMatchedInfoContent = rulesMatchedInfo.map((info) => {
    const name = id2nameMap[info.rule.ruleId];
    const tabInfo: chrome.tabs.Tab | undefined = tabId2InfoMap[info.tabId];
    const timeStamp = info.timeStamp;
    const date = new Date(timeStamp);
    const formateTime = `${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(
      date.getSeconds()
    )}`;
    const tabTitle = tabInfo?.title || "";
    const tabUrl = tabInfo?.url || "";

    return {
      name,
      timeStamp,
      formateTime,
      tabTitle,
      tabUrl,
    };
  });

  useEffect(() => {
    (async () => {
      const allTabs = await chrome.tabs.query({});
      const details = await chrome.declarativeNetRequest.getMatchedRules({
        minTimeStamp: Date.now() - MATCHED_RULE_TIME_MINUTE_SPAN * 60 * 1000,
      });
      console.log(allTabs, details);
      setTabs(allTabs);
      setRulesMatchedInfo(details.rulesMatchedInfo || []);
    })();
  }, []);
  return (
    <div className="w-full flex justify-center items-center">
      <Table
        style={{ height: `calc(100vh - ${RIGHT_HEADER_HEIGHT + 1}px)` }}
        className="w-full h-full"
        columns={[
          {
            title: "tab",
            dataIndex: "tabTitle",
          },
          {
            title: "tabUrl",
            dataIndex: "tabUrl",
          },
          {
            title: "rule",
            dataIndex: "name",
          },
          {
            title: "time",
            dataIndex: "formateTime",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.timeStamp - b.timeStamp,
          },
        ]}
        scroll={{ y: `calc(100vh - ${RIGHT_HEADER_HEIGHT * 2 + 1}px)` }}
        dataSource={ruleMatchedInfoContent}
        pagination={false}
        size="small"
        bordered
      />
    </div>
  );
}
