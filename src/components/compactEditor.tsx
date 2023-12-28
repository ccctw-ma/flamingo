import React, { ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { Rule } from "../utils/types";
import { Select, Divider, Input, Col, Row, Button } from "antd";

import { CloseOutlined } from "@ant-design/icons";
import { useChange } from "../utils/hooks";

interface Porps {
  rule: Rule;
  onChange: (newRule: Rule) => void;
  handleError: (err: any) => void;
}

const Cell: React.FC<{ label: string; children?: ReactNode }> = (props) => {
  return (
    <Row>
      <Col span={5} className="text-end">
        <label className="relative inline-flex items-center max-w-full h-[32px] text-center text-sm">
          {props.label}:
        </label>
      </Col>
      <Col span={16} offset={1}>
        {props.children}
      </Col>
    </Row>
  );
};

const ModifyHeader: React.FC<{
  headerInfos: chrome.declarativeNetRequest.ModifyHeaderInfo[];
  onChange: (args: any) => void;
}> = ({ headerInfos, onChange }) => {
  const [headers, setHeaders] = useState(headerInfos);
  const { hasChange, setHasChange, wrapChange } = useChange();

  if (hasChange) {
    onChange(headers);
    setHasChange(false);
  }

  useLayoutEffect(() => {
    setHeaders(headerInfos);
  }, [headerInfos]);

  return (
    <div className="flex flex-col gap-4 justify-between">
      {headers.map((header, idx) => {
        return (
          <Row justify="space-between">
            <Col span={7}>
              <Select
                style={{ width: "100%" }}
                defaultValue={chrome.declarativeNetRequest.HeaderOperation.SET}
                value={header.operation}
                options={[
                  {
                    value: chrome.declarativeNetRequest.HeaderOperation.SET,

                    label: chrome.declarativeNetRequest.HeaderOperation.SET,
                  },
                  {
                    value: chrome.declarativeNetRequest.HeaderOperation.APPEND,

                    label: chrome.declarativeNetRequest.HeaderOperation.APPEND,
                  },
                  {
                    value: chrome.declarativeNetRequest.HeaderOperation.REMOVE,

                    label: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
                  },
                ]}
                onChange={(val) => {
                  const newHeaders = [...headers];
                  newHeaders[idx].operation = val;
                  wrapChange(setHeaders)(newHeaders);
                }}
              />
            </Col>
            <Col
              span={
                header.operation === chrome.declarativeNetRequest.HeaderOperation.REMOVE ? 14 : 7
              }
            >
              <Input
                placeholder="header"
                value={header.header}
                onChange={(e) => {
                  const newHeaders = [...headers];
                  newHeaders[idx].header = e.target.value;
                  wrapChange(setHeaders)(newHeaders);
                }}
              />
            </Col>
            <Col
              span={
                header.operation === chrome.declarativeNetRequest.HeaderOperation.REMOVE ? 0 : 7
              }
            >
              <Input
                placeholder="value"
                value={header.value}
                onChange={(e) => {
                  const newHeaders = [...headers];
                  newHeaders[idx].value = e.target.value;
                  wrapChange(setHeaders)(newHeaders);
                }}
              />
            </Col>
            <Col span={1} className="self-center">
              <CloseOutlined
                onClick={() => {
                  const newHeaders = [...headers];
                  newHeaders.splice(idx, 1);
                  wrapChange(setHeaders)(newHeaders);
                }}
                title="delete this item"
              />
            </Col>
          </Row>
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
        + Add Header Operation Item
      </Button>
    </div>
  );
};

function CompactEditor(props: Porps) {
  const { rule, onChange, handleError } = props;
  const { hasChange, setHasChange, wrapChange } = useChange();
  const [type, setType] = useState(chrome.declarativeNetRequest.RuleActionType.REDIRECT);
  const [regexFilter, setRegexFilter] = useState("");
  const [regexSubstitution, setRegexSubstitution] = useState("");

  const [requestHeaders, setRequestHeaders] = useState<
    chrome.declarativeNetRequest.ModifyHeaderInfo[]
  >([]);
  const [responseHeaders, setResponseHeaders] = useState<
    chrome.declarativeNetRequest.ModifyHeaderInfo[]
  >([]);

  if (hasChange) {
    let newRule: Rule = { ...rule };
    newRule.condition.regexFilter = regexFilter;
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
    } else {
      newRule.action = { type };
    }
    onChange(newRule);
    setHasChange(false);
  }

  useLayoutEffect(() => {
    setType(rule?.action?.type);
    setRegexFilter(rule?.condition.regexFilter || "");
    setRegexSubstitution(rule?.action?.redirect?.regexSubstitution || "");
    setRequestHeaders(rule?.action?.requestHeaders || []);
    setResponseHeaders(rule?.action?.responseHeaders || []);
  }, [rule]);

  return (
    <div className="w-full mt-4 flex flex-col items-center text-base">
      <div style={{ width: "90%" }} className="flex flex-col gap-4 justify-between">
        <Cell label="ActionType">
          <Select
            style={{ width: "100%" }}
            value={type}
            options={[
              {
                value: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
                label: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
              },
              {
                value: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                label: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
              },
              {
                value: chrome.declarativeNetRequest.RuleActionType.BLOCK,
                label: chrome.declarativeNetRequest.RuleActionType.BLOCK,
              },
              {
                value: chrome.declarativeNetRequest.RuleActionType.ALLOW,
                label: chrome.declarativeNetRequest.RuleActionType.ALLOW,
                disabled: true,
              },
              {
                value: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                label: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                disabled: true,
              },
              {
                value: chrome.declarativeNetRequest.RuleActionType.ALLOW_ALL_REQUESTS,
                label: chrome.declarativeNetRequest.RuleActionType.ALLOW_ALL_REQUESTS,
                disabled: true,
              },
            ]}
            onChange={wrapChange(setType)}
          />
        </Cell>
        <Cell label="Condition">
          <Input.TextArea
            autoSize
            value={regexFilter}
            onChange={(e) => wrapChange(setRegexFilter)(e.target.value)}
          />
        </Cell>
        {type === chrome.declarativeNetRequest.RuleActionType.REDIRECT && (
          <Cell label="Redirect">
            <Input.TextArea
              autoSize
              value={regexSubstitution}
              onChange={(e) => wrapChange(setRegexSubstitution)(e.target.value)}
            />
          </Cell>
        )}
        {type === chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS && (
          <>
            <Cell label="requestHeaders">
              <ModifyHeader headerInfos={requestHeaders} onChange={wrapChange(setRequestHeaders)} />
            </Cell>
            <Cell label="responseHeaders">
              <ModifyHeader
                headerInfos={responseHeaders}
                onChange={wrapChange(setResponseHeaders)}
              />
            </Cell>
          </>
        )}
      </div>
      <Divider />
    </div>
  );
}
export default React.memo(CompactEditor);
