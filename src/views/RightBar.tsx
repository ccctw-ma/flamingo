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
import RuleEditor from "../components/ruleEditor";
import { Breadcrumb, Divider, Switch } from "antd";
import { RIGHT_HEADER_HEIGHT } from "../utils/constants";
import {
  ArrowsAltOutlined,
  CodeOutlined,
  PoweroffOutlined,
  ShrinkOutlined,
} from "@ant-design/icons";
import { TYPE } from "../utils/types";
import GroupEditor from "../components/groupEditor";

const RightBar = forwardRef((props: { width: number }, ref) => {
  const [containerWidth, setContainerWidth] = useState<number>(props.width);
  const { type, selected } = useSelected();
  const [isDetail, setIsDetail] = useState(false);
  const [isWorking, setIsWorking] = useState(true);
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
      <div
        style={{
          height: RIGHT_HEADER_HEIGHT,
        }}
        className="flex justify-between items-center px-6"
      >
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
          className="flex-1"
        />

        {isDetail ? (
          <ArrowsAltOutlined
            style={{ marginRight: "16px", fontSize: "16px", cursor: "pointer" }}
            title="Detail Mode"
            onClick={() => setIsDetail(false)}
          />
        ) : (
          <ShrinkOutlined
            style={{ marginRight: "16px", fontSize: "16px", cursor: "pointer" }}
            title="Compact Mode"
            onClick={() => setIsDetail(true)}
          />
        )}
        <PoweroffOutlined
          className="transition-all"
          style={{ color: `${isWorking ? "red" : ""}`, fontSize: "16px" }}
          title={`${isWorking ? "Off" : "On"}`}
          onClick={() => setIsWorking((v) => !v)}
        />
      </div>
      <Divider style={{ marginTop: 0, marginBottom: 0 }} />
      {isDetail ? (
        <MonacoEditor
          height={`calc(100% - ${RIGHT_HEADER_HEIGHT + 1}px)`}
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
      ) : type === TYPE.Group ? (
        <GroupEditor />
      ) : (
        <RuleEditor />
      )}
    </div>
  );
});

export default RightBar;
