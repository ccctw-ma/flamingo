import { createProviderAgent, RuleDraftAgent, AgentPrompt } from "../provider";
import {
  validateRuleDraft,
  verifyRuleDraft,
  ruleDraftToNewRule,
  ruleDraftToRule,
  RegexValidator,
} from "../validators";
import {
  AIProviderSettings,
  RuleDraft,
  RuleDraftInput,
  RuleDraftPlan,
  RuleDraftWorkflowEvent,
  RuleDraftWorkflowResult,
  RuleDraftAction,
  ValidationIssue,
} from "../types";

const ACTIONS = new Set<RuleDraftAction>(["mock", "redirect", "block", "modifyHeaders"]);

export interface RuleDraftWorkflowRuntime {
  agent?: RuleDraftAgent;
  settings?: AIProviderSettings;
  validateRegex?: RegexValidator;
  onEvent?: (event: RuleDraftWorkflowEvent) => void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function readGenerationMode(value: unknown, ruleCount: number): RuleDraftPlan["generationMode"] {
  const rawMode = isObject(value) ? asString(value.generationMode || value.mode) : "";
  if (rawMode === "rule" || rawMode === "group") {
    return rawMode;
  }
  return ruleCount > 1 ? "group" : "rule";
}

function shortenTitle(value: string, fallback: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return fallback;
  }
  if (/^[ -~]+$/.test(normalized)) {
    const words = normalized.split(" ").filter(Boolean);
    const shortWords = words.slice(0, 3).join(" ");
    return shortWords.length <= 24 ? shortWords : shortWords.slice(0, 24).trim();
  }
  return Array.from(normalized).slice(0, 10).join("");
}

export function verifyRuleDraftPlan(value: unknown): RuleDraftPlan {
  if (!isObject(value)) {
    throw new Error("Rule draft plan must be a JSON object");
  }

  const rawRules = Array.isArray(value.rules) ? value.rules : [value];
  const rules = rawRules
    .filter(isObject)
    .map((item) => {
      const action = asString(item.action) as RuleDraftAction;
      if (!ACTIONS.has(action)) {
        return null;
      }
      return {
        action,
        target: asString(item.target),
        needsMockResponse: asBoolean(item.needsMockResponse),
        needsRedirectUrl: asBoolean(item.needsRedirectUrl),
        needsHeaders: asBoolean(item.needsHeaders),
      };
    })
    .filter((item): item is RuleDraftPlan["rules"][number] => Boolean(item));

  if (!rules.length) {
    throw new Error("Rule draft plan must include at least one valid rule");
  }

  return {
    generationMode: readGenerationMode(value, rules.length),
    groupName: shortenTitle(asString(value.groupName), "AI Group"),
    rules,
    confidence: Math.max(0, Math.min(1, asNumber(value.confidence))),
    notes: asStringArray(value.notes),
  };
}

function baseSystemPrompt() {
  return [
    "You create Chrome declarativeNetRequest rule drafts for the Flamingo extension.",
    "Return JSON objects only. Do not include Markdown, comments, or free text.",
    "Generated rules are project-level drafts. They must be disabled until a human applies and enables them.",
    "Supported actions: mock, redirect, block, modifyHeaders.",
    "Use regexFilter for URL matching. Prefer anchored regular expressions for exact URLs.",
  ].join("\n");
}

function planPrompt(input: RuleDraftInput): AgentPrompt {
  const intent = input.intent ?? "create";
  return {
    kind: "plan",
    system: baseSystemPrompt(),
    user: JSON.stringify(
      {
        task:
          intent === "editRule"
            ? "Plan how to edit the selected existing Flamingo DNR rule for the user request."
            : intent === "editGroup"
              ? "Plan how to edit the selected existing Flamingo DNR rule group for the user request."
              : "Plan all Flamingo DNR rules needed for the user request.",
        outputShape: {
          generationMode:
            "rule | group. Use rule for a single independent request; use group for a scenario that needs multiple coordinated rules.",
          groupName: "short group title, <=10 CJK chars or <=3 English words",
          rules: [
            {
              action: "mock | redirect | block | modifyHeaders",
              target: "URL, domain, or pattern being matched",
              needsMockResponse: "boolean",
              needsRedirectUrl: "boolean",
              needsHeaders: "boolean",
            },
          ],
          confidence: "number from 0 to 1",
          notes: ["short implementation notes"],
        },
        userPrompt: input.prompt,
        existingRules: input.currentRules.map((rule) => ({
          name: rule.name,
          regexFilter: rule.condition.regexFilter,
          action: rule.uiActionType ?? rule.action.type,
        })),
        editContext: {
          intent,
          targetRules: (input.editRules ?? []).map((rule) => ({
            id: rule.id,
            name: rule.name,
            groupName: rule.groupName,
            regexFilter: rule.condition.regexFilter,
            action: rule.uiActionType ?? rule.action.type,
          })),
        },
        locale: input.locale ?? "zh-CN",
      },
      null,
      2
    ),
  };
}

