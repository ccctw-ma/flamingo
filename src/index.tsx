import * as React from "react";
import ReactDOM from "react-dom";
import { throttle } from "./utils/index";
import { StyleProvider } from "@ant-design/cssinjs";
import "./index.css";
import {
  DIVIDER_WIDTH,
  HOME_HEIGHT,
  HOME_WIDTH,
  LEFT_BAR_WIDTH_KEY,
  LEFT_BAR_WIDTH_MAX_RATIO,
  LEFT_BAR_WIDTH_MIN_RATIO,
} from "./utils/constants";
import { useLayoutEffect, useRef, useState } from "react";
import { localGet, localSet } from "./utils/storage";
import LeftBar from "./views/LeftBar";
import RightBar from "./views/RightBar";
import { FloatButton } from "antd";

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
    (async () => {
      const res = await localGet(LEFT_BAR_WIDTH_KEY);
      const localVal = res[LEFT_BAR_WIDTH_KEY];
      localVal && setLeftBarSize(localVal);
    })();
  }, []);

  return (
    // change size to fit different scenes
    <div
      style={{
        minWidth: HOME_WIDTH,
        width: "100%",
        height: "100vh",
        minHeight: HOME_HEIGHT,
      }}
    >
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
        <div className="flex-1">
          <RightBar />
        </div>
      </div>

      <FloatButton
        type="primary"
        onClick={() =>
          chrome.tabs.create({ url: chrome.runtime.getURL("src/index.html") })
        }
      />
    </div>
  );
};

ReactDOM.render(
  <StyleProvider hashPriority="high">
    <Home />
  </StyleProvider>,
  document.getElementById("root")
);
