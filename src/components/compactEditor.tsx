import React, { useEffect } from "react";
import { Rule } from "../utils/types";
import { Form, Select, Input, Divider, Button, Space } from "antd";
import { CloseOutlined } from "@ant-design/icons";

interface Porps {
  rule: Rule;
  onChange: (newRule: Rule) => void;
}
export default function CompactEditor(props: Porps) {
  const { rule, onChange } = props;
  const [form] = Form.useForm();
  const selectedType = Form.useWatch((v) => v.type, form);

  const handleValueChange = (_: any, values: any) => {
    console.log(values);
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
    if (rule) {
      form.setFieldValue("type", rule?.action.type);
      form.setFieldValue("regexFilter", rule?.condition.regexFilter);
      form.setFieldValue(
        "regexSubstitution",
        rule?.action.redirect?.regexSubstitution
      );
    }
  }, [rule]);

  return (
    <div className="w-full flex flex-col justify-around items-center mt-4">
      <Form
        form={form}
        className="w-full"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        onValuesChange={handleValueChange}
      >
        <Form.Item label="ActionType" name="type">
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
        {selectedType ===
          chrome.declarativeNetRequest.RuleActionType.REDIRECT && (
          <Form.Item label="Redirect" name="regexSubstitution">
            <Input.TextArea autoSize />
          </Form.Item>
        )}

        {selectedType ===
          chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS && (
          <>
            <Form.Item label="Request">
              <Form.List name={"requestHeaders"}>
                {(subFields, subOpt) => (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      rowGap: 16,
                    }}
                  >
                    {subFields.map((subField) => (
                      <Space key={subField.key}>
                        <Form.Item noStyle name={[subField.name, "operation"]}>
                          <Select
                            style={{ minWidth: 80 }}
                            defaultValue={
                              chrome.declarativeNetRequest.HeaderOperation.SET
                            }
                            options={[
                              {
                                value:
                                  chrome.declarativeNetRequest.HeaderOperation
                                    .SET,

                                label:
                                  chrome.declarativeNetRequest.HeaderOperation
                                    .SET,
                              },
                              {
                                value:
                                  chrome.declarativeNetRequest.HeaderOperation
                                    .APPEND,

                                label:
                                  chrome.declarativeNetRequest.HeaderOperation
                                    .APPEND,
                              },
                              {
                                value:
                                  chrome.declarativeNetRequest.HeaderOperation
                                    .REMOVE,

                                label:
                                  chrome.declarativeNetRequest.HeaderOperation
                                    .REMOVE,
                              },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item noStyle name={[subField.name, "header"]}>
                          <Input placeholder="header" />
                        </Form.Item>
                        <Form.Item noStyle name={[subField.name, "value"]}>
                          <Input placeholder="value" />
                        </Form.Item>
                        <CloseOutlined
                          onClick={() => {
                            subOpt.remove(subField.name);
                          }}
                        />
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => subOpt.add()} block>
                      + Add Header Operation Item
                    </Button>
                  </div>
                )}
              </Form.List>
            </Form.Item>
            <Form.Item label="Response">
              <Form.List name={"responseHeaders"}>
                {(subFields, subOpt) => (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      rowGap: 16,
                    }}
                  >
                    {subFields.map((subField) => (
                      <Space key={subField.key}>
                        <Form.Item noStyle name={[subField.name, "operation"]}>
                          <Select
                            style={{ minWidth: 80 }}
                            defaultValue={
                              chrome.declarativeNetRequest.HeaderOperation.SET
                            }
                            options={[
                              {
                                value:
                                  chrome.declarativeNetRequest.HeaderOperation
                                    .SET,

                                label:
                                  chrome.declarativeNetRequest.HeaderOperation
                                    .SET,
                              },
                              {
                                value:
                                  chrome.declarativeNetRequest.HeaderOperation
                                    .APPEND,

                                label:
                                  chrome.declarativeNetRequest.HeaderOperation
                                    .APPEND,
                              },
                              {
                                value:
                                  chrome.declarativeNetRequest.HeaderOperation
                                    .REMOVE,

                                label:
                                  chrome.declarativeNetRequest.HeaderOperation
                                    .REMOVE,
                              },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item noStyle name={[subField.name, "header"]}>
                          <Input placeholder="header" />
                        </Form.Item>
                        <Form.Item noStyle name={[subField.name, "value"]}>
                          <Input placeholder="value" />
                        </Form.Item>
                        <CloseOutlined
                          onClick={() => {
                            subOpt.remove(subField.name);
                          }}
                        />
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => subOpt.add()} block>
                      + Add Header Operation Item
                    </Button>
                  </div>
                )}
              </Form.List>
            </Form.Item>
          </>
        )}
      </Form>

      <Divider style={{ margin: 0 }} />
    </div>
  );
}
