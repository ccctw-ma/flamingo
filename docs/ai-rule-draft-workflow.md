# AI Rule Draft Workflow

Flamingo's AI integration is a rule-draft workflow, not an autonomous rule agent.

## Scope

The workflow supports both creation and editing:

- Create a standalone rule when the user asks for one independent rule.
- Create a group when the user asks for multiple related rules in one scenario.
- Edit the selected rule or the selected group, showing a diff preview before applying.

The AI provider returns structured JSON, Flamingo validates it deterministically, and the user decides whether to apply the disabled draft.

Supported actions:

- `mock`
- `redirect`
- `block`
- `modifyHeaders`

## Flow

1. User opens **AI Generate Rule** and chooses Create, Edit Rule, or Edit Group.
2. `runRuleDraftWorkflow` asks the provider for a small intent plan.
3. The workflow asks for a structured `RuleDraft` JSON object.
4. `validateRuleDraft` checks regex support, mock JSON, header operations, and DNR conversion.
5. If validation fails once, the workflow asks the provider for a repaired JSON draft.
6. The UI shows the generated disabled `Rule` preview or an edit diff preview.
7. The user clicks **Apply Draft**.
8. The existing editor `onChange -> updateRules -> storage -> background` chain persists the rule and syncs enabled DNR rules.

## Provider Settings

Provider settings live under `flamingo:ai-settings` in `chrome.storage.local` and do not follow the rules storage mode. This is intentional because API keys should not be copied through Chrome Sync.

Supported provider presets are built into the extension. Users choose a provider and one of that
provider's model options; they do not need to know or type custom model names or endpoint URLs.

- OpenAI: endpoint `https://api.openai.com/v1`, models `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`
- DeepSeek: endpoint `https://api.deepseek.com`, models `deepseek-v4-flash`, `deepseek-v4-pro`

Both presets use an OpenAI-compatible `POST /chat/completions` request. Flamingo asks for JSON
object output first and retries without the provider-specific JSON mode flag if a provider rejects
that option, then still validates that the returned content is a JSON object.

API keys are stored separately by provider:

- OpenAI and DeepSeek keys are not reused across providers.
- Legacy single-key settings are migrated to the currently selected provider only.
- Provider request URLs always come from provider presets; old custom `baseUrl` values are ignored.

Do not inject real API keys from `.env` into the extension bundle. A packaged Chrome extension cannot hide frontend secrets. Use the settings UI to store a local user-provided key.
