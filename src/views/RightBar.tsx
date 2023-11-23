import * as React from "react";
import MonacoEditor, { monaco } from "react-monaco-editor";
import { useSelected } from "../utils/store";
import { useEffect, useRef } from "react";
import { loop } from "../utils";
export default function RightBar() {
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();

  const { type, selected } = useSelected();

  const format = () => {
    const formater = editor.current!.getAction("editor.action.formatDocument");
    loop(
      () => formater?.isSupported(),
      () => formater?.run(),
      2000
    );
  };
  useEffect(() => {
    // format();
  }, [selected]);

  return (
    <div className="w-full h-full flex justify-center items-center">
      <MonacoEditor
        height="100%"
        width="100%"
        language="json"
        theme={"vs-light"}
        value={JSON.stringify(selected, null, "\t")}
        onChange={(value, e) => {
          console.log(value, e);
        }}
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
      ;
    </div>
  );
}
