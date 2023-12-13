import React, { useEffect } from "react";
import { Rule } from "../utils/types";
import { Form, Select, Input } from "antd";
import { noop } from "../utils";
import { RULE_CONTAINER_HEIGHT } from "../utils/constants";
import { clearScreenDown } from "readline";
import { useFlag } from "../utils/store";

interface Porps {
  rule: Rule;
  onChange: (args: any) => void;
}
export default function CompactEditor(props: Porps) {
  const { rule, onChange } = props;
  const [form] = Form.useForm();
  const handleValueChange = (_: any, values: any) => {
    const newRule: Rule = {
      ...rule,
      action: {
        ...rule.action,
        type: values.type,
        redirect: {
          ...rule.action.redirect,
          regexSubstitution: values.regexSubstitution,
        },
      },
      condition: {
        ...rule.condition,
        regexFilter: values.regexFilter,
      },
      update: Date.now(),
    };
    onChange(newRule);
  };
  useEffect(() => {
    //TODO 处理不同类型的Rule
    form.setFieldValue("type", rule.action.type);
    form.setFieldValue("regexFilter", rule.condition.regexFilter);
    form.setFieldValue(
      "regexSubstitution",
      rule.action.redirect?.regexSubstitution
    );
  }, [rule]);

  return (
    <div
      className="w-full flex justify-around items-center mt-6"
      style={{ minHeight: RULE_CONTAINER_HEIGHT }}
    >
      <Form
        form={form}
        className="w-full"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        onValuesChange={handleValueChange}
      >
        <Form.Item label="Action Type" name="type">
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
        </Form.Item>
        <Form.Item label="Condition" name="regexFilter">
          <Input.TextArea autoSize />
        </Form.Item>
        <Form.Item label="Redirect" name="regexSubstitution">
          <Input.TextArea autoSize />
        </Form.Item>
      </Form>
    </div>
  );
}
