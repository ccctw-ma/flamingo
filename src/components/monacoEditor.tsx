import React, { useEffect, useRef, useState } from "react";
import type { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { groupSchema, ruleSchema } from "../utils/constants";
import { useChange, useConfig } from "../utils/hooks";
import Editor, { loader, Monaco } from "@monaco-editor/react";
import { Group, Rule, TYPE } from "../utils/types";
import { filterEditContent, obj2str } from "../utils";
import { monaco } from "../utils/monaco";
loader.config({ monaco });

interface Props {
  width: number;
  type: TYPE;
  onChange: (value: string) => void;
  selected: Group | Rule;
  onError: (error: editor.IMarker[]) => void;
}

export default function MonacoEditor(props: Props) {
  const { width, type, onChange, selected, onError } = props;
  const { RIGHT_HEADER_HEIGHT } = useConfig();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const { hasChange, setHasChange, wrapChange } = useChange();
  const [editContent, setEditContent] = useState<string>("");

    useEffect(() => {
      if (!hasChange) {
        return;
      }
      onChange(editContent);
      setHasChange(false);
    }, [editContent, hasChange, onChange, setHasChange]);

  useEffect(() => {
    loader
      .init()
      .then((monaco) => {
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions(
          type === TYPE.Rule ? ruleSchema : groupSchema
        );
      })
      .catch((err) => {
        console.warn("Error setting json schema");
        console.error(err);
      });
  }, [type]);

    useEffect(() => {
    const filteredStr = obj2str(filterEditContent(selected, type));
    setEditContent(filteredStr);
    }, [selected, type]);

  return (
    <Editor
      height={`calc(100% - ${RIGHT_HEADER_HEIGHT + 1}px)`}
      width={width}
      language="json"
      theme={"vs-light"}
      value={editContent}
      /**
       * The onChange event here is an asynchronous event,
       * so setState will not merge
       * !!! amazing
       */
      onChange={(value) => wrapChange(setEditContent)(value ?? "")}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        editorRef.current.focus();
      }}
      onValidate={(makers) => makers.length > 0 && onError(makers)}
      options={{
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
      }}
    />
  );
}
