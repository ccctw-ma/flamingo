import React, { ReactNode } from "react";
import { Rule } from "../utils/types";
import { Select, Divider, Input, Col, Row } from "antd";

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

export default function CompactEditor(props: Porps) {
  const { rule, onChange, handleError } = props;

  return (
    <div className="w-full mt-4 flex flex-col items-center text-base">
      <div
        style={{ width: "90%" }}
        className="flex flex-col gap-4 justify-between "
      >
        <Cell label="ActionType">
          <Select
            defaultValue={chrome.declarativeNetRequest.RuleActionType.REDIRECT}
            options={[
              {
                value: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
                label: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
              },
              {
                value:
                  chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                label:
                  chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
              },
              {
                value: chrome.declarativeNetRequest.RuleActionType.BLOCK,
                label: chrome.declarativeNetRequest.RuleActionType.BLOCK,
              },
            ]}
          />
        </Cell>
        <Cell label="Condition">
          <Input />
        </Cell>
        <Cell label="Redirect">
          <Input />
        </Cell>
      </div>
      <Divider />
    </div>
  );
}
