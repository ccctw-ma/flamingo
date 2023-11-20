import { Button } from "antd";
import * as React from "react";
import MonacoEditor from "react-monaco-editor";
export default function RightBar() {
  const code = "let x = 10";

  return (
    <div>
      <Button onClick={() => {}}>tabs</Button>
      <Button type="primary">Primary Button</Button>
      return (
      <MonacoEditor width="1000" height="400" value={code} language="typescript"/>
      );
    </div>
  );
}