function buildRulePrompt(input: RuleDraftInput, plan: RuleDraftPlan): AgentPrompt {
  const intent = input.intent ?? "create";
  return {
    kind: "draft",
    system: baseSystemPrompt(),
    user: JSON.stringify(
      {
        task:
          intent === "editRule"
            ? "Generate the complete edited RuleDraft for the selected rule. Return exactly one rule."
            : intent === "editGroup"
              ? "Generate the complete edited RuleDraft list for the selected group."
              : "Generate a JSON object with a rules array. Include every RuleDraft needed by the request.",
        outputShape: {
          generationMode:
            "rule | group. Match the plan. Use rule for one independent rule; group for multiple related rules.",
          groupName: "short group title, <=10 CJK chars or <=3 English words",
          rules: [
            {
              name: "string",
              action: "mock | redirect | block | modifyHeaders",
              regexFilter: "string",
              redirectUrl: "string, only for redirect",
              mockResponse: "JSON value, only for mock",
              requestHeaders: [
                {
                  header: "string",
                  operation: "set | append | remove",
                  value: "string, omit for remove",
                  enabled: true,
                },
              ],
              responseHeaders: "same shape as requestHeaders",
              explanation: "short string",
            },
          ],
        },
        constraints: [
          "Return at least one rule and at most five rules.",
          "Use generationMode=rule when the request can be fulfilled by one independent rule.",
          "Use generationMode=group only when multiple related rules should be managed together.",
          "Provide groupName only when generationMode is group.",
          "When editing, preserve the user's intent while returning the full final rule definition, not a partial patch.",
          "When editing a single rule, return generationMode=rule and exactly one rule.",
          "When editing a group, return generationMode=group and include every rule that should remain in the group.",
          "Every rule must have a concise name. Keep Chinese names within 10 characters; keep English names within 3 complete words when possible.",
          "Do not set enable/enabled for the rule itself.",
          "For remove header operations, omit value.",
          "For set or append header operations, include a non-empty value.",
          "For mock, mockResponse must be a JSON value, not Markdown.",
        ],
        plan,
        userPrompt: input.prompt,
        editTargetRules: (input.editRules ?? []).map((rule) => ({
          id: rule.id,
          name: rule.name,
          groupName: rule.groupName,
          enable: rule.enable,
          action: rule.action,
          condition: rule.condition,
          mockResponse: rule.mockResponse,
          uiActionType: rule.uiActionType,
        })),
      },
      null,
      2
    ),
  };
}

function repairPrompt(
  input: RuleDraftInput,
  draft: unknown,
  issues: ValidationIssue[]
): AgentPrompt {
  return {
    kind: "repair",
    system: baseSystemPrompt(),
    user: JSON.stringify(
      {
        task: "Repair the project-level RuleDraft JSON object so every item in rules passes deterministic validation.",
        issues,
        invalidDraftResult: draft,
        userPrompt: input.prompt,
      },
      null,
      2
    ),
  };
}

function validationIssues(error: unknown): ValidationIssue[] {
  return [
    {
      path: "workflow",
      message: error instanceof Error ? error.message : "AI workflow failed",
    },
  ];
}

function safelyVerifyRuleDraftList(draft: unknown): RuleDraft[] | undefined {
  try {
    return verifyRuleDraftList(draft);
  } catch {
    return undefined;
  }
}

function verifyRuleDraftList(value: unknown) {
  const rawRules = isObject(value) && Array.isArray(value.rules) ? value.rules : [value];
  if (!rawRules.length) {
    throw new Error("AI draft must include at least one rule");
  }
  return rawRules.slice(0, 5).map(verifyRuleDraft);
}

function readGroupName(value: unknown, fallback: string) {
  return isObject(value) ? shortenTitle(asString(value.groupName), fallback) : fallback;
}

function readResultMode(value: unknown, plan: RuleDraftPlan, ruleCount: number) {
  if (!isObject(value)) {
    return plan.generationMode;
  }
  return readGenerationMode(value, ruleCount);
}

function readResultGroupName(value: unknown, plan: RuleDraftPlan, ruleCount: number) {
  const generationMode = readResultMode(value, plan, ruleCount);
  return generationMode === "group"
    ? readGroupName(value, plan.groupName ?? "AI Group")
    : undefined;
}

function normalizeResultMode(input: RuleDraftInput, mode: RuleDraftPlan["generationMode"]) {
  if (input.intent === "editRule") {
    return "rule";
  }
  if (input.intent === "editGroup") {
    return "group";
  }
  return mode;
}

async function validateDraftOrReturnIssues(
  draft: unknown,
  input: RuleDraftInput,
  validateRegex?: RegexValidator
) {
  const verified = verifyRuleDraftList(draft);
  const validations = await Promise.all(
    verified.map((item) => validateRuleDraft(item, ruleDraftToNewRule(item), validateRegex))
  );
  return { verified, validations };
}

function collectValidationIssues(
  validations: Awaited<ReturnType<typeof validateDraftOrReturnIssues>>["validations"]
) {
  return validations.flatMap((validation, ruleIndex) =>
    validation.ok
      ? []
      : validation.issues.map((issue) => ({
          path: `rules.${ruleIndex}.${issue.path}`,
          message: issue.message,
        }))
  );
}

