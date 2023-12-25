import React, { useRef } from "react";
import MonacoEditor, { monaco } from "react-monaco-editor";
import { RIGHT_HEADER_HEIGHT } from "../utils/constants";
import {
  addKeys,
  deepClone,
  generateId,
  obj2str,
  removeKeys,
  str2obj,
} from "../utils";
import { useFlag } from "../utils/store";
import { useGlobalState } from "../utils/hooks";
import { Group, Rule, TYPE } from "../utils/types";
import typia from "typia";

export default function DetailEditor(props: { width: number }) {
  const { type, setEdit, edit, setEditType } = useGlobalState();
  const { setIsSaved } = useFlag();
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();

  const filterEditContent = (edit: any) => {
    const filterEdit = deepClone(edit);
    removeKeys(filterEdit);
    if (type === TYPE.Group) {
      (filterEdit as Group).rules.forEach(removeKeys);
    }
    return filterEdit;
  };

  const addRemoveKeys = (o: any, cur: any) => {
    addKeys(o, cur);
    if (type === TYPE.Group) {
      (o as Group).rules.forEach((rule) => {
        rule.id = generateId();
        rule.name = "";
        rule.create = Date.now();
        rule.update = Date.now();
        rule.enable = true;
      });
    }
    return o;
  };

  const handleChange = (value: string, _e: any) => {
    let newEdit;
    try {
      const obj = str2obj(value);
      newEdit = addRemoveKeys(obj, edit);
      const typeCheckRes = typia.validate<Group | Rule>(newEdit);
      if (!typeCheckRes.success) {
        throw typeCheckRes.errors;
      }
      setEdit(newEdit);
      setEditType(type);
      setIsSaved(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MonacoEditor
      height={`calc(100% - ${RIGHT_HEADER_HEIGHT + 1}px)`}
      width={props.width}
      language="json"
      theme={"vs-light"}
      value={obj2str(filterEditContent(edit))}
      onChange={handleChange}
      editorDidMount={(_editor, _monaco) => {
        editor.current = _editor;
        editor.current.focus();
      }}
      options={{
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
      }}
    />
  );
}
