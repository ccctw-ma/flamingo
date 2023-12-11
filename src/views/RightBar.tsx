import * as React from "react";
import { monaco } from "react-monaco-editor";
import { useSelected } from "../utils/store";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { loop } from "../utils";
import RuleEditor from "../components/ruleEditor";
import { Breadcrumb, Switch } from "antd";

const RightBar = forwardRef((props: { width: number }, ref) => {
  const [containerWidth, setContainerWidth] = useState<number>(props.width);
  const { type, selected } = useSelected();
  const [isDetail, setIsDetail] = useState(false);
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
    <div className="w-full h-full overflow-hidden">
      <div className="flex justify-between items-center px-4">
        <Breadcrumb
          separator="/"
          items={[
            {
              title: type,
            },
            {
              title: selected.name,
            },
          ]}
        />
        <Switch
          value={isDetail}
          onChange={(checked) => setIsDetail(checked)}
          title="detail"
        />
      </div>

      <RuleEditor containerWidth={containerWidth} />
      {/* const editor = useRef<monaco.editor.IStandaloneCodeEditor>();

      <MonacoEditor
          height="100%"
          width={props.containerWidth}
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
        /> */}
    </div>
  );
});

export default RightBar;
