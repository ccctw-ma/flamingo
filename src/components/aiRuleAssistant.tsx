import { Alert, Button, Drawer, Input, Space, Typography, message } from "antd";
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
  onClose: () => void;
  onApply: (rules: Rule[]) => void | Promise<void>;
}

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

export default function AIRuleAssistant({ open, rules, onClose, onApply }: AIRuleAssistantProps) {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RuleDraftWorkflowResult | null>(null);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<RuleDraftWorkflowEvent[]>([]);
  const canApply = Boolean(result?.ok);

  const preview = useMemo(() => {
    if (!result?.ok) {
      return "";
    }

    return formatJson(result.rules);
  }, [result]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPrompt("");
    setResult(null);
    setError("");
    setEvents([]);
  }, [open]);

  const handleGenerate = async () => {
    const request = prompt.trim();
    if (!request) {
      setError(t("aiPromptRequired"));
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
          currentRules: rules,
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
    const groupName = result.groupName || prompt.trim().slice(0, 48) || t("aiGeneratedGroup");
    await onApply(
      result.rules.map((rule) => ({
        ...rule,
        groupId,
        groupName,
        groupEnabled: false,
        create: now,
        update: now,
      }))
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
        width={460}
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
          <Alert type="info" showIcon message={t("aiAssistantSafetyHint")} />

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
              {t("aiGenerateRule")}
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
                  {t("aiDraftPreview")}
                </Typography.Text>
                <pre className="m-0 min-h-0 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                  {preview}
                </pre>
              </div>
            </section>
          )}
        </div>
      </Drawer>
    </>
  );
}
