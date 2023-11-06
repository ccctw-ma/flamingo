import * as React from "react";
export interface HelloProps {
  compiler: string;
  framework: string;
}
export declare const Hello: (props: HelloProps) => React.JSX.Element;
