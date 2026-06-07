type MockRulePayload = {
  id: number;
  regexFilter: string;
  body: string;
};

type MockStatePayload = {
  working: boolean;
  rules: MockRulePayload[];
};

const MESSAGE_SOURCE = "FLAMINGO_EXTENSION";
const MESSAGE_STATE = "FLAMINGO_MOCK_RULES";
const MESSAGE_REQUEST_STATE = "FLAMINGO_REQUEST_MOCK_RULES";
const INSTALLED_KEY = "__FLAMINGO_MOCK_INSTALLED__";
const MOCK_HEADERS = "content-type: application/json;charset=utf-8\r\nx-flamingo-mock: true\r\n";
const INITIAL_STATE_TIMEOUT_MS = 1000;

declare global {
  interface Window {
    [INSTALLED_KEY]?: boolean;
  }
}

let mockState: MockStatePayload = {
  working: true,
  rules: [],
};
let hasInitialState = false;
let initialStateTimer: number | undefined;
const initialStateWaiters = new Set<() => void>();

function resolveInitialStateWaiters() {
  if (hasInitialState) {
    return;
  }

  hasInitialState = true;
  if (initialStateTimer !== undefined) {
    window.clearTimeout(initialStateTimer);
    initialStateTimer = undefined;
  }
  for (const resolve of initialStateWaiters) {
    resolve();
  }
  initialStateWaiters.clear();
}

function waitForInitialState() {
  if (hasInitialState) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    initialStateWaiters.add(resolve);
    if (initialStateTimer === undefined) {
      initialStateTimer = window.setTimeout(resolveInitialStateWaiters, INITIAL_STATE_TIMEOUT_MS);
    }
  });
}

function toAbsoluteUrl(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return new URL(input, window.location.href).href;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function findMock(url: string) {
  if (!mockState.working) {
    return null;
  }

  for (const rule of mockState.rules) {
    if (!rule.regexFilter) {
      continue;
    }
    try {
      if (new RegExp(rule.regexFilter).test(url)) {
        return rule;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function logMockHit(transport: "fetch" | "xhr", url: string, rule: MockRulePayload) {
  console.warn(`[Flamingo Mock] 命中 Mock 规则: ${url}`, {
    transport,
    ruleId: rule.id,
    url,
    regexFilter: rule.regexFilter,
    responseBody: rule.body,
  });
}

function buildMockResponse(body: string) {
  return new Response(body, {
    status: 200,
    statusText: "OK",
    headers: {
      "content-type": "application/json;charset=utf-8",
      "x-flamingo-mock": "true",
    },
  });
}

function patchFetch() {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    await waitForInitialState();
    const url = toAbsoluteUrl(input);
    const mock = findMock(url);
    if (mock) {
      logMockHit("fetch", url, mock);
      return buildMockResponse(mock.body);
    }

    return nativeFetch(input, init);
  }) as typeof window.fetch;
}

function buildXhrResponse(body: string, responseType: XMLHttpRequestResponseType) {
  if (responseType === "json") {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  if (responseType === "arraybuffer") {
    return new TextEncoder().encode(body).buffer;
  }
  if (responseType === "blob") {
    return new Blob([body], { type: "application/json;charset=utf-8" });
  }
  return body;
}

function patchXhr() {
  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;
  const nativeGetResponseHeader = XMLHttpRequest.prototype.getResponseHeader;
  const nativeGetAllResponseHeaders = XMLHttpRequest.prototype.getAllResponseHeaders;
  const nativeDescriptors = {
    readyState: Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "readyState"),
    status: Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "status"),
    statusText: Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "statusText"),
    responseText: Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "responseText"),
    response: Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "response"),
    responseURL: Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "responseURL"),
  };
  const xhrMeta = new WeakMap<
    XMLHttpRequest,
    {
      method: string;
      url: string;
      async: boolean;
      mockBody?: string;
    }
  >();

  XMLHttpRequest.prototype.open = function open(
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    xhrMeta.set(this, {
      method,
      url: new URL(String(url), window.location.href).href,
      async: async ?? true,
    });
    return nativeOpen.call(this, method, url, async ?? true, username, password);
  };

  XMLHttpRequest.prototype.send = function send(body) {
    const meta = xhrMeta.get(this);
    if (!meta) {
      return nativeSend.call(this, body);
    }

    const sendRequest = () => {
      const latestMeta = xhrMeta.get(this);
      if (!latestMeta) {
        return nativeSend.call(this, body);
      }

      const mock = findMock(latestMeta.url);
      if (!mock) {
        return nativeSend.call(this, body);
      }

      logMockHit("xhr", latestMeta.url, mock);
      xhrMeta.set(this, { ...latestMeta, mockBody: mock.body });
      window.setTimeout(() => {
        this.dispatchEvent(new Event("readystatechange"));
        this.dispatchEvent(new ProgressEvent("load"));
        this.dispatchEvent(new ProgressEvent("loadend"));
      }, 0);
      return undefined;
    };

    if (!hasInitialState && meta.async) {
      void waitForInitialState().then(sendRequest);
      return undefined;
    }

    return sendRequest();
  };

  XMLHttpRequest.prototype.getResponseHeader = function getResponseHeader(name) {
    const meta = xhrMeta.get(this);
    if (meta?.mockBody !== undefined) {
      const normalizedName = name.toLowerCase();
      if (normalizedName === "content-type") {
        return "application/json;charset=utf-8";
      }
      if (normalizedName === "x-flamingo-mock") {
        return "true";
      }
      return null;
    }
    return nativeGetResponseHeader.call(this, name);
  };

  XMLHttpRequest.prototype.getAllResponseHeaders = function getAllResponseHeaders() {
    const meta = xhrMeta.get(this);
    if (meta?.mockBody !== undefined) {
      return MOCK_HEADERS;
    }
    return nativeGetAllResponseHeaders.call(this);
  };

  const defineGetter = <Name extends keyof typeof nativeDescriptors>(
    name: Name,
    getter: (xhr: XMLHttpRequest) => unknown
  ) => {
    Object.defineProperty(XMLHttpRequest.prototype, name, {
      configurable: true,
      get() {
        const meta = xhrMeta.get(this);
        if (meta?.mockBody !== undefined) {
          return getter(this);
        }
        return nativeDescriptors[name]?.get?.call(this);
      },
    });
  };

  defineGetter("readyState", () => XMLHttpRequest.DONE);
  defineGetter("status", () => 200);
  defineGetter("statusText", () => "OK");
  defineGetter("responseText", (xhr) => xhrMeta.get(xhr)?.mockBody ?? "");
  defineGetter("response", (xhr) =>
    buildXhrResponse(xhrMeta.get(xhr)?.mockBody ?? "", xhr.responseType)
  );
  defineGetter("responseURL", (xhr) => xhrMeta.get(xhr)?.url ?? "");
}

if (!window[INSTALLED_KEY]) {
  window[INSTALLED_KEY] = true;
  window.addEventListener("message", (event) => {
    if (
      event.source === window &&
      event.data?.source === MESSAGE_SOURCE &&
      event.data?.type === MESSAGE_STATE
    ) {
      mockState = event.data.payload as MockStatePayload;
      resolveInitialStateWaiters();
    }
  });
  patchFetch();
  patchXhr();
  window.postMessage(
    {
      source: MESSAGE_SOURCE,
      type: MESSAGE_REQUEST_STATE,
    },
    window.location.origin
  );
}

export {};
