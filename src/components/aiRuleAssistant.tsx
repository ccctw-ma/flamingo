import { Alert, Button, Drawer, Input, Segmented, Select, Space, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { getAISettings } from "../ai/runtime";
import { runRuleDraftWorkflow } from "../ai/workflows/ruleDraft";
import { RuleDraftWorkflowEvent, RuleDraftWorkflowResult } from "../ai/types";
import { useI18n } from "../utils/i18n";
import { Rule } from "../utils/types";
import { generateId } from "../utils";

interface AIRuleAssistantProps {
  open: boolean;
  rules: Rule[];
  selectedRule?: Rule | null;
  onClose: () => void;
  onApply: (rules: Rule[], options?: { replaceIds?: number[] }) => void | Promise<void>;
}

type AIAssistantMode = "create" | "editRule" | "editGroup";

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function renderIssues(result: RuleDraftWorkflowResult | null) {
  if (!result || result.ok) {
    return null;
  }

  return (
    <ul className="m-0 list-disc pl-5 text-xs leading-5 text-red-700">
      {result.issues.map((issue) => (
        <li key={`${issue.path}:${issue.message}`}>
          <span className="font-mono">{issue.path}</span>: {issue.message}
        </li>
      ))}
    </ul>
  );
}

function makeRuleSnapshot(rule: Rule) {
  return {
    id: rule.id,
    name: rule.name,
    groupId: rule.groupId,
    groupName: rule.groupName,
    enable: rule.enable,
    action: rule.action,
    condition: rule.condition,
    mockResponse: rule.mockResponse,
    uiActionType: rule.uiActionType,
  };
}

function buildLineDiff(before: string, after: string) {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const maxLength = Math.max(beforeLines.length, afterLines.length);
  const lines: Array<{ type: "same" | "add" | "remove"; text: string }> = [];

  for (let index = 0; index < maxLength; index += 1) {
    const beforeLine = beforeLines[index];
    const afterLine = afterLines[index];
    if (beforeLine === afterLine) {
      if (beforeLine !== undefined) {
        lines.push({ type: "same", text: `  ${beforeLine}` });
      }
      continue;
    }
    if (beforeLine !== undefined) {
      lines.push({ type: "remove", text: `- ${beforeLine}` });
    }
    if (afterLine !== undefined) {
      lines.push({ type: "add", text: `+ ${afterLine}` });
    }
  }

  return lines;
}

export default function AIRuleAssistant({
  open,
  rules,
  selectedRule,
  onClose,
  onApply,
}: AIRuleAssistantProps) {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RuleDraftWorkflowResult | null>(null);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<RuleDraftWorkflowEvent[]>([]);
  const [mode, setMode] = useState<AIAssistantMode>("create");
  const [editRuleId, setEditRuleId] = useState<number | null>(null);
  const [editGroupId, setEditGroupId] = useState<number | null>(null);
  const canApply = Boolean(result?.ok);
  const ruleOptions = useMemo(
    () =>
      rules.map((rule) => ({
        label: rule.groupId
          ? `${rule.groupName || t("ruleGroup")} / ${rule.name || t("untitled")}`
          : rule.name || t("untitled"),
        value: rule.id,
      })),
    [rules, t]
  );
  const groupOptions = useMemo(() => {
    const groups = new Map<number, string>();
    for (const rule of rules) {
      if (typeof rule.groupId === "number") {
        groups.set(rule.groupId, rule.groupName || `${t("ruleGroup")} ${rule.groupId}`);
      }
    }
    return Array.from(groups, ([value, label]) => ({ label, value }));
  }, [rules, t]);
  const selectedEditRule = useMemo(
    () => rules.find((rule) => rule.id === editRuleId) ?? null,
    [editRuleId, rules]
  );
  const editTargetRules = useMemo(() => {
    if (mode === "editRule") {
      return selectedEditRule ? [selectedEditRule] : [];
    }
    if (mode === "editGroup") {
      return typeof editGroupId === "number"
        ? rules.filter((rule) => rule.groupId === editGroupId)
        : [];
    }
    return [];
  }, [editGroupId, mode, rules, selectedEditRule]);
  const editingTargetName = useMemo(() => {
    if (mode === "editRule") {
      return selectedEditRule?.name || t("untitled");
    }
    if (mode === "editGroup") {
      return groupOptions.find((option) => option.value === editGroupId)?.label || t("aiGeneratedGroup");
    }
    return "";
  }, [editGroupId, groupOptions, mode, selectedEditRule, t]);

  const preview = useMemo(() => {
    if (!result?.ok) {
      return "";
    }

    return formatJson(result.rules);
  }, [result]);

  const diffPreview = useMemo(() => {
    if (!result?.ok || mode === "create" || !editTargetRules.length) {
      return [];
    }
    const before = formatJson(editTargetRules.map(makeRuleSnapshot));
    const after = formatJson(result.rules.map(makeRuleSnapshot));
    return buildLineDiff(before, after);
  }, [editTargetRules, mode, result]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPrompt("");
    setResult(null);
    setError("");
    setEvents([]);
    setMode("create");
    setEditRuleId(selectedRule?.id ?? rules[0]?.id ?? null);
    setEditGroupId(selectedRule?.groupId ?? groupOptions[0]?.value ?? null);
  }, [groupOptions, open, rules, selectedRule]);

  useEffect(() => {
    if (mode === "editGroup" && !groupOptions.length) {
      setMode("create");
    }
    if (mode === "editRule" && !rules.length) {
      setMode("create");
    }
    if (rules.length && !rules.some((rule) => rule.id === editRuleId)) {
      setEditRuleId(selectedRule?.id ?? rules[0]?.id ?? null);
    }
    if (groupOptions.length && !groupOptions.some((option) => option.value === editGroupId)) {
      setEditGroupId(selectedRule?.groupId ?? groupOptions[0]?.value ?? null);
    }
  }, [editGroupId, editRuleId, groupOptions, mode, rules, selectedRule]);

  const handleGenerate = async () => {
    const request = prompt.trim();
    if (!request) {
      setError(t("aiPromptRequired"));
      return;
    }
    if (mode !== "create" && !editTargetRules.length) {
      setError(mode === "editRule" ? t("aiNoEditableRule") : t("aiNoEditableGroup"));
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setEvents([]);
    try {
      const settings = await getAISettings();
      const workflowResult = await runRuleDraftWorkflow(
        {
          prompt: request,
          currentRules: mode === "create" ? rules : editTargetRules,
          intent: mode,
          editRules: editTargetRules,
          locale,
        },
        {
          settings,
          onEvent: (event) => {
            setEvents((current) => [...current, event]);
          },
        }
      );
      setResult(workflowResult);
      if (!workflowResult.ok) {
        setError(t("aiValidationFailed"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("aiGenerateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!result?.ok) {
      return;
    }

    const groupId = generateId();
    const now = Date.now();
    const existingGroupRule =
      mode === "editGroup" ? editTargetRules.find((rule) => rule.groupId) : null;
    const targetGroupId = existingGroupRule?.groupId ?? groupId;
    const groupName =
      result.groupName ||
      existingGroupRule?.groupName ||
      prompt.trim().slice(0, 48) ||
      t("aiGeneratedGroup");
    const groupEnabled = existingGroupRule?.groupEnabled ?? false;
    const replaceIds = mode === "create" ? undefined : editTargetRules.map((rule) => rule.id);
    await onApply(
      result.rules.map((rule) => {
        const nextRule: Rule = {
          ...rule,
          create: now,
          update: now,
        };
        if (result.generationMode === "group") {
          nextRule.groupId = targetGroupId;
          nextRule.groupName = groupName;
          nextRule.groupEnabled = groupEnabled;
        }
        return nextRule;
      }),
      { replaceIds }
    );
    messageApi.success(t("aiDraftApplied"));
    onClose();
  };

  return (
    <>
      {contextHolder}
      <Drawer
        open={open}
        onClose={onClose}
        title={t("aiAssistantTitle")}
        placement="right"
        width={560}
        styles={{
          body: {
            display: "flex",
            minHeight: 0,
            overflow: "hidden",
          },
        }}
        extra={
          <Space>
            <Button onClick={onClose}>{t("cancel")}</Button>
            <Button type="primary" disabled={!canApply} onClick={handleApply}>
              {t("aiApplyDraft")}
            </Button>
          </Space>
        }
      >
        <div className="ai-assistant-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <section className="rounded-2xl border border-slate-200 bg-white/70 p-2">
            <Segmented
              block
              value={mode}
              onChange={(value) => {
                const nextMode = value as AIAssistantMode;
                setMode(nextMode);
                if (nextMode === "editRule" && editRuleId === null) {
                  setEditRuleId(selectedRule?.id ?? rules[0]?.id ?? null);
                }
                if (nextMode === "editGroup" && editGroupId === null) {
                  setEditGroupId(selectedRule?.groupId ?? groupOptions[0]?.value ?? null);
                }
                setResult(null);
                setError("");
                setEvents([]);
              }}
              options={[
                { label: t("aiModeCreate"), value: "create" },
                {
                  label: t("aiModeEditRule"),
                  value: "editRule",
                  disabled: !rules.length,
                },
                {
                  label: t("aiModeEditGroup"),
                  value: "editGroup",
                  disabled: !groupOptions.length,
                },
              ]}
            />
            {mode !== "create" ? (
              <div className="mt-3 flex flex-col gap-2 px-2">
                <Typography.Text className="text-xs font-semibold text-slate-500">
                  {mode === "editRule" ? t("aiSelectRule") : t("aiSelectGroup")}
                </Typography.Text>
                {mode === "editRule" ? (
                  <Select
                    aria-label={t("aiSelectRule")}
                    value={editRuleId ?? undefined}
                    options={ruleOptions}
                    placeholder={t("aiNoEditableRule")}
                    showSearch
                    optionFilterProp="label"
                    onChange={(value) => {
                      setEditRuleId(value);
                      setResult(null);
                      setError("");
                      setEvents([]);
                    }}
                  />
                ) : (
                  <Select
                    aria-label={t("aiSelectGroup")}
                    value={editGroupId ?? undefined}
                    options={groupOptions}
                    placeholder={t("aiNoEditableGroup")}
                    showSearch
                    optionFilterProp="label"
                    onChange={(value) => {
                      setEditGroupId(value);
                      setResult(null);
                      setError("");
                      setEvents([]);
                    }}
                  />
                )}
                <div className="truncate text-xs font-semibold text-slate-500">
                  {t("aiEditingTarget", { target: editingTargetName })}
                </div>
              </div>
            ) : null}
          </section>
          <section className="flex flex-col gap-2">
            <Typography.Text className="text-sm font-semibold text-slate-900">
              {t("aiPromptLabel")}
            </Typography.Text>
            <Input.TextArea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={t("aiPromptPlaceholder")}
              autoSize={{ minRows: 5, maxRows: 9 }}
            />
            <Button type="primary" loading={loading} onClick={handleGenerate}>
              {mode === "create" ? t("aiGenerateRule") : t("aiEditRule")}
            </Button>
          </section>

          {error && (
            <Alert type="error" showIcon message={error} description={renderIssues(result)} />
          )}

          {events.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Typography.Text className="text-xs font-semibold text-slate-600">
                {t("aiGenerationProgress")}
              </Typography.Text>
              <ol className="mt-2 flex flex-col gap-1 pl-4 text-xs leading-5 text-slate-500">
                {events.map((event, index) => (
                  <li key={`${event.type}-${index}`}>{event.message}</li>
                ))}
              </ol>
            </section>
          )}

          {result?.ok && (
            <section className="flex min-h-[360px] flex-col gap-3">
              <Alert
                type={result.repaired ? "warning" : "success"}
                showIcon
                message={result.repaired ? t("aiDraftRepaired") : t("aiDraftValid")}
              />
              <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2">
                <Typography.Text className="text-sm font-semibold text-slate-900">
                  {diffPreview.length ? t("aiDiffPreview") : t("aiDraftPreview")}
                </Typography.Text>
                {diffPreview.length ? (
                  <pre className="m-0 min-h-0 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5">
                    {diffPreview.map((line, index) => (
                      <div
                        key={`${line.type}-${index}`}
                        className={
                          line.type === "add"
                            ? "text-emerald-700"
                            : line.type === "remove"
                              ? "text-red-600"
                              : "text-slate-500"
                        }
                      >
                        {line.text}
                      </div>
                    ))}
                  </pre>
                ) : (
                  <pre className="m-0 min-h-0 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                    {preview}
                  </pre>
                )}
              </div>
            </section>
          )}
        </div>
      </Drawer>
    </>
  );
}
