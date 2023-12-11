import { Tag, Input, Switch, Select, Breadcrumb, Form } from "antd";
import React, { useRef, useState } from "react";
import { RULE_CONTAINER_HEIGHT } from "../utils/constants";
import MonacoEditor, { monaco } from "react-monaco-editor";
import { useSelected } from "../utils/store";
import { Rule } from "../utils/types";
import { noop } from "../utils";

interface Props {
  containerWidth: number;
}
export default function RuleEditor(props: Props) {
  const { type, selected } = useSelected();

  return (
    <div
      className="w-full flex justify-around items-center"
      style={{ minHeight: 400 }}
    >
      <Form className="w-full" labelCol={{ span: 4 }} wrapperCol={{ span: 14 }}>
        <Form.Item label="Action Type" name="disabled" valuePropName="checked">
          <Select
            defaultValue={chrome.declarativeNetRequest.RuleActionType.REDIRECT}
            onChange={noop}
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
        </Form.Item>
        <Form.Item label="Condition" name="condition">
          <Input value={(selected as Rule).condition?.regexFilter} />
        </Form.Item>
        <Form.Item label="Redirect" name="redirect">
          <Input
            value={(selected as Rule).action?.redirect?.regexSubstitution}
          />
        </Form.Item>
      </Form>
    </div>
  );
}
