import type { Rule } from "../utils/types";

export type AIProvider = "gpt" | "deepseek";

export type RuleDraftAction = "mock" | "redirect" | "block" | "modifyHeaders";

export type HeaderDraftOperation = "set" | "append" | "remove";

export interface AIModelOption {
  label: string;
  value: string;
}

export type AIProviderApiKeys = Partial<Record<AIProvider, string>>;

export interface AIProviderSettings {
  enabled: boolean;
  provider: AIProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
  apiKeys: AIProviderApiKeys;
}

export interface HeaderDraft {
  header: string;
  operation: HeaderDraftOperation;
  value?: string;
  enabled?: boolean;
}

export interface RuleDraft {
  name: string;
  action: RuleDraftAction;
  regexFilter: string;
  redirectUrl?: string;
  mockResponse?: unknown;
  requestHeaders?: HeaderDraft[];
  responseHeaders?: HeaderDraft[];
  explanation?: string;
}

export interface RuleDraftInput {
  prompt: string;
  currentRules: Rule[];
  locale?: "zh-CN" | "en";
}

export interface RuleDraftPlan {
  groupName?: string;
  rules: Array<{
    action: RuleDraftAction;
    target: string;
    needsMockResponse: boolean;
    needsRedirectUrl: boolean;
    needsHeaders: boolean;
  }>;
  confidence: number;
  notes: string[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationSuccess {
  ok: true;
  draft: RuleDraft;
  warnings: string[];
}

export interface ValidationFailure {
  ok: false;
  draft?: RuleDraft;
  issues: ValidationIssue[];
}

export type RuleDraftValidation = ValidationSuccess | ValidationFailure;

export interface RuleDraftWorkflowSuccess {
  ok: true;
  groupName: string;
  plan: RuleDraftPlan;
  drafts: RuleDraft[];
  rules: Rule[];
  validation: ValidationSuccess[];
  repaired: boolean;
}

export interface RuleDraftWorkflowFailure {
  ok: false;
  plan?: RuleDraftPlan;
  drafts?: RuleDraft[];
  issues: ValidationIssue[];
}

export type RuleDraftWorkflowResult = RuleDraftWorkflowSuccess | RuleDraftWorkflowFailure;

export type RuleDraftWorkflowEvent =
  | { type: "start"; message: string }
  | { type: "plan:start"; message: string }
  | { type: "plan:done"; message: string; plan: RuleDraftPlan }
  | { type: "draft:start"; message: string }
  | { type: "draft:done"; message: string; drafts: RuleDraft[] }
  | { type: "validate:start"; message: string }
  | { type: "validate:failed"; message: string; issues: ValidationIssue[] }
  | { type: "repair:start"; message: string }
  | { type: "repair:done"; message: string; drafts: RuleDraft[] }
  | { type: "complete"; message: string; rules: Rule[] };
