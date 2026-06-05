import type { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { addKeys, generateId, str2obj } from "../utils";
import { useFlag } from "../utils/store";
import { useGlobalState } from "../utils/hooks";
import { Group, Rule, TYPE } from "../utils/types";
import MonacoEditor from "./monacoEditor";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRuleLike(value: unknown): value is Rule {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.create === "number" &&
    typeof value.update === "number" &&
    typeof value.enable === "boolean" &&
    isRecord(value.action) &&
    isRecord(value.condition)
  );
}

function isGroupLike(value: unknown): value is Group {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.create === "number" &&
    typeof value.update === "number" &&
    typeof value.enable === "boolean" &&
    Array.isArray(value.rules) &&
    value.rules.every(isRuleLike)
  );
}

export default function DetailEditor(props: { width: number }) {
  const { selected, type, setEdit, edit, setHasError } = useGlobalState();
  const { setIsSaved } = useFlag();

  const restoreEdit = (editString: string): [boolean, Group | Rule] => {
    let jsonParseError = false;
    let typeCheckError = false;
    let newEdit: Group | Rule = { ...edit };
    let editObj: Record<string, unknown> = {};
    try {
      editObj = str2obj<Record<string, unknown>>(editString);
    } catch {
      jsonParseError = true;
    }
    if (!jsonParseError) {
      if (type === TYPE.Rule) {
        addKeys(editObj, edit as unknown as Record<string, unknown>);
      } else {
        const newGroup: Record<string, unknown> = {};
        addKeys(newGroup, edit as unknown as Record<string, unknown>);
        (editObj as unknown as Array<Record<string, unknown>>).forEach((rule) => {
          rule.id = generateId();
          rule.name = "";
          rule.create = Date.now();
          rule.update = Date.now();
          rule.enable = true;
        });
        newGroup.rules = editObj;
        editObj = newGroup;
      }
      const isValid = type === TYPE.Rule ? isRuleLike(editObj) : isGroupLike(editObj);
      if (isValid) {
        newEdit = editObj as unknown as Group | Rule;
      } else {
        typeCheckError = true;
      }
    }
    if (jsonParseError || typeCheckError) {
      newEdit = { ...edit };
    }
    (newEdit as { update: number }).update = Date.now();
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
