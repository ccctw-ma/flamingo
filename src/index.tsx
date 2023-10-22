import * as React from "react";
import ReactDOM from "react-dom";
import { calcTime } from "./utils/index";
// import { Anchor } from "antd";
import Button from "antd/lib/button";
import "./index.css";
interface HelloProps {
  compiler: string;
  framework: string;
}

export const Hello = (props: HelloProps) => {
  return (
    <div className="w-[500px] bg-red-100">
      <h1>
        Hello from {props.compiler} and {props.framework}!
      </h1>
      {/* <Anchor /> */}
      <Button />
      <button
        onClick={() => {
          console.log("Hello world");
          console.log(calcTime());
        }}
      >
        click me hello world
        {new Array(12).fill(12).map((_) => {
          return <div>1</div>;
        })}
      </button>
    </div>
  );
};

ReactDOM.render(
  <Hello compiler={"ts"} framework={"react"} />,
  document.getElementById("root")
);
