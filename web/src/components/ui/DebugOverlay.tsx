import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

/**
 * Temporary debug overlay — shows viewport/layout measurements
 * and adds colored borders to key layout elements.
 * DELETE THIS FILE once the navbar issue is resolved.
 */
export function DebugOverlay() {
  const [info, setInfo] = useState("");
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function measure() {
      const vh = window.innerHeight;
      const dvh = document.documentElement.clientHeight;
      const screenH = window.screen.height;
      const bodyH = document.body.getBoundingClientRect().height;

      // Find phone-frame and phone-content
      const frame = document.querySelector(".phone-frame") as HTMLElement | null;
      const content = document.querySelector(".phone-content") as HTMLElement | null;

      const frameRect = frame?.getBoundingClientRect();
      const contentRect = content?.getBoundingClientRect();

      // Find nav (last child of phone-frame that isn't phone-content and isn't style)
      let navRect: DOMRect | null = null;
      if (frame) {
        const children = Array.from(frame.children);
        for (const child of children) {
          if (
            child.tagName !== "STYLE" &&
            !child.classList.contains("phone-content") &&
            !child.classList.contains("debug-overlay")
          ) {
            navRect = child.getBoundingClientRect();
            navRef.current = child as HTMLElement;
          }
        }
      }

      // Read safe area inset via CSS
      const temp = document.createElement("div");
      temp.style.cssText = "position:fixed;bottom:0;left:0;width:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;";
      document.body.appendChild(temp);
      const safeBottom = temp.getBoundingClientRect().height;
      document.body.removeChild(temp);

      const lines = [
        `screen.h: ${screenH}`,
        `innerH: ${vh}`,
        `clientH: ${dvh}`,
        `body.h: ${Math.round(bodyH)}`,
        `safe-bottom: ${safeBottom}`,
        `---`,
        `frame: ${frameRect ? `${Math.round(frameRect.top)}-${Math.round(frameRect.bottom)} (h:${Math.round(frameRect.height)})` : "null"}`,
        `content: ${contentRect ? `${Math.round(contentRect.top)}-${Math.round(contentRect.bottom)} (h:${Math.round(contentRect.height)})` : "null"}`,
        `nav: ${navRect ? `${Math.round(navRect.top)}-${Math.round(navRect.bottom)} (h:${Math.round(navRect.height)})` : "null"}`,
        `---`,
        `gap: ${navRect ? Math.round(vh - navRect.bottom) : "?"}px`,
      ];

      setInfo(lines.join("\n"));
    }

    measure();
    const id = setInterval(measure, 2000);
    return () => clearInterval(id);
  }, []);

  const overlay: CSSProperties = {
    position: "fixed",
    top: 50,
    left: 8,
    zIndex: 99999,
    background: "rgba(0,0,0,0.85)",
    color: "#0f0",
    fontSize: 10,
    fontFamily: "monospace",
    padding: "8px 10px",
    borderRadius: 8,
    whiteSpace: "pre",
    pointerEvents: "none",
    lineHeight: 1.5,
    maxWidth: "60vw",
  };

  return (
    <>
      <div className="debug-overlay" style={overlay}>{info}</div>
      {/* Colored borders for layout debugging */}
      <style>{`
        .phone-frame {
          outline: 3px solid red !important;
          outline-offset: -3px;
        }
        .phone-content {
          outline: 3px solid blue !important;
          outline-offset: -3px;
        }
        /* Nav5 = direct child of phone-frame that isn't phone-content or style */
        .phone-frame > div:not(.phone-content):not(.debug-overlay) {
          outline: 3px solid lime !important;
          outline-offset: -3px;
        }
      `}</style>
    </>
  );
}
