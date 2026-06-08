import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { CUSTOM_ACTION, EditableModifyHeaderInfo, Rule } from "../utils/types";
import { Select, Input, Button, Alert, Space, Checkbox, message } from "antd";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css";
import "monaco-editor/esm/vs/editor/contrib/folding/browser/folding";
import "monaco-editor/esm/vs/editor/contrib/format/browser/formatActions";
import "monaco-editor/esm/vs/language/json/monaco.contribution";
import {
  applyEdits,
  findNodeAtOffset,
  getNodePath,
  modify,
  parseTree,
  type Node as JsonNode,
} from "jsonc-parser";

import { CloseOutlined } from "@ant-design/icons";
import { useI18n } from "../utils/i18n";
import { useChange } from "../utils/hooks";

loader.config({ monaco });

interface Porps {
  rule: Rule;
  onChange: (newRule: Rule) => void;
}

const Cell: React.FC<{ label: string; children?: ReactNode }> = (props) => {
  return (
    <div className="editor-grid">
      <label className="field-label">{props.label}</label>
      <div className="min-w-0">{props.children}</div>
    </div>
  );
};

function formatJsonBody(body: string) {
  if (!body.trim()) {
    return "";
  }

  return JSON.stringify(JSON.parse(body), null, 2);
}

type JsonPath = Array<string | number>;

type JsonEditorFrame = {
  title: string;
  draft: string;
  pathInParent?: JsonPath;
};

const jsonFormattingOptions = {
  insertSpaces: true,
  tabSize: 2,
  eol: "\n",
};

function findPropertyNode(node: JsonNode | undefined): JsonNode | undefined {
  let current = node;
  while (current) {
    if (current.type === "property") {
      return current;
    }
    current = current.parent;
  }
  return undefined;
}

function getNestedJsonTarget(editor: monaco.editor.IStandaloneCodeEditor, draft: string) {
  const model = editor.getModel();
  const position = editor.getPosition();
  if (!model || !position) {
    return null;
  }

  const root = parseTree(draft);
  if (!root) {
    return null;
  }

  const offset = model.getOffsetAt(position);
  const propertyNode = findPropertyNode(findNodeAtOffset(root, offset, true));
  const [keyNode, valueNode] = propertyNode?.children ?? [];
  if (!keyNode || !valueNode || valueNode.type !== "string") {
    return null;
  }
  if (offset < keyNode.offset || offset > keyNode.offset + keyNode.length) {
    return null;
  }

  const value = String(valueNode.value ?? "");
  const parsedValue = JSON.parse(value) as unknown;
  return {
    title: String(keyNode.value ?? ""),
    path: getNodePath(valueNode),
    draft: JSON.stringify(parsedValue, null, 2),
  };
}

function applyNestedDraft(parentDraft: string, path: JsonPath, nestedDraft: string) {
  const nestedValue = JSON.parse(nestedDraft) as unknown;
  const nestedValueAsString = JSON.stringify(nestedValue);
  const edits = modify(parentDraft, path, nestedValueAsString, {
    formattingOptions: jsonFormattingOptions,
  });
  return formatJsonBody(applyEdits(parentDraft, edits));
}

const MockResponseEditor: React.FC<{
  body: string;
  onEdit: () => void;
  onChange: (body: string) => void;
}> = ({ body, onEdit, onChange }) => {
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [draft, setDraft] = useState(body);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setDraft(body);
    setHasError(false);
  }, [body]);

  const handleCommit = () => {
    if (draft === body) {
      return;
    }

    try {
      const formattedBody = formatJsonBody(draft);
      if (!formattedBody) {
        throw new Error("empty body");
      }
      setDraft(formattedBody);
      setHasError(false);
      onChange(formattedBody);
    } catch {
      setHasError(true);
      messageApi.error(t("mockResponseInvalidJson"));
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    try {
      if (!value.trim()) {
        throw new Error("empty body");
      }
      JSON.parse(value);
      setHasError(false);
      onChange(value);
    } catch {
      setHasError(Boolean(value.trim()));
    }
  };

  return (
    <>
      {contextHolder}
      <div className="flex flex-col gap-3">
        <Input.TextArea
          className="font-mono"
          status={hasError ? "error" : ""}
          value={draft}
          variant="filled"
          autoSize={{ minRows: 8, maxRows: 14 }}
          onChange={(event) => {
            handleDraftChange(event.target.value);
          }}
          onBlur={handleCommit}
          spellCheck={false}
          placeholder={t("mockResponseEmpty")}
        />
        <Button type="primary" onClick={onEdit}>
          {t("openDetailedEditor")}
        </Button>
      </div>
    </>
  );
};