function buildRules(
  validations: Awaited<ReturnType<typeof validateDraftOrReturnIssues>>["validations"],
  input: RuleDraftInput
) {
  const editRules = input.editRules ?? [];
  const baseGroupRule = editRules.find((rule) => rule.groupId);
  return validations
    .filter((validation): validation is Extract<typeof validation, { ok: true }> => validation.ok)
    .map((validation, index) => {
      const draft = {
        ...validation.draft,
        name: shortenTitle(validation.draft.name, `Rule ${index + 1}`),
      };
      const editedRule = editRules[index];
      if (editedRule) {
        return ruleDraftToRule(draft, editedRule);
      }
      const nextRule = ruleDraftToNewRule(draft, index);
      if (input.intent === "editGroup" && baseGroupRule?.groupId) {
        nextRule.groupId = baseGroupRule.groupId;
        nextRule.groupName = baseGroupRule.groupName;
        nextRule.groupEnabled = baseGroupRule.groupEnabled;
      }
      return nextRule;
    });
}

export async function runRuleDraftWorkflow(
  input: RuleDraftInput,
  runtime: RuleDraftWorkflowRuntime = {}
): Promise<RuleDraftWorkflowResult> {
  const agent = runtime.agent ?? (runtime.settings ? createProviderAgent(runtime.settings) : null);
  if (!agent) {
    return {
      ok: false,
      issues: [{ path: "settings", message: "AI provider settings are required" }],
    };
  }

  let plan: RuleDraftPlan | undefined;
  let draft: unknown;

  try {
    runtime.onEvent?.({ type: "start", message: "准备 AI 生成流程" });
    runtime.onEvent?.({ type: "plan:start", message: "正在分析需求并规划规则" });
    plan = verifyRuleDraftPlan(await agent(planPrompt(input)));
    runtime.onEvent?.({
      type: "plan:done",
      message: `规划完成：${plan.rules.length} 条规则`,
      plan,
    });
    runtime.onEvent?.({ type: "draft:start", message: "正在生成规则草稿" });
    draft = await agent(buildRulePrompt(input, plan));
    const initialDrafts = verifyRuleDraftList(draft);
    runtime.onEvent?.({
      type: "draft:done",
      message: `草稿生成完成：${initialDrafts.length} 条`,
      drafts: initialDrafts,
    });
    runtime.onEvent?.({ type: "validate:start", message: "正在校验草稿" });

    const firstPass = await validateDraftOrReturnIssues(draft, input, runtime.validateRegex);
    const firstIssues = collectValidationIssues(firstPass.validations);
    if (!firstIssues.length) {
      const rules = buildRules(firstPass.validations, input);
      const generationMode = normalizeResultMode(input, readResultMode(draft, plan, rules.length));
      const groupName = readResultGroupName(draft, plan, rules.length);
      runtime.onEvent?.({ type: "complete", message: "草稿校验通过", rules });
      return {
        ok: true,
        generationMode,
        groupName,
        plan,
        drafts: firstPass.verified,
        rules,
        validation: firstPass.validations.filter(
          (validation): validation is Extract<typeof validation, { ok: true }> => validation.ok
        ),
        repaired: false,
      };
    }

    runtime.onEvent?.({
      type: "validate:failed",
      message: "草稿需要修复",
      issues: firstIssues,
    });
    runtime.onEvent?.({ type: "repair:start", message: "正在修复草稿" });
    const repairedDraft = await agent(repairPrompt(input, draft, firstIssues));
    const repairedDrafts = verifyRuleDraftList(repairedDraft);
    runtime.onEvent?.({
      type: "repair:done",
      message: `修复完成：${repairedDrafts.length} 条`,
      drafts: repairedDrafts,
    });
    const repairedPass = await validateDraftOrReturnIssues(
      repairedDraft,
      input,
      runtime.validateRegex
    );
    const repairedIssues = collectValidationIssues(repairedPass.validations);

    if (repairedIssues.length) {
      return {
        ok: false,
        plan,
        drafts: repairedPass.verified,
        issues: repairedIssues,
      };
    }

    const rules = buildRules(repairedPass.validations, input);
    const generationMode = normalizeResultMode(
      input,
      readResultMode(repairedDraft, plan, rules.length)
    );
    const groupName = readResultGroupName(repairedDraft, plan, rules.length);
    runtime.onEvent?.({ type: "complete", message: "修复后的草稿校验通过", rules });
    return {
      ok: true,
      generationMode,
      groupName,
      plan,
      drafts: repairedPass.verified,
      rules,
      validation: repairedPass.validations.filter(
        (validation): validation is Extract<typeof validation, { ok: true }> => validation.ok
      ),
      repaired: true,
    };
  } catch (error) {
    return {
      ok: false,
      plan,
      drafts: draft ? safelyVerifyRuleDraftList(draft) : undefined,
      issues: validationIssues(error),
    };
  }
}
