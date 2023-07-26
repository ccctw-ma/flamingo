import * as React from "react";
import ReactDOM from "react-dom";

interface HelloProps {
  compiler: string;
  framework: string;
}

export const Hello = (props: HelloProps) => {
  return (
    <div>
      <h1>
        Hello from {props.compiler} and {props.framework}!
      </h1>
      <button
        onClick={() => {
          console.log("Hello world");
        }}
      >
        click me
      </button>
    </div>
  );
};

ReactDOM.render(
  <Hello compiler={"ts"} framework={"react"} />,
  document.getElementById("root")
);