const MockResponseJsonEditor: React.FC<{
  body: string;
  onCancel: () => void;
  onApply: (body: string) => void;
}> = ({ body, onCancel, onApply }) => {
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [frames, setFrames] = useState<JsonEditorFrame[]>(() => [
    {
      title: t("mockResponseRoot"),
      draft: (() => {
        try {
          return formatJsonBody(body);
        } catch {
          return body;
        }
      })(),
    },
  ]);
  const [error, setError] = useState("");
  const currentFrame = frames[frames.length - 1];
  const isNested = frames.length > 1;

  const updateCurrentDraft = (draft: string) => {
    setFrames((currentFrames) =>
      currentFrames.map((frame, index) =>
        index === currentFrames.length - 1 ? { ...frame, draft } : frame
      )
    );
  };

  const enterNestedFromEditor = useCallback(
    (targetEditor: monaco.editor.IStandaloneCodeEditor) => {
      try {
        const target = getNestedJsonTarget(targetEditor, currentFrame.draft);
        if (!target) {
          throw new Error("no nested target");
        }

        setFrames((currentFrames) => [
          ...currentFrames,
          {
            title: target.title,
            draft: target.draft,
            pathInParent: target.path,
          },
        ]);
        setError("");
      } catch {
        // Non-JSON-string fields keep the normal Monaco editing behavior.
      }
    },
    [currentFrame.draft]
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    const disposable = editor.onMouseDown((event) => {
      if (
        event.target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT ||
        !event.target.position
      ) {
        return;
      }
      editor.setPosition(event.target.position);
      window.setTimeout(() => enterNestedFromEditor(editor), 0);
    });

    return () => disposable.dispose();
  }, [editor, enterNestedFromEditor]);

  const handleApply = () => {
    try {
      const formattedBody = formatJsonBody(currentFrame.draft);
      if (!formattedBody) {
        throw new Error("empty body");
      }

      if (isNested) {
        const parentFrame = frames[frames.length - 2];
        if (!currentFrame.pathInParent) {
          throw new Error("missing parent path");
        }
        const nextParentDraft = applyNestedDraft(
          parentFrame.draft,
          currentFrame.pathInParent,
          formattedBody
        );
        setFrames((currentFrames) =>
          currentFrames
            .slice(0, -1)
            .map((frame, index) =>
              index === currentFrames.length - 2 ? { ...frame, draft: nextParentDraft } : frame
            )
        );
        setError("");
        messageApi.success(t("mockResponseNestedApplied"));
        return;
      }

      onApply(formattedBody);
      messageApi.success(t("mockResponseSaved"));
    } catch {
      const messageText = t("mockResponseInvalidJson");
      setError(messageText);
      messageApi.error(messageText);
    }
  };

  const handleBack = () => {
    if (!isNested) {
      return;
    }
    setFrames((currentFrames) => currentFrames.slice(0, -1));
    setError("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {contextHolder}
      <div className="flex flex-none items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            {isNested && (
              <Button size="small" onClick={handleBack}>
                {t("back")}
              </Button>
            )}
            <div className="truncate text-sm font-semibold text-slate-900">
              {frames.map((frame) => frame.title).join(" / ")}
            </div>
          </div>
        </div>
        <Space>
          <Button onClick={onCancel}>{t("cancel")}</Button>
          <Button type="primary" onClick={handleApply}>
            {isNested ? t("applyNestedJson") : t("applyJson")}
          </Button>
        </Space>
      </div>
      {error && (
        <div className="flex-none px-4 pt-3">
          <Alert type="error" showIcon message={error} />
        </div>
      )}
      <div className="min-h-0 flex-1 p-4">
        <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <Editor
            height="100%"
            language="json"
            theme="vs"
            path={`mock-response-${frames.length}-${currentFrame.title}.json`}
            value={currentFrame.draft}
            onMount={(mountedEditor) => setEditor(mountedEditor)}
            onChange={(value) => {
              updateCurrentDraft(value ?? "");
              if (error) {
                setError("");
              }
            }}
            options={{
              automaticLayout: true,
              bracketPairColorization: {
                enabled: true,
              },
              colorDecorators: true,
              fontSize: 13,
              lineHeight: 20,
              fontFamily:
                'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
              folding: true,
              foldingHighlight: true,
              foldingImportsByDefault: false,
              foldingStrategy: "indentation",
              glyphMargin: false,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 2,
              showFoldingControls: "always",
              padding: {
                top: 14,
                bottom: 14,
              },
              minimap: {
                enabled: true,
                side: "right",
                size: "proportional",
              },
              scrollBeyondLastLine: false,
              stickyScroll: {
                enabled: true,
              },
              suggestOnTriggerCharacters: true,
              tabSize: 2,
              formatOnPaste: true,
              formatOnType: true,
              wordWrap: "on",
            }}
          />
        </div>
      </div>
    </div>
  );
};

