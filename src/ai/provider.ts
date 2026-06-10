import { AIProviderSettings } from "./types";

export interface AgentPrompt {
  kind: "plan" | "draft" | "repair";
  system: string;
  user: string;
}

export type RuleDraftAgent = (prompt: AgentPrompt) => Promise<unknown>;

interface ChatCompletionResponse {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function buildChatCompletionsUrl(baseUrl: string) {
  const normalized = baseUrl.trim().replace(/\/+$/, "");
  if (normalized.endsWith("/chat/completions")) {
    return normalized;
  }
  return `${normalized}/chat/completions`;
}

function isChatCompletionResponse(value: unknown): value is ChatCompletionResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as { choices?: unknown };
  return Array.isArray(response.choices);
}

function parseJsonObject(content: string) {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    throw new Error("AI response must be a JSON object");
  }

  return JSON.parse(trimmed) as unknown;
}

async function requestChatCompletion(
  settings: AIProviderSettings,
  prompt: AgentPrompt,
  jsonMode: boolean
) {
  return await fetch(buildChatCompletionsUrl(settings.baseUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${settings.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.2,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: [
        {
          role: "system",
          content: prompt.system,
        },
        {
          role: "user",
          content: prompt.user,
        },
      ],
    }),
  });
}

function shouldRetryWithoutJsonMode(response: Response) {
  return response.status === 400 || response.status === 422;
}

export function createProviderAgent(settings: AIProviderSettings): RuleDraftAgent {
  return async (prompt) => {
    if (!settings.enabled) {
      throw new Error("AI assistant is disabled");
    }
    if (!settings.apiKey.trim()) {
      throw new Error("AI API key is missing");
    }
    if (!settings.baseUrl.trim() || !settings.model.trim()) {
      throw new Error("AI provider baseUrl and model are required");
    }

    let response = await requestChatCompletion(settings, prompt, true);
    if (!response.ok && shouldRetryWithoutJsonMode(response)) {
      response = await requestChatCompletion(settings, prompt, false);
    }

    if (!response.ok) {
      throw new Error(`AI provider request failed: ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    if (!isChatCompletionResponse(payload)) {
      throw new Error("AI provider returned an invalid response");
    }

    const content = payload.choices[0]?.message?.content;
    if (!content) {
      throw new Error("AI provider returned an empty response");
    }

    return parseJsonObject(content);
  };
}
