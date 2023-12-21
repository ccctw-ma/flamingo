import React, { useRef } from "react";
import MonacoEditor, { monaco } from "react-monaco-editor";
import { RIGHT_HEADER_HEIGHT } from "../utils/constants";
import { obj2str, str2obj } from "../utils";
import { useFlag } from "../utils/store";
import { useGlobalState } from "../utils/hooks";

export default function DetailEditor(props: { width: number }) {
  const { type, setEdit, edit, setEditType } = useGlobalState();
  const { setIsSaved } = useFlag();
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();

  const handleChange = (value: string, _e: any) => {
    setIsSaved(false);
    setEdit(str2obj(value));
    setEditType(type);
  };

  return (
    <MonacoEditor
      height={`calc(100% - ${RIGHT_HEADER_HEIGHT + 1}px)`}
      width={props.width}
      language="json"
      theme={"vs-light"}
      value={obj2str(edit)}
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
