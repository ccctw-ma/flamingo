import * as React from "react";
import MonacoEditor, { monaco } from "react-monaco-editor";
import { useSelected } from "../utils/store";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { loop } from "../utils";

const RightBar = forwardRef((props: { width: number }, ref) => {
  const [containerWidth, setContainerWidth] = useState<number>(props.width);
  const { type, selected } = useSelected();
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();

  useImperativeHandle(ref, () => ({
    setContainerWidth,
  }));

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
    <div className="w-full h-full flex justify-center items-center overflow-hidden">
      <MonacoEditor
        height="100%"
        width={containerWidth}
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
    </div>
  );
});

export default RightBar;
