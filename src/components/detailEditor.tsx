import React from "react";
import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { addKeys, generateId, str2obj } from "../utils";
import { useFlag } from "../utils/store";
import { useGlobalState } from "../utils/hooks";
import { Group, Rule, TYPE } from "../utils/types";
import { loader } from "@monaco-editor/react";
loader.config({ monaco });
import typia from "typia";
import MonacoEditor from "./monacoEditor";

export default function DetailEditor(props: { width: number }) {
  const { selected, type, setEdit, edit, setHasError } = useGlobalState();
  const { setIsSaved } = useFlag();

  const restoreEdit = (editString: string): [boolean, Group | Rule] => {
    let jsonParseError = false,
      typeCheckError = false,
      newEdit: any = {};
    let editObj: any = {};
    try {
      editObj = str2obj(editString);
    } catch {
      jsonParseError = true;
    }
    if (!jsonParseError) {
      if (type === TYPE.Rule) {
        addKeys(editObj, edit);
      } else {
        let newGroup: any = {};
        addKeys(newGroup, edit);
        editObj.forEach((rule: any) => {
          rule.id = generateId();
          rule.name = "";
          rule.create = Date.now();
          rule.update = Date.now();
          rule.enable = true;
        });
        newGroup.rules = editObj;
        editObj = newGroup;
      }
      const validated = typia.validate<Group | Rule>(editObj);
      if (validated.success) {
        newEdit = editObj;
      } else {
        typeCheckError = true;
      }
    }
    if (jsonParseError || typeCheckError) {
      newEdit = { ...edit };
    }
    newEdit.update = Date.now();
    return [jsonParseError || typeCheckError, newEdit];
  };

  const handleChange = (value: string) => {
    const [hasError, newEdit] = restoreEdit(value);
    setIsSaved(false);
    setHasError(hasError);
    setEdit(newEdit);
  };

  const handleError = (error: editor.IMarker[]) => {
    console.error(error);
    // setHasError(error.length > 0);
  };

  return (
    <MonacoEditor
      width={props.width}
      type={type}
      onChange={handleChange}
      onError={handleError}
      selected={selected}
    />
  );
}
