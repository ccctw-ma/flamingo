import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { Rule } from "../utils/types";
import { Select, Divider, Input, Button } from "antd";

import { CloseOutlined } from "@ant-design/icons";
import { useI18n } from "../utils/i18n";
import { useChange } from "../utils/hooks";

interface Porps {
  rule: Rule;
  onChange: (newRule: Rule) => void;
  handleError: (err: unknown) => void;
}

const Cell: React.FC<{ label: string; children?: ReactNode }> = (props) => {
  return (
    <div className="editor-grid">
      <label className="field-label">{props.label}</label>
      <div className="min-w-0">{props.children}</div>
    </div>
  );
};

const ModifyHeader: React.FC<{
  headerInfos: chrome.declarativeNetRequest.ModifyHeaderInfo[];
  onChange: (headers: chrome.declarativeNetRequest.ModifyHeaderInfo[]) => void;
}> = ({ headerInfos, onChange }) => {
  const [headers, setHeaders] = useState(headerInfos);
  const { hasChange, setHasChange, wrapChange } = useChange();
  const { t } = useI18n();

  useEffect(() => {
    if (!hasChange) {
      return;
    }
    onChange(headers);
    setHasChange(false);
  }, [hasChange, headers, onChange, setHasChange]);

  useEffect(() => {
    setHeaders(headerInfos);
  }, [headerInfos]);

  const operationOptions = useMemo(
    () => [
      {
        value: chrome.declarativeNetRequest.HeaderOperation.SET,
        label: t("headerOpSet"),
      },
      {
        value: chrome.declarativeNetRequest.HeaderOperation.APPEND,
        label: t("headerOpAppend"),
      },
      {
        value: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
        label: t("headerOpRemove"),
      },
    ],
    [t]
  );

  return (
    <div className="flex flex-col gap-3">
      {headers.map((header, idx) => {
        const isRemove = header.operation === chrome.declarativeNetRequest.HeaderOperation.REMOVE;
        return (
          <div
            key={`${header.header}-${idx}`}
            className="grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)_24px] gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2"
          >
            <div>
              <Select
                className="w-full"
                value={header.operation}
                options={operationOptions}
                onChange={(val) => {
                  const newHeaders = headers.map((item, index) =>
                    index === idx ? { ...item, operation: val } : item
                  );
                  wrapChange(setHeaders)(newHeaders);
                }}
              />
            </div>
            <div className={isRemove ? "col-span-2" : ""}>
              <Input
                placeholder="header"
                value={header.header}
                title={header.header}
                variant="filled"
                onChange={(e) => {
                  const newHeaders = headers.map((item, index) =>
                    index === idx ? { ...item, header: e.target.value } : item
                  );
                  wrapChange(setHeaders)(newHeaders);
                }}
              />
            </div>
            {!isRemove && (
              <div>
                <Input
                  placeholder="value"
                  value={header.value}
                  variant="filled"
                  onChange={(e) => {
                    const newHeaders = headers.map((item, index) =>
                      index === idx ? { ...item, value: e.target.value } : item
                    );
                    wrapChange(setHeaders)(newHeaders);
                  }}
                  title={header.value}
                />
              </div>
            )}
            <button
              type="button"
              className="mt-1 text-slate-400 transition-colors hover:text-red-500"
              onClick={() => {
                const newHeaders = [...headers];
                newHeaders.splice(idx, 1);
                wrapChange(setHeaders)(newHeaders);
              }}
              title={t("deleteThisItem")}
            >
              <CloseOutlined />
            </button>
          </div>
        );
      })}
      <Button
        onClick={() => {
          wrapChange(setHeaders)([
            ...headers,
            {
              header: "",
              value: "",
              operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            },
          ]);
        }}
        block
      >
        {t("addHeaderOperation")}
      </Button>
    </div>
  );
};

