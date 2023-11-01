import * as React from "react";
import ReactDOM from "react-dom";
import { calcTime, throttle } from "./utils/index";
import { Anchor, Button, Input } from "antd";
import "./index.css";
import {
  ASPECT_RATIO,
  DIVIDER_WIDTH,
  HOME_HEIGHT,
  HOME_WIDTH,
  LEFT_BAR_WIDTH_KEY,
  LEFT_BAR_WIDTH_MAX_RATIO,
  LEFT_BAR_WIDTH_MIN_RATIO,
} from "./constants";
import { useLayoutEffect, useRef, useState } from "react";
import { localGet, localSet } from "./utils/storage";
import LeftBar from "./LeftBar";

export const Home = () => {
  const container = useRef<HTMLDivElement>(null);
  const leftBar = useRef<HTMLDivElement>(null);
  const [leftBarSize, setLeftBarSize] = useState<string>(
    HOME_WIDTH * LEFT_BAR_WIDTH_MIN_RATIO + "px"
  );

  function handleChangeSize() {
    const throttleHandleMouseMove = throttle((e: MouseEvent) => {
      const clientX = e.clientX;
      const maxSize = LEFT_BAR_WIDTH_MAX_RATIO * HOME_WIDTH;
      const minSize = LEFT_BAR_WIDTH_MIN_RATIO * HOME_WIDTH;
      const newSize =
        clientX > maxSize
          ? Math.min(maxSize, clientX)
          : clientX < minSize
          ? Math.max(minSize, clientX)
          : clientX;
      leftBar.current!.style.width = `${newSize}px`;
    });

    const handleMouseUp = () => {
      container.current!.removeEventListener(
        "mousemove",
        throttleHandleMouseMove
      );

      const currentLeftBarSize = leftBar.current!.style.width;
      /**
       * storing data and synchronizing state
       */
      setLeftBarSize(currentLeftBarSize);
      localSet({ [LEFT_BAR_WIDTH_KEY]: currentLeftBarSize });
    };

    container.current!.addEventListener("mousemove", throttleHandleMouseMove);
    container.current!.addEventListener("mouseup", handleMouseUp, {
      once: true,
    });
  }

  /**
   * try to avoid container flickering as much as possible
   */
  useLayoutEffect(() => {
    localGet(LEFT_BAR_WIDTH_KEY, (obj) => {
      const localVal = obj[LEFT_BAR_WIDTH_KEY];
      localVal && setLeftBarSize(localVal);
    });
  }, []);

  return (
    <div style={{ width: HOME_WIDTH, height: HOME_HEIGHT }}>
      <div className="w-full h-full flex" ref={container}>
        <div style={{ width: leftBarSize, height: "100%" }} ref={leftBar}>
          <LeftBar />
        </div>
        <div
          // todo! ensure a theme color
          className="h-full bg-slate-100 cursor-ew-resize transition hover:bg-pink-600 hover:scale-x-150 "
          onMouseDown={handleChangeSize}
          style={{ width: DIVIDER_WIDTH }}
        />
        <div className="flex-1">Right</div>
      </div>
    </div>
  );
};

ReactDOM.render(<Home />, document.getElementById("root"));
