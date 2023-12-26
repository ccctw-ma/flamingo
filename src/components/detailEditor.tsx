import React, { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { RIGHT_HEADER_HEIGHT, jsonSchema } from "../utils/constants";
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
import Editor, { loader, Monaco } from "@monaco-editor/react";
loader.config({ monaco });
// import typia from "typia";
// const typeCheckRes = typia.validate<Group | Rule>(newEdit);
//       if (!typeCheckRes.success) {
//         throw typeCheckRes.errors;
//       }

export default function DetailEditor(props: { width: number }) {
  const { type, setEdit, edit, setEditType, setHasError } = useGlobalState();
  const { setIsSaved } = useFlag();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const filterEditContent = (edit: any) => {
    let filterEdit = deepClone(edit);
    if (type === TYPE.Rule) {
      removeKeys(filterEdit);
    } else {
      (filterEdit as Group).rules?.forEach((rule) => removeKeys(rule));
      filterEdit = filterEdit.rules;
    }
    return filterEdit;
  };

  const addRemoveKeys = (o: any, cur: any) => {
    if (type === TYPE.Rule) {
      addKeys(o, cur);
    } else {
      let newGroup: any = {};
      addKeys(o, cur);
      o.forEach((rule: any) => {
        rule.id = generateId();
        rule.name = "";
        rule.create = Date.now();
        rule.update = Date.now();
        rule.enable = true;
      });
      newGroup.rules = o;
    }
    return o;
  };

  const handleChange = (value: string | undefined = "", _e: any) => {
    let newEdit;
    try {
      const obj = str2obj(value);
      newEdit = addRemoveKeys(obj, edit);
      setEdit(newEdit);
      
      // TODO handle 
    } catch (err) {
      console.log(err);
      setHasError(!!err);
    } finally {
      setIsSaved(false);
    }
  };

  function handleValidate(makers: editor.IMarker[]) {
    console.log(makers);
    setHasError(makers.length > 0);
  }

  useEffect(() => {
    loader
      .init()
      .then((monaco) => {
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions(jsonSchema);
      })
      .catch((err) => {
        console.warn("Error setting json schema");
        console.error(err);
      });
  }, []);

  return (
    <Editor
      height={`calc(100% - ${RIGHT_HEADER_HEIGHT + 1}px)`}
      width={props.width}
      language="json"
      theme={"vs-light"}
      value={obj2str(filterEditContent(edit))}
      onChange={handleChange}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        editorRef.current.focus();
      }}
      onValidate={handleValidate}
      options={{
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
      }}
    />
  );
}