function CompactEditor(props: Porps) {
  const { rule, onChange } = props;
  const { hasChange, setHasChange, wrapChange } = useChange();
  const { t } = useI18n();
  const [type, setType] = useState(chrome.declarativeNetRequest.RuleActionType.REDIRECT);
  const [regexFilter, setRegexFilter] = useState("");
  const [regexSubstitution, setRegexSubstitution] = useState("");

  const [requestHeaders, setRequestHeaders] = useState<
    chrome.declarativeNetRequest.ModifyHeaderInfo[]
  >([]);
  const [responseHeaders, setResponseHeaders] = useState<
    chrome.declarativeNetRequest.ModifyHeaderInfo[]
  >([]);

  useEffect(() => {
    if (!hasChange) {
      return;
    }
    const newRule: Rule = { ...rule };
    newRule.condition = {
      ...newRule.condition,
      regexFilter,
    };
    newRule.update = Date.now();
    if (type === chrome.declarativeNetRequest.RuleActionType.REDIRECT) {
      newRule.action = {
        type,
        redirect: {
          ...rule.action.redirect,
          regexSubstitution,
        },
      };
    } else if (type === chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS) {
      newRule.action = {
        type,
        requestHeaders,
        responseHeaders,
      };
      if (requestHeaders.length === 0) delete newRule.action.requestHeaders;
      if (responseHeaders.length === 0) delete newRule.action.responseHeaders;
    } else {
      newRule.action = { type };
    }
    onChange(newRule);
    setHasChange(false);
  }, [
    hasChange,
    onChange,
    regexFilter,
    regexSubstitution,
    requestHeaders,
    responseHeaders,
    rule,
    setHasChange,
    type,
  ]);

  useEffect(() => {
    setType(rule?.action?.type);
    setRegexFilter(rule?.condition.regexFilter || "");
    setRegexSubstitution(rule?.action?.redirect?.regexSubstitution || "");
    setRequestHeaders(rule?.action?.requestHeaders || []);
    setResponseHeaders(rule?.action?.responseHeaders || []);
  }, [rule]);

  const actionOptions = [
    {
      value: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      label: t("actionRedirect"),
    },
    {
      value: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      label: t("actionModifyHeaders"),
    },
    {
      value: chrome.declarativeNetRequest.RuleActionType.BLOCK,
      label: t("actionBlock"),
    },
  ];

  return (
    <div className="editor-card">
      <div className="editor-stack">
        <Cell label={t("actionType")}>
          <Select
            className="w-full"
            value={type}
            options={actionOptions}
            onChange={wrapChange(setType)}
          />
        </Cell>
        <Cell label={t("condition")}>
          <Input.TextArea
            autoSize={{ minRows: 3 }}
            status={regexFilter ? "" : "error"}
            value={regexFilter}
            variant="filled"
            onChange={(e) => {
              const value = e.target.value;
              chrome.declarativeNetRequest.isRegexSupported({ regex: value }, (res) => {
                if (!res.isSupported) {
                  console.error(res.reason);
                }
              });

              wrapChange(setRegexFilter)(e.target.value);
            }}
            required
          />
        </Cell>
        {type === chrome.declarativeNetRequest.RuleActionType.REDIRECT && (
          <Cell label={t("redirect")}>
            <Input.TextArea
              status={regexSubstitution ? "" : "error"}
              autoSize={{ minRows: 3 }}
              value={regexSubstitution}
              variant="filled"
              onChange={(e) => wrapChange(setRegexSubstitution)(e.target.value)}
            />
          </Cell>
        )}
        {type === chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS && (
          <>
            <Cell label={t("requestHeaders")}>
              <ModifyHeader headerInfos={requestHeaders} onChange={wrapChange(setRequestHeaders)} />
            </Cell>
            <Cell label={t("responseHeaders")}>
              <ModifyHeader
                headerInfos={responseHeaders}
                onChange={wrapChange(setResponseHeaders)}
              />
            </Cell>
          </>
        )}
      </div>
      <Divider style={{ margin: "14px 0 0" }} />
    </div>
  );
}

export default React.memo(CompactEditor);
