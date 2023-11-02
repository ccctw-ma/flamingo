import { Button } from "antd";
import * as React from "react";

export default function RightBar() {
  return (
    <div>
      <Button
        onClick={() => {
          chrome.tabs.create({ url: chrome.runtime.getURL("src/index.html") });
        }}
      >
        tabs
      </Button>
      <Button type="primary">Primary Button</Button>
    </div>
  );
}
