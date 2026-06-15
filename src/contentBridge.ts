import { normalizeRegexFilter } from "./utils/urlPattern";

type MockRulePayload = {
  id: number;
  regexFilter: string;
  body: string;
};

type HeaderOperationPayload = {
  header: string;
  operation: string;
  value?: string;
};

type ProxyRulePayload = {
  id: number;
  regexFilter: string;
  requestHeaders: HeaderOperationPayload[];
};

type MockStatePayload = {
  working: boolean;
  rules: MockRulePayload[];
  proxyRules: ProxyRulePayload[];
};

const MESSAGE_SOURCE = "FLAMINGO_EXTENSION";
const MESSAGE_STATE = "FLAMINGO_MOCK_RULES";
const MESSAGE_REQUEST_STATE = "FLAMINGO_REQUEST_MOCK_RULES";
const RULES_STORAGE_KEY = "rules_storage_key";
const WORKING_STORAGE_KEY = "WORKING";
const STORAGE_MODE_KEY = "STORAGE_MODE";
const CUSTOM_ACTION_MOCK = "mock";

type StorageMode = "local" | "sync";

type StoredRule = {
  id: number;
  enable?: boolean;
  action?: {
    type?: string;
    requestHeaders?: Array<{
      enabled?: boolean;
      header?: string;
      operation?: string;
      value?: string;
    }>;
  };
  condition?: {
    regexFilter?: string;
  };
  mockResponse?: {
    enabled?: boolean;
    body?: string;
  };
  uiActionType?: string;
};

function getEnabledRequestHeaders(rule: StoredRule): HeaderOperationPayload[] {
  return (
    rule.action?.requestHeaders
      ?.filter((header) => header.enabled !== false && header.header && header.operation)
      .map((header) => ({
        header: header.header ?? "",
        operation: header.operation ?? "",
        ...(header.value === undefined ? {} : { value: header.value }),
      })) ?? []
  );
}

function dispatchMockState(payload: MockStatePayload) {
  window.postMessage(
    {
      source: MESSAGE_SOURCE,
      type: MESSAGE_STATE,
      payload,
    },
    window.location.origin
  );
}

async function getStorageValue(areaName: StorageMode, key: string) {
  return (await chrome.storage[areaName].get(key))[key];
}

async function getStorageMode(): Promise<StorageMode> {
  const localMode = await getStorageValue("local", STORAGE_MODE_KEY);
  if (localMode === "local" || localMode === "sync") {
    return localMode;
  }

  const syncMode = await getStorageValue("sync", STORAGE_MODE_KEY);
  if (syncMode === "local" || syncMode === "sync") {
    return syncMode;
  }

  return "local";
}

function ensureRules(value: unknown): StoredRule[] {
  return Array.isArray(value) ? (value as StoredRule[]) : [];
}

async function readMockState(): Promise<MockStatePayload> {
  const mode = await getStorageMode();
  const [rules, working] = await Promise.all([
    getStorageValue(mode, RULES_STORAGE_KEY),
    getStorageValue(mode, WORKING_STORAGE_KEY),
  ]);

  return {
    working: (working as boolean | undefined) ?? true,
    rules: ensureRules(rules)
      .filter(
        (rule) =>
          rule.enable && rule.uiActionType === CUSTOM_ACTION_MOCK && rule.mockResponse?.enabled
      )
      .map((rule) => ({
        id: rule.id,
        regexFilter: normalizeRegexFilter(rule.condition?.regexFilter ?? ""),
        body: rule.mockResponse?.body ?? "",
      })),
    proxyRules: ensureRules(rules)
      .filter(
        (rule) =>
          rule.enable &&
          rule.uiActionType !== CUSTOM_ACTION_MOCK &&
          rule.action?.type === "modifyHeaders" &&
          getEnabledRequestHeaders(rule).length > 0
      )
      .map((rule) => ({
        id: rule.id,
        regexFilter: normalizeRegexFilter(rule.condition?.regexFilter ?? ""),
        requestHeaders: getEnabledRequestHeaders(rule),
      })),
  };
}

async function syncMockState() {
  dispatchMockState(await readMockState());
}

void syncMockState();

chrome.storage.onChanged.addListener(() => {
  void syncMockState();
});

window.addEventListener("message", (event) => {
  if (
    event.source === window &&
    event.data?.source === MESSAGE_SOURCE &&
    event.data?.type === MESSAGE_REQUEST_STATE
  ) {
    void syncMockState();
  }
});
