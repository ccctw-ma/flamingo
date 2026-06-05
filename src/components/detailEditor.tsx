import type { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { addKeys, str2obj } from "../utils";
import { useFlag } from "../utils/store";
import { useGlobalState } from "../utils/hooks";
import { Rule } from "../utils/types";
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

export default function DetailEditor(props: { width: number }) {
  const { selected, setEdit, edit, setHasError } = useGlobalState();
  const { setIsSaved } = useFlag();

  const restoreEdit = (editString: string): [boolean, Rule] => {
    let jsonParseError = false;
    let typeCheckError = false;
    let newEdit: Rule = { ...edit } as Rule;
    let editObj: Record<string, unknown> = {};
    try {
      editObj = str2obj<Record<string, unknown>>(editString);
    } catch {
      jsonParseError = true;
    }
    if (!jsonParseError) {
      addKeys(editObj, edit as unknown as Record<string, unknown>);
      const isValid = isRuleLike(editObj);
      if (isValid) {
        newEdit = editObj as unknown as Rule;
      } else {
        typeCheckError = true;
      }
    }
    if (jsonParseError || typeCheckError) {
      newEdit = { ...(edit as Rule) };
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

  if (!selected) {
    return null;
  }

  return (
    <MonacoEditor
      width={props.width}
      onChange={handleChange}
      onError={handleError}
      selected={selected}
    />
  );
}
