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
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  localGetBySingleKey,
  localSetBySingleKey,
  setLocalGroups,
  setLocalRules,
} from "./utils/storage";
import LeftBar from "./views/LeftBar";
import RightBar from "./views/RightBar";
import { FloatButton } from "antd";
import { CodeOutlined, MenuOutlined, SettingOutlined } from "@ant-design/icons";
import { useConfig, useGlobalState } from "./utils/hooks";

export const Home = () => {
  /**
   * Because we don't know if there will be a scrolling axis when
   * executing this code, but we have defined the minimum width,
   * so special handling is needed here to avoid exceptions.
   */
  const containerWidth = Math.max(HOME_WIDTH, document.body.scrollWidth);
  const { loaded, refresh, saveEdit } = useGlobalState();
  const { initConfig } = useConfig();
  const container = useRef<HTMLDivElement>(null);
  const rightBar = useRef<any>();
  const [leftBarSize, setLeftBarSize] = useState<number>(HOME_WIDTH * LEFT_BAR_WIDTH_MIN_RATIO);

  const [_, sa] = useState({});
  /**
   * use empty object {} to refresh Home page, and the reason why containerWidth
   * is not used here is that this function has only been registered once,
   * so the containerWidth used will only be the containerWidth from the
   * first registration and will not be updated.
   */
  const redraw = () => {
    sa({});
    rightBar.current.setContainerWidth(document.body.scrollWidth - leftBarSize - DIVIDER_WIDTH);
  };

  function handleChangeSize() {
    const [leftBarContainer, middleDivder, rightBarContainer] = Array.from(
      container.current!.children
    ) as Array<HTMLDivElement>;

    let tempLeftBarSize = +leftBarContainer.style.width.slice(0, -2);
    const throttleHandleMouseMove = throttle((e: MouseEvent) => {
      const maxSize = LEFT_BAR_WIDTH_MAX_RATIO * HOME_WIDTH;
      const minSize = LEFT_BAR_WIDTH_MIN_RATIO * HOME_WIDTH;
      const clientX = e.clientX;
      const newSize =
        clientX > maxSize
          ? Math.min(maxSize, clientX)
          : clientX < minSize
            ? Math.max(minSize, clientX)
            : clientX;

      tempLeftBarSize = newSize;
      leftBarContainer.style.width = `${newSize}px`;
      middleDivder.style.left = `${newSize}px`;
      rightBarContainer.style.width = `${containerWidth - newSize - DIVIDER_WIDTH}px`;
      rightBar.current!.setContainerWidth(containerWidth - newSize - DIVIDER_WIDTH);
    });

    const handleMouseUp = () => {
      container.current!.removeEventListener("mousemove", throttleHandleMouseMove);

      /**
       * storing data and synchronizing state
       */
      setLeftBarSize(tempLeftBarSize);
      localSetBySingleKey(LEFT_BAR_WIDTH_KEY, tempLeftBarSize);
    };

    container.current!.addEventListener("mousemove", throttleHandleMouseMove);
    container.current!.addEventListener("mouseup", handleMouseUp, {
      once: true,
    });
  }

  async function handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      saveEdit();
    }
  }

  async function initView() {
    const localVal: number =
      (await localGetBySingleKey(LEFT_BAR_WIDTH_KEY)) ?? HOME_WIDTH * LEFT_BAR_WIDTH_MIN_RATIO;
    setLeftBarSize(localVal);
    rightBar.current!.setContainerWidth(containerWidth - localVal - DIVIDER_WIDTH);
  }

  /**
   * try to avoid container flickering as much as possible
   */
  useLayoutEffect(() => {
    (async () => {
      await initConfig();
      await refresh();
      await initView();
    })();

    /**
     * when window size changes, only the size of the right bar
     * needs to be changed
     */
    window.addEventListener("resize", redraw);

    return () => {
      window.removeEventListener("resize", redraw);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [saveEdit]);

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
      {loaded && (
        <div className="w-full h-full relative" ref={container}>
          <div style={{ width: leftBarSize, height: "100%", position: "absolute" }}>
            <LeftBar />
          </div>
          <div
            // todo! ensure a theme color
            className="h-full bg-slate-100 cursor-ew-resize transition hover:bg-pink-600 hover:scale-x-150 "
            onMouseDown={handleChangeSize}
            style={{
              width: DIVIDER_WIDTH,
              height: "100%",
              position: "absolute",
              left: leftBarSize,
              top: 0,
              zIndex: 10,
            }}
          />
          <div
            style={{
              width: `${containerWidth - leftBarSize - DIVIDER_WIDTH}px`,
              height: "100%",
              position: "absolute",
              right: 0,
              top: 0,
            }}
          >
            <RightBar width={containerWidth - leftBarSize - DIVIDER_WIDTH} ref={rightBar} />
          </div>
        </div>
      )}

      <FloatButton.Group trigger="click" icon={<MenuOutlined />}>
        <FloatButton
          icon={<CodeOutlined title="open in new tab" />}
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("src/index.html") })}
        />
        <FloatButton
          icon={<SettingOutlined title="open setting page" />}
          onClick={() => {
            /**just for clean localstorage */
            setLocalRules([]);
            setLocalGroups([]);
          }}
        />
      </FloatButton.Group>
    </div>
  );
};

/**
 * Here we use ReactDOM.render() updates inside of promises, setTimeout,
 * native event handlers, or any other event were not batched in React by default.
 * Starting in React 18 with createRoot, all updates will be automatically batched,
 * no matter where they originate from.
 * #https://github.com/reactwg/react-18/discussions/21
 */
ReactDOM.render(
  <StyleProvider hashPriority="high">
    <Home />
  </StyleProvider>,
  document.getElementById("root")
);
