import React, { useEffect, useRef, useState } from "react";
import type { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { ruleSchema } from "../utils/constants";
import { useChange, useConfig } from "../utils/hooks";
import Editor, { loader, Monaco } from "@monaco-editor/react";
import { Rule } from "../utils/types";
import { filterEditContent, obj2str } from "../utils";
import { monaco } from "../utils/monaco";
loader.config({ monaco });

interface Props {
  width: number;
  onChange: (value: string) => void;
  selected: Rule;
  onError: (error: editor.IMarker[]) => void;
}

export default function MonacoEditor(props: Props) {
  const { width, onChange, selected, onError } = props;
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
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions(ruleSchema);
      })
      .catch((err) => {
        console.warn("Error setting json schema");
        console.error(err);
      });
  }, []);

  useEffect(() => {
    const filteredStr = obj2str(filterEditContent(selected));
    setEditContent(filteredStr);
  }, [selected]);

  return (
    <Editor
      height={`calc(100% - ${RIGHT_HEADER_HEIGHT}px)`}
      width={width}
      language="json"
      theme="vs"
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
        automaticLayout: true,
        fontSize: 12,
        lineHeight: 18,
        fontFamily:
          'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        padding: {
          top: 16,
          bottom: 16,
        },
        minimap: {
          enabled: false,
        },
        lineNumbersMinChars: 3,
        roundedSelection: false,
        renderLineHighlight: "line",
        scrollBeyondLastLine: false,
      }}
    />
  );
}
