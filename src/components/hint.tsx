import { ReactNode, useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type HintProps = {
  title: string;
  children: ReactNode;
  placement?: "top" | "bottom";
};

export default function Hint({ title, children, placement = "top" }: HintProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    arrowLeft: number;
    placement: "top" | "bottom";
  } | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const bubble = bubbleRef.current;
    if (!anchor || !bubble) {
      return;
    }

    const margin = 8;
    const gap = 10;
    const anchorRect = anchor.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const targetCenter = anchorRect.left + anchorRect.width / 2;
    let nextPlacement = placement;
    let top =
      placement === "bottom" ? anchorRect.bottom + gap : anchorRect.top - bubbleRect.height - gap;

    if (placement === "bottom" && top + bubbleRect.height > viewportHeight - margin) {
      nextPlacement = "top";
      top = anchorRect.top - bubbleRect.height - gap;
    } else if (placement === "top" && top < margin) {
      nextPlacement = "bottom";
      top = anchorRect.bottom + gap;
    }

    const maxLeft = viewportWidth - bubbleRect.width - margin;
    const left = Math.min(maxLeft, Math.max(margin, targetCenter - bubbleRect.width / 2));
    const arrowLeft = Math.min(bubbleRect.width - 14, Math.max(14, targetCenter - left));

    setPosition({
      left,
      top: Math.max(margin, top),
      arrowLeft,
      placement: nextPlacement,
    });
  }, [placement]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <span
      ref={anchorRef}
      className="flamingo-hint"
      onBlur={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open
        ? createPortal(
            <div
              ref={bubbleRef}
              className={`flamingo-hint-bubble flamingo-hint-bubble-${position?.placement ?? placement}`}
              style={{
                left: position?.left ?? -9999,
                top: position?.top ?? -9999,
              }}
            >
              {title}
              <span className="flamingo-hint-arrow" style={{ left: position?.arrowLeft ?? 16 }} />
            </div>,
            document.body
          )
        : null}
    </span>
  );
}
