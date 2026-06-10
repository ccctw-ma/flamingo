import { Button, Checkbox, Dropdown, Empty, Input, Input as AntInput } from "antd";
import type { MenuProps } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import Item from "../components/item";
import Hint from "../components/hint";
import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { deepClone, generateId } from "../utils";
import { useI18n } from "../utils/i18n";
import { STATUS, Rule, TYPE } from "../utils/types";
import { addRule, setLocalSelected, setRules as persistRules } from "../utils/storage";
import { EMPTY_RULE } from "../utils/constants";
import { useGlobalState } from "../utils/hooks";

type SidebarMode = "idle" | "add" | "search";
type AddTarget = "rule" | "group";
type DragPayload = { type: "rule"; id: number } | { type: "group"; id: number };

export default function LeftBar() {
  const { rules, refresh, selected, setRules, setSelected, setType, type } = useGlobalState();
  const { t } = useI18n();
  const [mode, setMode] = useState<SidebarMode>("idle");
  const [addTarget, setAddTarget] = useState<AddTarget>("rule");
  const [draftName, setDraftName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<STATUS>(STATUS.NONE);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(() => new Set());
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [openGroupMenuId, setOpenGroupMenuId] = useState<number | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  const activeItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return normalizedQuery
      ? rules.filter((item) =>
          `${item.groupName ?? ""} ${item.name}`.toLowerCase().includes(normalizedQuery)
        )
      : rules;
  }, [rules, searchQuery]);

  const groupedItems = useMemo(() => {
    const entries: Array<
      | { type: "rule"; rule: Rule }
      | { type: "group"; groupId: number; groupName: string; groupEnabled: boolean; rules: Rule[] }
    > = [];
    const consumed = new Set<number>();

    for (const rule of activeItems) {
      if (!rule.groupId) {
        entries.push({ type: "rule", rule });
        continue;
      }
      if (consumed.has(rule.groupId)) {
        continue;
      }
      const groupRules = activeItems.filter((item) => item.groupId === rule.groupId);
      groupRules.forEach((item) => consumed.add(item.groupId!));
      entries.push({
        type: "group",
        groupId: rule.groupId,
        groupName: rule.groupName || t("aiGeneratedGroup"),
        groupEnabled: groupRules.some((item) => item.groupEnabled !== false),
        rules: groupRules,
      });
    }

    return entries;
  }, [activeItems, t]);

  async function handleAdd() {
    const nextName = draftName.trim();
    if (!nextName) {
      setStatus(STATUS.ERROR);
      setTimeout(() => {
        setStatus(STATUS.NONE);
      }, 1000);
      return;
    }

    if (addTarget === "group") {
      const groupId = generateId();
      await addRule({
        ...EMPTY_RULE,
        name: t("groupDefaultRule"),
        id: generateId(),
        groupId,
        groupName: nextName,
        groupEnabled: false,
        create: Date.now(),
        update: Date.now(),
      });
    } else {
      await addRule({
        ...EMPTY_RULE,
        name: nextName,
        id: generateId(),
        create: Date.now(),
        update: Date.now(),
      });
    }
    setDraftName("");
    setMode("idle");
    await refresh();
  }

  useEffect(() => {
    if (mode !== "search") {
      setSearchQuery("");
    }
    if (mode !== "add") {
      setDraftName("");
    }
    setStatus(STATUS.NONE);
  }, [mode]);

  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) {
      return;
    }

    const syncCompactState = () => {
      setIsCompact(pane.clientWidth < 180);
    };
    syncCompactState();

    const resizeObserver = new ResizeObserver(syncCompactState);
    resizeObserver.observe(pane);
    return () => resizeObserver.disconnect();
  }, []);

  const currentInput = mode === "add" ? draftName : searchQuery;
  const isSearchMode = searchQuery.trim().length > 0;

  const parseDragPayload = (value: string): DragPayload | null => {
    if (value.startsWith("group:")) {
      const id = Number(value.slice("group:".length));
      return Number.isFinite(id) ? { type: "group", id } : null;
    }
    const id = Number(value);
    return Number.isFinite(id) ? { type: "rule", id } : null;
  };

  const moveRule = async (draggedId: number, targetId: number) => {
    if (draggedId === targetId) {
      return;
    }

    const fromIndex = rules.findIndex((rule) => rule.id === draggedId);
    const toIndex = rules.findIndex((rule) => rule.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const nextRules = [...rules];
    const [draggedRule] = nextRules.splice(fromIndex, 1);
    nextRules.splice(toIndex, 0, draggedRule);

    await persistRules(nextRules);
    setRules(nextRules);
    setDropTargetId(null);
    setDraggingId(null);
    await refresh();
  };

  const moveGroup = async (draggedGroupId: number, targetRuleId: number) => {
    const movingRules = rules.filter((rule) => rule.groupId === draggedGroupId);
    if (!movingRules.length) {
      setDropTargetId(null);
      setDraggingId(null);
      return;
    }

    if (movingRules.some((rule) => rule.id === targetRuleId)) {
      setDropTargetId(null);
      setDraggingId(null);
      return;
    }

    const remainingRules = rules.filter((rule) => rule.groupId !== draggedGroupId);
    const targetIndex = remainingRules.findIndex((rule) => rule.id === targetRuleId);
    if (targetIndex < 0) {
      setDropTargetId(null);
      setDraggingId(null);
      return;
    }

    const nextRules = [...remainingRules];
    nextRules.splice(targetIndex, 0, ...movingRules);
    await persistRules(nextRules);
    setRules(nextRules);
    setDropTargetId(null);
    setDraggingId(null);
    await refresh();
  };

  const handleDropPayload = (payload: DragPayload | null, targetId: number) => {
    if (!payload) {
      return;
    }
    if (payload.type === "group") {
      void moveGroup(payload.id, targetId);
    } else {
      void moveRule(payload.id, targetId);
    }
  };

  const toggleGroupCollapse = (groupId: number) => {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const selectGroupFirstRule = async (groupRules: Rule[]) => {
    const firstRule = groupRules[0];
    if (!firstRule) {
      return;
    }
    await setLocalSelected(TYPE.Rule, firstRule);
    setType(TYPE.Rule);
    setSelected(firstRule);
  };

  const updateGroupEnabled = async (groupId: number, enabled: boolean) => {
    const nextRules = rules.map((rule) =>
      rule.groupId === groupId ? { ...rule, groupEnabled: enabled, update: Date.now() } : rule
    );
    await persistRules(nextRules);
    setRules(nextRules);
    await refresh();
  };

  const renameGroup = async (groupId: number, groupName: string) => {
    const nextName = groupName.trim();
    if (!nextName) {
      setEditingGroupId(null);
      return;
    }

    const nextRules = rules.map((rule) =>
      rule.groupId === groupId ? { ...rule, groupName: nextName, update: Date.now() } : rule
    );
    await persistRules(nextRules);
    setRules(nextRules);
    setEditingGroupId(null);
    await refresh();
  };

  const duplicateGroup = async (groupId: number, groupName: string) => {
    const groupRules = rules.filter((rule) => rule.groupId === groupId);
    if (!groupRules.length) {
      return;
    }

    const nextGroupId = generateId();
    const copiedRules = groupRules.map((rule, index) => ({
      ...deepClone(rule),
      id: generateId() + index,
      groupId: nextGroupId,
      groupName: `${groupName} ${t("copySuffix")}`,
      create: Date.now(),
      update: Date.now(),
    }));
    const lastIndex = rules.reduce(
      (matchedIndex, rule, index) => (rule.groupId === groupId ? index : matchedIndex),
      -1
    );
    const nextRules = [...rules];
    nextRules.splice(lastIndex + 1, 0, ...copiedRules);
    await persistRules(nextRules);
    setRules(nextRules);
    await refresh();
  };

  const deleteGroup = async (groupId: number) => {
    const nextRules = rules.filter((rule) => rule.groupId !== groupId);
    await persistRules(nextRules);
    setRules(nextRules);
    await refresh();
  };

  const groupMenuItems: MenuProps["items"] = [
    {
      key: "copy",
      icon: <CopyOutlined />,
      label: t("copyRule"),
    },
    {
      key: "edit",
      icon: <EditOutlined />,
      label: t("editRule"),
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: t("deleteRule"),
      danger: true,
    },
  ];

  const addMenuItems: MenuProps["items"] = [
    {
      key: "rule",
      label: t("addRule"),
    },
    {
      key: "group",
      label: t("addGroup"),
    },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden" ref={paneRef}>
      <div className={`sidebar-pane ${isCompact ? "sidebar-pane-collapsed" : ""}`}>
        <div className="sidebar-tools sidebar-tools-compact">
          <div className="sidebar-icon-row">
            <Dropdown
              trigger={["click"]}
              placement="bottomLeft"
              overlayClassName="flamingo-list-menu"
              menu={{
                items: addMenuItems,
                onClick: ({ key }) => {
                  setAddTarget(key === "group" ? "group" : "rule");
                  setMode("add");
                },
              }}
            >
              <span>
                <Hint title={t("add")} placement="bottom">
                  <Button
                    shape="circle"
                    type={mode === "add" ? "primary" : "text"}
                    icon={<PlusOutlined />}
                    aria-label={t("add")}
                  />
                </Hint>
              </span>
            </Dropdown>
            <Hint title={t("search")} placement="bottom">
              <Button
                shape="circle"
                type={mode === "search" ? "primary" : "text"}
                icon={<SearchOutlined />}
                aria-label={t("search")}
                onClick={() => setMode(mode === "search" ? "idle" : "search")}
              />
            </Hint>
          </div>
          {mode !== "idle" ? (
            <div className="sidebar-command sidebar-command-compact">
              <Input
                placeholder={
                  mode === "add"
                    ? t("addEntityPlaceholder", {
                        entity: addTarget === "group" ? t("ruleGroup") : t("rule"),
                      })
                    : t("searchEntityPlaceholder", { entity: t("rule") })
                }
                onPressEnter={() => {
                  if (mode === "add") {
                    void handleAdd();
                  }
                }}
                value={currentInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setStatus(STATUS.NONE);
                  if (mode === "add") {
                    setDraftName(value);
                  } else {
                    setSearchQuery(value);
                  }
                }}
                status={status}
                size="middle"
                variant="filled"
                autoFocus
              />
              {mode === "add" ? (
                <Hint title={t("add")} placement="bottom">
                  <Button
                    shape="circle"
                    type="primary"
                    icon={<CheckOutlined />}
                    aria-label={t("add")}
                    onClick={() => void handleAdd()}
                  />
                </Hint>
              ) : (
                <Hint title={t("clear")} placement="bottom">
                  <Button
                    shape="circle"
                    icon={<CloseOutlined />}
                    aria-label={t("clear")}
                    onClick={() => setMode("idle")}
                  />
                </Hint>
              )}
            </div>
          ) : null}
        </div>
        <div className="sidebar-list no-scrollbar">
          {activeItems.length > 0 ? (
            groupedItems.map((entry, entryIndex) => {
              if (entry.type === "rule") {
                const val = entry.rule;
                return (
                  <Item
                    key={val.id}
                    item={val}
                    index={entryIndex + 1}
                    compact={isCompact}
                    draggable={!isSearchMode}
                    isDragging={draggingId === val.id}
                    isDropTarget={dropTargetId === val.id && draggingId !== val.id}
                    onDragStart={(event: DragEvent<HTMLSpanElement>) => {
                      if (isSearchMode) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", String(val.id));
                      setDraggingId(val.id);
                    }}
                    onDragOver={(event: DragEvent<HTMLDivElement>) => {
                      if (isSearchMode || draggingId === null || draggingId === val.id) {
                        return;
                      }
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDropTargetId(val.id);
                    }}
                    onDrop={(event: DragEvent<HTMLDivElement>) => {
                      event.preventDefault();
                      handleDropPayload(
                        parseDragPayload(event.dataTransfer.getData("text/plain")),
                        val.id
                      );
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDropTargetId(null);
                    }}
                  />
                );
              }

              const collapsed = isCompact || collapsedGroups.has(entry.groupId);
              const isGroupActive =
                type === TYPE.Rule && entry.rules.some((rule) => rule.id === selected?.id);
              return (
                <div className="rule-folder" key={`group-${entry.groupId}`}>
                  <div
                    className={`rule-folder-row ${
                      isGroupActive ? "rule-folder-row-active" : ""
                    } ${dropTargetId === entry.groupId ? "rule-folder-drop-target" : ""}`}
                    role="button"
                    tabIndex={0}
                    onDragOver={(event: DragEvent<HTMLDivElement>) => {
                      if (isSearchMode || draggingId === null || draggingId === entry.groupId) {
                        return;
                      }
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDropTargetId(entry.groupId);
                    }}
                    onDrop={(event: DragEvent<HTMLDivElement>) => {
                      event.preventDefault();
                      const firstTargetRule = entry.rules[0];
                      if (!firstTargetRule) {
                        return;
                      }
                      handleDropPayload(
                        parseDragPayload(event.dataTransfer.getData("text/plain")),
                        firstTargetRule.id
                      );
                    }}
                    onClick={() => {
                      void selectGroupFirstRule(entry.rules);
                      toggleGroupCollapse(entry.groupId);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void selectGroupFirstRule(entry.rules);
                        toggleGroupCollapse(entry.groupId);
                      }
                    }}
                  >
                    <Checkbox
                      checked={entry.groupEnabled}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        void updateGroupEnabled(entry.groupId, event.target.checked)
                      }
                    />
                    <span className="rule-folder-index" aria-hidden={!isCompact}>
                      {entryIndex + 1}
                    </span>
                    {editingGroupId === entry.groupId ? (
                      <AntInput
                        value={groupNameDraft}
                        size="small"
                        variant="filled"
                        className="rule-folder-input"
                        autoFocus
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => setGroupNameDraft(event.target.value)}
                        onBlur={() => void renameGroup(entry.groupId, groupNameDraft)}
                        onPressEnter={() => void renameGroup(entry.groupId, groupNameDraft)}
                      />
                    ) : (
                      <span className="rule-folder-content">
                        <span className="rule-folder-name">{entry.groupName}</span>
                      </span>
                    )}
                    <Dropdown
                      trigger={["click"]}
                      placement="bottomRight"
                      open={openGroupMenuId === entry.groupId}
                      onOpenChange={(open) => setOpenGroupMenuId(open ? entry.groupId : null)}
                      overlayClassName="flamingo-list-menu"
                      menu={{
                        items: groupMenuItems,
                        onClick: ({ key, domEvent }) => {
                          domEvent.stopPropagation();
                          setOpenGroupMenuId(null);
                          if (key === "copy") {
                            void duplicateGroup(entry.groupId, entry.groupName);
                          } else if (key === "edit") {
                            setEditingGroupId(entry.groupId);
                            setGroupNameDraft(entry.groupName);
                          } else if (key === "delete") {
                            void deleteGroup(entry.groupId);
                          }
                        },
                      }}
                    >
                      <span
                        className={`item-handle rule-folder-handle ${
                          openGroupMenuId === entry.groupId ? "is-active" : ""
                        }`}
                        role="button"
                        aria-label={t("moreActions")}
                        draggable={!isSearchMode}
                        onClick={(event) => event.stopPropagation()}
                        onDragStart={(event) => {
                          if (isSearchMode) {
                            event.preventDefault();
                            return;
                          }
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", `group:${entry.groupId}`);
                          setDraggingId(entry.groupId);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDropTargetId(null);
                        }}
                      >
                        <HolderOutlined />
                      </span>
                    </Dropdown>
                  </div>
                  {!collapsed ? (
                    <div className="rule-folder-children">
                      {entry.rules.map((val, childIndex) => (
                        <Item
                          key={val.id}
                          item={val}
                          index={childIndex + 1}
                          compact={isCompact}
                          hideGroupLabel
                          draggable={!isSearchMode}
                          isDragging={draggingId === val.id}
                          isDropTarget={dropTargetId === val.id && draggingId !== val.id}
                          onDragStart={(event: DragEvent<HTMLSpanElement>) => {
                            if (isSearchMode) {
                              event.preventDefault();
                              return;
                            }
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", String(val.id));
                            setDraggingId(val.id);
                          }}
                          onDragOver={(event: DragEvent<HTMLDivElement>) => {
                            if (isSearchMode || draggingId === null || draggingId === val.id) {
                              return;
                            }
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            setDropTargetId(val.id);
                          }}
                          onDrop={(event: DragEvent<HTMLDivElement>) => {
                            event.preventDefault();
                            handleDropPayload(
                              parseDragPayload(event.dataTransfer.getData("text/plain")),
                              val.id
                            );
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDropTargetId(null);
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="sidebar-empty">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={searchQuery ? t("noResults") : t("noItems")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
