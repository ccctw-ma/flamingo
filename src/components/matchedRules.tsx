import { Table } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "../utils/i18n";
import { padZero } from "../utils";
import { useConfig, useGlobalState } from "../utils/hooks";

export default function MatchedRules() {
  const { rules } = useGlobalState();
  const { MATCHED_RULE_TIME_MINUTE_SPAN } = useConfig();
  const { t } = useI18n();
  const [rulesMatchedInfo, setRulesMatchedInfo] = useState<
    chrome.declarativeNetRequest.MatchedRuleInfo[]
  >([]);
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);

  const id2nameMap = useMemo(() => {
    const map: Record<number, string> = {};
    rules.forEach((rule) => (map[rule.id] = rule.name));
    return map;
  }, [rules]);

  const tabId2InfoMap = tabs.reduce<Record<number, chrome.tabs.Tab>>((pre, cur) => {
    pre[cur.id ?? chrome.tabs.TAB_ID_NONE] = cur;
    return pre;
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
        key: `${info.rule.ruleId}-${info.timeStamp}`,
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
      setTabs(allTabs);
      setRulesMatchedInfo(details.rulesMatchedInfo || []);
    })();
  }, [MATCHED_RULE_TIME_MINUTE_SPAN]);
  return (
    <div className="h-full w-full">
      <div className="data-panel">
        <Table
          className="w-full"
          scroll={{ y: "calc(100vh - 128px)" }}
          dataSource={ruleMatchedInfoContent}
          pagination={false}
          size="small"
          bordered
          title={() => (
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{t("recentMatchedRules")}</span>
              <span className="text-slate-400">
                {t("itemsCount", { count: ruleMatchedInfoContent.length })}
              </span>
            </div>
          )}
        columns={[
          {
            title: t("tab"),
            dataIndex: "tabTitle",
          },
          {
            title: t("tabUrl"),
            dataIndex: "tabUrl",
          },
          {
            title: t("rule"),
            dataIndex: "name",
          },
          {
            title: t("time"),
            dataIndex: "formateTime",
            defaultSortOrder: "descend",
            sorter: (a, b) => a.timeStamp - b.timeStamp,
          },
        ]}
        />
      </div>
    </div>
  );
}
