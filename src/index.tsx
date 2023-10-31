import * as React from "react";
import ReactDOM from "react-dom";
import { calcTime } from "./utils/index";
import { Anchor, Button, Input } from "antd";
import "./index.css";
import { ASPECT_RATIO, HOME_WIDTH } from "./constants";
import { useState } from "react";
import { localSet } from "./utils/storage";
interface HelloProps {
  compiler: string;
  framework: string;
}

export const Home = (props: HelloProps) => {
  return (
    <div style={{ width: HOME_WIDTH, height: HOME_WIDTH / ASPECT_RATIO }}>
      <div className="w-full h-full">
        <Input
          defaultValue="Hello world"
          onChange={(e) => {
            localSet({ s: Date.now() }, () => {
              console.log("hello world");
            });
          }}
        />
      </div>
    </div>
  );
};

ReactDOM.render(
  <Home compiler={"ts"} framework={"react"} />,
  document.getElementById("root")
);