function normalizeHeaderInfo(header: EditableModifyHeaderInfo): EditableModifyHeaderInfo {
  return {
    ...header,
    enabled: header.enabled !== false,
  };
}

const ModifyHeader: React.FC<{
  headerInfos: EditableModifyHeaderInfo[];
  onChange: (headers: EditableModifyHeaderInfo[]) => void;
}> = ({ headerInfos, onChange }) => {
  const [headers, setHeaders] = useState(() => headerInfos.map(normalizeHeaderInfo));
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
    setHeaders(headerInfos.map(normalizeHeaderInfo));
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
        const isEnabled = header.enabled !== false;
        return (
          <div
            key={`header-row-${idx}`}
            className={`grid grid-cols-[22px_72px_minmax(0,1.15fr)_minmax(0,1fr)_24px] gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2 ${
              isEnabled ? "" : "opacity-60"
            }`}
          >
            <div className="flex items-center justify-center">
              <Checkbox
                checked={isEnabled}
                aria-label={t("toggleHeaderOperation")}
                onChange={(event) => {
                  const checked = event.target.checked;
                  const newHeaders = headers.map((item, index) =>
                    index === idx ? { ...item, enabled: checked } : item
                  );
                  wrapChange(setHeaders)(newHeaders);
                }}
              />
            </div>
            <div>
              <Select
                className="w-full"
                value={header.operation}
                options={operationOptions}
                disabled={!isEnabled}
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
                disabled={!isEnabled}
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
                  disabled={!isEnabled}
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
              enabled: true,
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

function getRedirectTarget(redirect?: chrome.declarativeNetRequest.Redirect) {
  return redirect?.extensionPath || redirect?.regexSubstitution || redirect?.url || "";
}

function buildRedirect(target: string): chrome.declarativeNetRequest.Redirect {
  if (target.startsWith("/")) {
    return { extensionPath: target };
  }

  return { regexSubstitution: target };
}

type EditorActionType = chrome.declarativeNetRequest.RuleActionType | CUSTOM_ACTION.MOCK;

function getEditorActionType(rule: Rule): EditorActionType {
  return rule.uiActionType || (rule.mockResponse?.enabled ? CUSTOM_ACTION.MOCK : rule.action.type);
}

function CompactEditor(props: Porps) {
  const { rule, onChange } = props;
  const { hasChange, setHasChange, wrapChange } = useChange();
  const { t } = useI18n();
  const [type, setType] = useState<EditorActionType>(
    chrome.declarativeNetRequest.RuleActionType.REDIRECT
  );
  const [regexFilter, setRegexFilter] = useState("");
  const [redirectTarget, setRedirectTarget] = useState("");
  const [mockResponseBody, setMockResponseBody] = useState("");
  const [isEditingMockResponse, setIsEditingMockResponse] = useState(false);

  const [requestHeaders, setRequestHeaders] = useState<
    EditableModifyHeaderInfo[]
  >([]);
  const [responseHeaders, setResponseHeaders] = useState<
    EditableModifyHeaderInfo[]
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
    if (type === CUSTOM_ACTION.MOCK) {
      newRule.action = {
        type: chrome.declarativeNetRequest.RuleActionType.BLOCK,
      };
      newRule.mockResponse = {
        enabled: true,
        body: mockResponseBody,
      };
      newRule.uiActionType = CUSTOM_ACTION.MOCK;
    } else if (type === chrome.declarativeNetRequest.RuleActionType.REDIRECT) {
      newRule.action = {
        type,
        redirect: buildRedirect(redirectTarget),
      };
      delete newRule.mockResponse;
      newRule.uiActionType = type;
    } else if (type === chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS) {
      newRule.action = {
        type,
        requestHeaders,
        responseHeaders,
      };
      if (requestHeaders.length === 0) delete newRule.action.requestHeaders;
      if (responseHeaders.length === 0) delete newRule.action.responseHeaders;
      delete newRule.mockResponse;
      newRule.uiActionType = type;
    } else {
      newRule.action = { type };
      delete newRule.mockResponse;
      newRule.uiActionType = type;
    }
    onChange(newRule);
    setHasChange(false);
  }, [
    hasChange,
    onChange,
    regexFilter,
    redirectTarget,
    mockResponseBody,
    requestHeaders,
    responseHeaders,
    rule,
    setHasChange,
    type,
  ]);

  useEffect(() => {
    const nextType = getEditorActionType(rule);
    setType(nextType);
    setRegexFilter(rule?.condition.regexFilter || "");
    setRedirectTarget(
      nextType === CUSTOM_ACTION.MOCK ? "" : getRedirectTarget(rule?.action?.redirect)
    );
    setMockResponseBody(rule?.mockResponse?.body || "");
    setRequestHeaders(rule?.action?.requestHeaders || []);
    setResponseHeaders(rule?.action?.responseHeaders || []);
    setIsEditingMockResponse(false);
  }, [rule]);

  const actionOptions = [
    {
      value: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      label: t("actionModifyHeaders"),
    },
    {
      value: CUSTOM_ACTION.MOCK,
      label: t("actionMock"),
    },
    {
      value: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      label: t("actionRedirect"),
    },
    {
      value: chrome.declarativeNetRequest.RuleActionType.BLOCK,
      label: t("actionBlock"),
    },
  ];

  if (type === CUSTOM_ACTION.MOCK && isEditingMockResponse) {
    return (
      <MockResponseJsonEditor
        body={mockResponseBody}
        onCancel={() => {
          setIsEditingMockResponse(false);
        }}
        onApply={(body) => {
          wrapChange(setMockResponseBody)(body);
          setIsEditingMockResponse(false);
        }}
      />
    );
  }

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
              status={redirectTarget ? "" : "error"}
              autoSize={{ minRows: 3 }}
              value={redirectTarget}
              variant="filled"
              onChange={(e) => wrapChange(setRedirectTarget)(e.target.value)}
              placeholder={t("redirectPlaceholder")}
            />
          </Cell>
        )}
        {type === CUSTOM_ACTION.MOCK && (
          <Cell label={t("mockResponse")}>
            <MockResponseEditor
              body={mockResponseBody}
              onEdit={() => {
                setIsEditingMockResponse(true);
              }}
              onChange={wrapChange(setMockResponseBody)}
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
    </div>
  );
}

export default React.memo(CompactEditor);
