import { Button } from "antd";
import * as React from "react";
import MonacoEditor from "react-monaco-editor";
import { useGroup, useSelected } from "../utils/store";
export default function RightBar() {
  const code = JSON.stringify("let x = 10;");

  const { type, selected } = useSelected();
  return (
    <div className="w-full h-full flex justify-center items-center">
      <MonacoEditor
        value={JSON.stringify(selected)}
        language="json"
        theme="vs-dark"
        width={500}
        height={500}
        onChange={(val, e) => {
          // console.log(val, e);
          // console.log(JSON.parse(val));
        }}
      />
    </div>
  );
}
