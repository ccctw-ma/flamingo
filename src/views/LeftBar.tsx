import { Button, Empty, Input } from "antd";
import { CheckOutlined, CloseOutlined, SearchOutlined, PlusOutlined } from "@ant-design/icons";
import Item from "../components/item";
import Hint from "../components/hint";
import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { generateId } from "../utils";
import { useI18n } from "../utils/i18n";
import { STATUS, Rule } from "../utils/types";
import { addRule, setRules as persistRules } from "../utils/storage";
import { EMPTY_RULE } from "../utils/constants";
import { useGlobalState } from "../utils/hooks";

type SidebarMode = "idle" | "add" | "search";

export default function LeftBar() {
  const { rules, refresh, setRules } = useGlobalState();
  const { t } = useI18n();
  const [mode, setMode] = useState<SidebarMode>("idle");
  const [draftName, setDraftName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<STATUS>(STATUS.NONE);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  const activeItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return normalizedQuery
      ? rules.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
      : rules;
  }, [rules, searchQuery]);

  async function handleAdd() {
    const nextName = draftName.trim();
    if (!nextName) {
      setStatus(STATUS.ERROR);
      setTimeout(() => {
        setStatus(STATUS.NONE);
      }, 1000);
      return;
    }

    await addRule({
      ...EMPTY_RULE,
      name: nextName,
      id: generateId(),
      create: Date.now(),
      update: Date.now(),
    });
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
      setIsCompact(pane.clientWidth < 132);
    };
    syncCompactState();

    const resizeObserver = new ResizeObserver(syncCompactState);
    resizeObserver.observe(pane);
    return () => resizeObserver.disconnect();
  }, []);

  const currentInput = mode === "add" ? draftName : searchQuery;
  const isSearchMode = searchQuery.trim().length > 0;

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

  return (
    <div className="relative h-full w-full overflow-hidden" ref={paneRef}>
      <div className={`sidebar-pane ${isCompact ? "sidebar-pane-collapsed" : ""}`}>
        <div className="sidebar-tools sidebar-tools-compact">
          <div className="sidebar-icon-row">
            <Hint title={t("add")} placement="bottom">
              <Button
                shape="circle"
                type={mode === "add" ? "primary" : "text"}
                icon={<PlusOutlined />}
                aria-label={t("add")}
                onClick={() => setMode(mode === "add" ? "idle" : "add")}
              />
            </Hint>
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
                    ? t("addEntityPlaceholder", { entity: t("rule") })
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
            activeItems.map((val: Rule, index) => (
              <Item
                key={val.id}
                item={val}
                index={index + 1}
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
                  const draggedId = Number(event.dataTransfer.getData("text/plain"));
                  if (!Number.isFinite(draggedId)) {
                    return;
                  }
                  void moveRule(draggedId, val.id);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDropTargetId(null);
                }}
              />
            ))
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
