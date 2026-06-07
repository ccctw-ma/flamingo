import { useMemo } from "react";
import { useConfig } from "./hooks";

export type Locale = "zh-CN" | "en";
type TranslationKey = keyof typeof messages.en;
type TranslationParams = Record<string, string | number>;

const messages = {
  en: {
    rule: "Rule",
    add: "Add",
    search: "Search",
    orderByName: "Name A-Z",
    orderByCreate: "Recently Created",
    orderByUpdate: "Recently Updated",
    addEntityPlaceholder: "Add a {entity}",
    searchEntityPlaceholder: "Search a {entity}",
    untitled: "Untitled",
    saved: "Saved",
    savePending: "Save Pending",
    switchCompactMode: "Switch to compact mode",
    switchDetailMode: "Switch to detail mode",
    disableRuleEngine: "Disable rule engine",
    enableRuleEngine: "Enable rule engine",
    openStandalone: "Open standalone",
    clearCurrentData: "Clear current data",
    actionType: "Action Type",
    condition: "Condition",
    redirect: "Redirect",
    requestHeaders: "Request Headers",
    responseHeaders: "Response Headers",
    addHeaderOperation: "Add Header Operation",
    deleteThisItem: "Delete this item",
    editRule: "Edit Rule",
    addExistingRule: "Add Existing Rule",
    exportRule: "Export",
    deleteRule: "Delete",
    addRule: "Add rule",
    exportSuccessful: "Export successful",
    exportFailed: "Export failed",
    itemsCount: "{count} items",
    tab: "Tab",
    time: "Time",
    deleteEntityTitle: "Delete {entity}",
    deleteEntityDescription: "Are you sure to delete this {entity}?",
    yes: "Yes",
    no: "No",
    loadingEditor: "Loading editor...",
    settings: "Settings",
    settingsTitle: "Preferences",
    language: "Language",
    languageDescription: "Switch popup language immediately.",
    chinese: "Chinese",
    english: "English",
    storageMode: "Storage",
    storageModeDescription:
      "Choose whether your rules stay on this browser or sync through your Chrome account.",
    localStorage: "Local Only",
    syncStorage: "Chrome Sync",
    storageSwitchHint:
      "Switching mode copies current rules and key settings into the selected storage.",
    currentStorageLocal: "Current mode: local only",
    currentStorageSync: "Current mode: Chrome sync",
    panelSize: "Panel Size",
    panelSizeDescription:
      "Use the current default width and height for the first launch, then customize later openings here. Chrome popup sizes are kept within 640-800px wide and 420-600px tall.",
    panelWidth: "Width",
    panelHeight: "Height",
    panelSizeSave: "Apply Size",
    panelSizeSaved: "Panel size updated",
    sortBy: "Sort By",
    clear: "Clear",
    copyRule: "Copy Rule",
    copySuffix: "Copy",
    dragToReorder: "Drag to reorder",
    moreActions: "Drag to reorder, click for actions",
    noResults: "No matching items",
    noItems: "No items yet",
    listTools: "List Tools",
    emptySelection: "No rule selected. Add one from the left.",
    actionRedirect: "Redirect",
    actionModifyHeaders: "Modify Headers",
    actionBlock: "Block",
    actionAllow: "Allow",
    actionAllowAllRequests: "Allow All Requests",
    headerOpSet: "Set",
    headerOpAppend: "Append",
    headerOpRemove: "Remove",
  },
  "zh-CN": {
    rule: "规则",
    add: "新增",
    search: "搜索",
    orderByName: "名称 A-Z",
    orderByCreate: "最近创建",
    orderByUpdate: "最近更新",
    addEntityPlaceholder: "新增一个{entity}",
    searchEntityPlaceholder: "搜索{entity}",
    untitled: "未命名",
    saved: "已保存",
    savePending: "待保存",
    switchCompactMode: "切换到紧凑模式",
    switchDetailMode: "切换到详情模式",
    disableRuleEngine: "关闭规则引擎",
    enableRuleEngine: "开启规则引擎",
    openStandalone: "在新标签页中打开",
    clearCurrentData: "清空当前数据",
    actionType: "动作类型",
    condition: "匹配条件",
    redirect: "重定向",
    requestHeaders: "请求头修改",
    responseHeaders: "响应头修改",
    addHeaderOperation: "新增 Header 操作",
    deleteThisItem: "删除当前项",
    editRule: "编辑规则",
    addExistingRule: "添加现有规则",
    exportRule: "导出",
    deleteRule: "删除",
    addRule: "添加规则",
    exportSuccessful: "导出成功",
    exportFailed: "导出失败",
    itemsCount: "{count} 条",
    tab: "标签页",
    time: "时间",
    deleteEntityTitle: "删除{entity}",
    deleteEntityDescription: "确认删除这个{entity}吗？",
    yes: "确认",
    no: "取消",
    loadingEditor: "编辑器加载中...",
    settings: "设置",
    settingsTitle: "偏好设置",
    language: "语言",
    languageDescription: "立即切换插件界面的显示语言。",
    chinese: "中文",
    english: "English",
    storageMode: "存储模式",
    storageModeDescription: "选择规则信息仅保存在本机，还是跟随 Chrome 账号跨设备同步。",
    localStorage: "仅本地",
    syncStorage: "Chrome 同步",
    storageSwitchHint: "切换模式时，会把当前规则和关键设置复制到目标存储。",
    currentStorageLocal: "当前模式：仅本地",
    currentStorageSync: "当前模式：Chrome 同步",
    panelSize: "面板尺寸",
    panelSizeDescription:
      "首次打开使用当前默认宽高，之后可以在这里调整后续打开时的面板尺寸。Chrome popup 会限制在宽 640-800px、高 420-600px。",
    panelWidth: "宽度",
    panelHeight: "高度",
    panelSizeSave: "应用尺寸",
    panelSizeSaved: "面板尺寸已更新",
    sortBy: "排序方式",
    clear: "清空",
    copyRule: "复制规则",
    copySuffix: "副本",
    dragToReorder: "拖拽排序",
    moreActions: "拖拽排序，点击查看操作",
    noResults: "没有匹配结果",
    noItems: "还没有内容",
    listTools: "列表工具",
    emptySelection: "还没有选中规则，请从左侧新增。",
    actionRedirect: "重定向（Redirect）",
    actionModifyHeaders: "修改请求/响应头（Modify Headers）",
    actionBlock: "拦截（Block）",
    actionAllow: "放行（Allow）",
    actionAllowAllRequests: "放行全部请求（Allow All Requests）",
    headerOpSet: "设置（Set）",
    headerOpAppend: "追加（Append）",
    headerOpRemove: "删除（Remove）",
  },
} as const;

function normalizeLocale(value: string): Locale {
  return value === "en" ? "en" : "zh-CN";
}

function interpolate(template: string, params?: TranslationParams) {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
}

export function useI18n() {
  const { LOCALE } = useConfig();
  const locale = normalizeLocale(LOCALE);

  const t = useMemo(() => {
    return (key: TranslationKey, params?: TranslationParams) => {
      const message = messages[locale][key] ?? messages.en[key];
      return interpolate(message, params);
    };
  }, [locale]);

  return { locale, t };
}
