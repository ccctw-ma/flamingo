import { Checkbox, Dropdown, Input as AntInput } from "antd";
import type { MenuProps } from "antd";
import { DragEventHandler, useEffect, useState } from "react";
import { CopyOutlined, DeleteOutlined, EditOutlined, HolderOutlined } from "@ant-design/icons";
import { useI18n } from "../utils/i18n";
import { Rule, TYPE } from "../utils/types";
import {
  deleteRule,
  setLocalSelected,
  setRules as persistRules,
  updateRules,
} from "../utils/storage";
import { useConfig, useGlobalState } from "../utils/hooks";
import { deepClone, generateId } from "../utils";

interface Props {
  item: Rule;
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: DragEventHandler<HTMLSpanElement>;
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDrop?: DragEventHandler<HTMLDivElement>;
  onDragEnd?: DragEventHandler<HTMLSpanElement>;
}

export default function Item(props: Props) {
  const {
    item: current,
    draggable = false,
    isDragging = false,
    isDropTarget = false,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
  } = props;
  const { type, selected, setType, setSelected, rules, refresh, saveEdit } = useGlobalState();
  const { LEFT_TAB_ITEM_HEIGHT } = useConfig();
  const { t } = useI18n();
  // item built-in states
  const [isEdit, setIsEdit] = useState(false);
  const [name, setName] = useState(current.name);
  const [checked, setChecked] = useState(current.enable);
  const [menuOpen, setMenuOpen] = useState(false);

  const deleteItem = async (item: Rule) => {
    await saveEdit();
    await deleteRule(item);
    const remaining = rules.filter((r) => r.id !== item.id);
    await setLocalSelected(TYPE.Rule, remaining[0] ?? null);
    refresh();
  };

  const updateItem = async (item: Rule) => {
    await saveEdit();
    await updateRules({ ...item, update: Date.now() });
    refresh();
  };

  const duplicateItem = async (item: Rule) => {
    await saveEdit();
    const ruleCopy: Rule = {
      ...deepClone(item),
      id: generateId(),
      name: item.name ? `${item.name} ${t("copySuffix")}` : t("copyRule"),
      create: Date.now(),
      update: Date.now(),
    };
    const currentIndex = rules.findIndex((rule) => rule.id === item.id);
    const nextRules = [...rules];
    nextRules.splice(currentIndex + 1, 0, ruleCopy);
    await persistRules(nextRules);
    await setLocalSelected(TYPE.Rule, ruleCopy);
    await refresh();
  };

  useEffect(() => {
    if (selected?.id === current.id) {
      setName(selected.name);
      setChecked(selected.enable);
    } else {
      setIsEdit(false);
    }
  }, [current.id, selected]);

  const isActive = selected?.id === current.id && type === TYPE.Rule;

  const menuItems: MenuProps["items"] = [
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

  const handleMenuClick: MenuProps["onClick"] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    setMenuOpen(false);
    if (key === "copy") {
      void duplicateItem(current);
    } else if (key === "edit") {
      setIsEdit(true);
    } else if (key === "delete") {
      void deleteItem(current);
    }
  };

  return (
    <div
      style={{ minHeight: LEFT_TAB_ITEM_HEIGHT }}
      className={`item-row group ${isActive ? "item-row-active" : ""} ${isDragging ? "item-row-dragging" : ""} ${
        isDropTarget ? "item-row-drop-target" : ""
      }`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => {
        setLocalSelected(TYPE.Rule, current);
        setType(TYPE.Rule);
        setSelected(current);
      }}
      title={name || t("untitled")}
    >
      <Checkbox
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
          updateItem({ ...current, enable: e.target.checked });
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />
      {isEdit ? (
        <AntInput
          value={name}
          size="small"
          variant="filled"
          className="mx-1 flex-1"
          autoFocus
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            setName(e.target.value);
          }}
          onBlur={() => {
            updateItem({ ...current, name });
            setIsEdit(false);
          }}
          onPressEnter={() => {
            updateItem({ ...current, name });
            setIsEdit(false);
          }}
        />
      ) : (
        <span className="item-name flex-1 truncate text-sm font-semibold text-slate-800">
          {name || t("untitled")}
        </span>
      )}
      <Dropdown
        trigger={["click"]}
        placement="bottomRight"
        open={menuOpen}
        onOpenChange={setMenuOpen}
        overlayClassName="flamingo-list-menu"
        menu={{ items: menuItems, onClick: handleMenuClick }}
      >
        <span
          className={`item-handle ${isActive ? "is-visible" : ""} ${menuOpen ? "is-active" : ""}`}
          role="button"
          aria-label={t("moreActions")}
          draggable={draggable}
          onClick={(event) => event.stopPropagation()}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <HolderOutlined />
        </span>
      </Dropdown>
    </div>
  );
}
