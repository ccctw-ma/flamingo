import { CUSTOM_ACTION, EditableModifyHeaderInfo, Rule } from "./types";
import { normalizeRegexFilter } from "./urlPattern";

const DNR_RESOURCE_TYPES = [
  chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
  chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
  chrome.declarativeNetRequest.ResourceType.STYLESHEET,
  chrome.declarativeNetRequest.ResourceType.SCRIPT,
  chrome.declarativeNetRequest.ResourceType.IMAGE,
  chrome.declarativeNetRequest.ResourceType.FONT,
  chrome.declarativeNetRequest.ResourceType.OBJECT,
  chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
  chrome.declarativeNetRequest.ResourceType.PING,
  chrome.declarativeNetRequest.ResourceType.CSP_REPORT,
  chrome.declarativeNetRequest.ResourceType.MEDIA,
  chrome.declarativeNetRequest.ResourceType.WEBSOCKET,
  chrome.declarativeNetRequest.ResourceType.OTHER,
].filter(Boolean);

function toDynamicModifyHeaderInfo(
  header: EditableModifyHeaderInfo
): chrome.declarativeNetRequest.ModifyHeaderInfo {
  const { enabled: _enabled, ...dynamicHeader } = header;
  return dynamicHeader;
}

function toDynamicAction(action: Rule["action"]): chrome.declarativeNetRequest.RuleAction | null {
  if (action.type !== chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS) {
    return action;
  }

  const requestHeaders = (action.requestHeaders as EditableModifyHeaderInfo[] | undefined)
    ?.filter((header) => header.enabled !== false)
    .map(toDynamicModifyHeaderInfo);
  const responseHeaders = (action.responseHeaders as EditableModifyHeaderInfo[] | undefined)
    ?.filter((header) => header.enabled !== false)
    .map(toDynamicModifyHeaderInfo);

  if (!requestHeaders?.length && !responseHeaders?.length) {
    return null;
  }

  return {
    type: action.type,
    ...(requestHeaders?.length ? { requestHeaders } : {}),
    ...(responseHeaders?.length ? { responseHeaders } : {}),
  };
}

export function toDynamicRule(rule: Rule): chrome.declarativeNetRequest.Rule | null {
  if (rule.groupEnabled === false) {
    return null;
  }
  if (rule.uiActionType === CUSTOM_ACTION.MOCK) {
    return null;
  }
  const action = toDynamicAction(rule.action);
  if (!action) {
    return null;
  }

  return {
    action,
    condition: {
      ...rule.condition,
      regexFilter: normalizeRegexFilter(rule.condition.regexFilter ?? ""),
      resourceTypes: DNR_RESOURCE_TYPES,
    },
    id: rule.id,
    priority: rule.priority,
  };
}
