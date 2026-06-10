import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createProviderAgent } from "../src/ai/provider";
import { AIProviderSettings } from "../src/ai/types";

function loadDotEnv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) {
      continue;
    }
    const [, key, rawValue] = match;
    process.env[key] ??= rawValue.replace(/^["']|["']$/g, "");
  }
}

loadDotEnv();

const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.DESEEK_API_KEY;
const openAIKey = process.env.OPENAI_API_KEY;

function getLiveSettings(): AIProviderSettings | null {
  if (deepseekKey) {
    return {
      enabled: true,
      provider: "deepseek",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      apiKey: deepseekKey,
      apiKeys: {
        gpt: "",
        deepseek: deepseekKey,
      },
    };
  }

  if (openAIKey) {
    return {
      enabled: true,
      provider: "gpt",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-5.4-mini",
      apiKey: openAIKey,
      apiKeys: {
        gpt: openAIKey,
        deepseek: "",
      },
    };
  }

  return null;
}

test("live AI provider returns a JSON object for rule generation prompts", async () => {
  const settings = getLiveSettings();
  test.skip(!settings, "Set DEEPSEEK_API_KEY, DESEEK_API_KEY, or OPENAI_API_KEY in .env");
  if (!settings) {
    return;
  }

  const agent = createProviderAgent(settings);
  await expect(
    agent({
      kind: "draft",
      system: [
        "Return only a JSON object.",
        'The JSON object must have this exact shape: {"ok":true}.',
      ].join("\n"),
      user: 'Return {"ok":true}.',
    })
  ).resolves.toEqual({ ok: true });
});
