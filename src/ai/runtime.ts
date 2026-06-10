import { AIModelOption, AIProvider, AIProviderApiKeys, AIProviderSettings } from "./types";

export const AI_SETTINGS_STORAGE_KEY = "flamingo:ai-settings";

export interface AIProviderPreset {
  provider: AIProvider;
  label: string;
  baseUrl: string;
  defaultModel: string;
  models: AIModelOption[];
}

export const AI_PROVIDER_PRESETS: Record<AIProvider, AIProviderPreset> = {
  gpt: {
    provider: "gpt",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-5.4-mini",
    models: [
      { label: "GPT-5.5", value: "gpt-5.5" },
      { label: "GPT-5.5 Pro", value: "gpt-5.5-pro" },
      { label: "GPT-5.4", value: "gpt-5.4" },
      { label: "GPT-5.4 mini", value: "gpt-5.4-mini" },
      { label: "GPT-5.4 nano", value: "gpt-5.4-nano" },
      { label: "GPT-5.4 Pro", value: "gpt-5.4-pro" },
    ],
  },
  deepseek: {
    provider: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-v4-flash",
    models: [
      { label: "DeepSeek V4 Flash", value: "deepseek-v4-flash" },
      { label: "DeepSeek V4 Pro", value: "deepseek-v4-pro" },
    ],
  },
};

export const DEFAULT_AI_SETTINGS: AIProviderSettings = {
  enabled: false,
  provider: "gpt",
  baseUrl: AI_PROVIDER_PRESETS.gpt.baseUrl,
  model: AI_PROVIDER_PRESETS.gpt.defaultModel,
  apiKey: "",
  apiKeys: {},
};

function isAIProvider(value: unknown): value is AIProvider {
  return value === "gpt" || value === "deepseek";
}

function readApiKeys(value: unknown): AIProviderApiKeys {
  if (!value || typeof value !== "object") {
    return {};
  }

  const keys = value as Partial<Record<AIProvider, unknown>>;
  return {
    gpt: typeof keys.gpt === "string" ? keys.gpt : "",
    deepseek: typeof keys.deepseek === "string" ? keys.deepseek : "",
  };
}

function normalizeModel(provider: AIProvider, value: unknown) {
  const preset = AI_PROVIDER_PRESETS[provider];
  if (typeof value !== "string") {
    return preset.defaultModel;
  }

  const model = value.trim();
  return preset.models.some((option) => option.value === model) ? model : preset.defaultModel;
}

export function normalizeAISettings(value: unknown): AIProviderSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_AI_SETTINGS;
  }

  const stored = value as Partial<Record<keyof AIProviderSettings, unknown>>;
  const provider = isAIProvider(stored.provider) ? stored.provider : DEFAULT_AI_SETTINGS.provider;
  const preset = AI_PROVIDER_PRESETS[provider];
  const apiKeys = readApiKeys(stored.apiKeys);
  const legacyApiKey = typeof stored.apiKey === "string" ? stored.apiKey : "";
  const providerApiKey = apiKeys[provider] || legacyApiKey;
  const nextApiKeys: AIProviderApiKeys = {
    gpt: "",
    deepseek: "",
    ...apiKeys,
    [provider]: providerApiKey,
  };

  return {
    enabled: typeof stored.enabled === "boolean" ? stored.enabled : DEFAULT_AI_SETTINGS.enabled,
    provider,
    baseUrl: preset.baseUrl,
    model: normalizeModel(provider, stored.model),
    apiKey: providerApiKey,
    apiKeys: nextApiKeys,
  };
}

export async function getAISettings(): Promise<AIProviderSettings> {
  const value = (await chrome.storage.local.get(AI_SETTINGS_STORAGE_KEY))[AI_SETTINGS_STORAGE_KEY];
  return normalizeAISettings(value);
}

export async function setAISettings(settings: AIProviderSettings) {
  await chrome.storage.local.set({
    [AI_SETTINGS_STORAGE_KEY]: normalizeAISettings(settings),
  });
}
