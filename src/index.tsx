import { ClearOutlined, CodeOutlined, MenuOutlined } from "@ant-design/icons";
import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider, FloatButton, theme } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { useI18n } from "./utils/i18n";
import { throttle } from "./utils";
import { useConfig, useGlobalState } from "./utils/hooks";
import { setRules } from "./utils/storage";
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
  const { t } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const dividerHitWidth = 14;
  const isStandaloneMode = new URLSearchParams(window.location.search).get("mode") === "tab";
  const [containerWidth, setContainerWidth] = useState(() => Math.max(HOME_WIDTH, window.innerWidth));

  const clampLeftBarSize = useCallback(
    (nextWidth: number, nextSize: number) => {
      const maxSize = LEFT_BAR_WIDTH_MAX_RATIO * nextWidth;
      const minSize = LEFT_BAR_WIDTH_MIN_RATIO * nextWidth;
      return Math.min(maxSize, Math.max(minSize, nextSize));
    },
    [LEFT_BAR_WIDTH_MAX_RATIO, LEFT_BAR_WIDTH_MIN_RATIO]
  );

  const [leftBarSize, setLeftBarSize] = useState(() =>
    clampLeftBarSize(Math.max(HOME_WIDTH, window.innerWidth), LEFT_BAR_WIDTH)
  );

  const rightBarWidth = useMemo(
    () => Math.max(0, containerWidth - leftBarSize - dividerHitWidth - 10),
    [containerWidth, leftBarSize]
  );

  const syncContainerWidth = useCallback(() => {
    const nextWidth = Math.max(HOME_WIDTH, container.current?.clientWidth ?? window.innerWidth);
    setContainerWidth(nextWidth);
    setLeftBarSize((current) => clampLeftBarSize(nextWidth, current));
  }, [HOME_WIDTH, clampLeftBarSize]);

  const handleChangeSize = useCallback(() => {
    const startContainer = container.current;
    if (!startContainer) {
      return;
    }

    let nextLeftBarSize = leftBarSize;
    const handleMouseMove = throttle((event: MouseEvent) => {
      const containerRect = startContainer.getBoundingClientRect();
      const offsetX = event.clientX - containerRect.left - 12;
        nextLeftBarSize = clampLeftBarSize(containerWidth, offsetX);
      setLeftBarSize(nextLeftBarSize);
    });

    const handleMouseUp = () => {
      startContainer.removeEventListener("mousemove", handleMouseMove);
      setConfig("LEFT_BAR_WIDTH", nextLeftBarSize);
    };

    startContainer.addEventListener("mousemove", handleMouseMove);
    startContainer.addEventListener("mouseup", handleMouseUp, { once: true });
  }, [
    clampLeftBarSize,
    containerWidth,
    leftBarSize,
    setConfig,
  ]);

  // Bootstrap config and first paint layout once from persisted values.
  useLayoutEffect(() => {
    (async () => {
      await initConfig();
      setLeftBarSize(clampLeftBarSize(Math.max(HOME_WIDTH, window.innerWidth), LEFT_BAR_WIDTH));
      await refresh();
      syncContainerWidth();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const targets = [document.documentElement, document.body, document.getElementById("root")].filter(
      Boolean
    ) as HTMLElement[];
    const width = `${HOME_WIDTH}px`;
    const height = `${HOME_HEIGHT}px`;

    document.documentElement.dataset.flamingoMode = isStandaloneMode ? "tab" : "popup";
    document.documentElement.style.setProperty("--flamingo-popup-width", width);
    document.documentElement.style.setProperty("--flamingo-popup-height", height);
    window.localStorage.setItem("flamingo:popup-width", String(HOME_WIDTH));
    window.localStorage.setItem("flamingo:popup-height", String(HOME_HEIGHT));

    for (const element of targets) {
      if (isStandaloneMode) {
        element.style.minWidth = width;
        element.style.minHeight = height;
      } else {
        element.style.width = width;
        element.style.height = height;
        element.style.minWidth = width;
        element.style.minHeight = height;
      }
    }
  }, [HOME_HEIGHT, HOME_WIDTH, isStandaloneMode]);

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
        width: "100%",
        height: "100%",
      }}
    >
      <div className="app-window">
        <div className="app-shell" ref={container}>
          <div className="app-pane app-sidebar" style={{ width: leftBarSize }}>
            <LeftBar />
          </div>
          <div
            className="app-divider"
            onMouseDown={handleChangeSize}
            style={{
              width: Math.max(DIVIDER_WIDTH, dividerHitWidth),
            }}
          />
          <div className="app-pane app-content" style={{ width: rightBarWidth }}>
            <RightBar width={rightBarWidth} />
          </div>
        </div>

        {!loaded && <div className="app-loading-mask" aria-hidden="true" />}

        <FloatButton.Group
          trigger="click"
          icon={<MenuOutlined />}
          style={{ right: 22, bottom: 20 }}
        >
          <FloatButton
            icon={<CodeOutlined title={t("openStandalone")} />}
            aria-label={t("openStandalone")}
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("home.html?mode=tab") })}
          />
          <FloatButton
            icon={<ClearOutlined title={t("clearCurrentData")} />}
            aria-label={t("clearCurrentData")}
            onClick={() => {
              void setRules([]);
            }}
          />
        </FloatButton.Group>
      </div>
    </div>
  );
};

const AppRoot = () => {
  const { LOCALE } = useConfig();

  return (
    <ConfigProvider
      locale={LOCALE === "en" ? enUS : zhCN}
      theme={{
        algorithm: theme.compactAlgorithm,
        token: {
          colorPrimary: "#ff5d52",
          colorInfo: "#ff5d52",
          colorSuccess: "#22c55e",
          colorWarning: "#f59e0b",
          colorError: "#ef4444",
          colorTextBase: "#0f172a",
          colorBgBase: "#f8fafc",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Segoe UI", "Microsoft YaHei", sans-serif',
          borderRadius: 14,
          controlHeight: 34,
          fontSize: 13,
          wireframe: false,
        },
        components: {
          Button: {
            fontWeight: 500,
          },
          Input: {
            activeBorderColor: "#ff5d52",
            hoverBorderColor: "#ff8b84",
          },
          Select: {
            activeBorderColor: "#ff5d52",
            hoverBorderColor: "#ff8b84",
          },
          Tabs: {
            itemColor: "#64748b",
            itemHoverColor: "#0f172a",
            itemSelectedColor: "#0f172a",
            inkBarColor: "#ff5d52",
          },
          Table: {
            headerBg: "#f8fafc",
            headerColor: "#475569",
          },
        },
      }}
    >
      <Home />
    </ConfigProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StyleProvider hashPriority="high">
    <AppRoot />
  </StyleProvider>
);
