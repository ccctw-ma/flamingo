import { ClearOutlined, CodeOutlined, MenuOutlined } from "@ant-design/icons";
import { StyleProvider } from "@ant-design/cssinjs";
import { FloatButton } from "antd";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { throttle } from "./utils";
import { useConfig, useGlobalState } from "./utils/hooks";
import { setLocalGroups, setLocalRules } from "./utils/storage";
import LeftBar from "./views/LeftBar";
import RightBar from "./views/RightBar";

export const Home = () => {
  const {
    DIVIDER_WIDTH,
    HOME_HEIGHT,
    HOME_WIDTH,
    LEFT_BAR_WIDTH,
    LEFT_BAR_WIDTH_MAX_RATIO,
    LEFT_BAR_WIDTH_MIN_RATIO,
    initConfig,
    setConfig,
  } = useConfig();
  const { loaded, refresh, saveEdit } = useGlobalState();
  const container = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(() =>
    Math.max(HOME_WIDTH, document.body.scrollWidth)
  );
  const [leftBarSize, setLeftBarSize] = useState(HOME_WIDTH * LEFT_BAR_WIDTH_MIN_RATIO);

  const rightBarWidth = useMemo(
    () => Math.max(0, containerWidth - leftBarSize - DIVIDER_WIDTH),
    [containerWidth, leftBarSize, DIVIDER_WIDTH]
  );

  const syncContainerWidth = useCallback(() => {
    setContainerWidth(Math.max(HOME_WIDTH, document.body.scrollWidth));
  }, [HOME_WIDTH]);

  const handleChangeSize = useCallback(() => {
    const startContainer = container.current;
    if (!startContainer) {
      return;
    }

    let nextLeftBarSize = leftBarSize;
    const maxSize = LEFT_BAR_WIDTH_MAX_RATIO * HOME_WIDTH;
    const minSize = LEFT_BAR_WIDTH_MIN_RATIO * HOME_WIDTH;

    const handleMouseMove = throttle((event: MouseEvent) => {
      nextLeftBarSize = Math.min(maxSize, Math.max(minSize, event.clientX));
      setLeftBarSize(nextLeftBarSize);
    });

    const handleMouseUp = () => {
      startContainer.removeEventListener("mousemove", handleMouseMove);
      setConfig("LEFT_BAR_WIDTH", nextLeftBarSize);
    };

    startContainer.addEventListener("mousemove", handleMouseMove);
    startContainer.addEventListener("mouseup", handleMouseUp, { once: true });
  }, [
    HOME_WIDTH,
    LEFT_BAR_WIDTH_MAX_RATIO,
    LEFT_BAR_WIDTH_MIN_RATIO,
    leftBarSize,
    setConfig,
  ]);

  useLayoutEffect(() => {
    (async () => {
      await initConfig();
      setLeftBarSize(LEFT_BAR_WIDTH);
      await refresh();
      syncContainerWidth();
    })();
  }, []);

  useEffect(() => {
    const handleResize = () => syncContainerWidth();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [syncContainerWidth]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveEdit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveEdit]);

  return (
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
            className="h-full bg-slate-100 cursor-ew-resize transition hover:bg-red-500 hover:scale-x-150"
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
              width: rightBarWidth,
              height: "100%",
              position: "absolute",
              right: 0,
              top: 0,
            }}
          >
            <RightBar width={rightBarWidth} />
          </div>
        </div>
      )}

      <FloatButton.Group trigger="click" icon={<MenuOutlined />}>
        <FloatButton
          icon={<CodeOutlined title="open in new tab" />}
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("home.html") })}
        />
        <FloatButton
          icon={<ClearOutlined title="clear all groups and rules" />}
          onClick={() => {
            setLocalRules([]);
            setLocalGroups([]);
          }}
        />
      </FloatButton.Group>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <StyleProvider hashPriority="high">
    <Home />
  </StyleProvider>
);
