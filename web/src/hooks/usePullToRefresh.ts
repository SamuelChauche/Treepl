/**
 * Simple pull-to-refresh for PWA.
 * Attach ref to a scrollable container. When user pulls down from top,
 * calls onRefresh callback.
 */

import { useRef, useCallback, useEffect } from "react";

export function usePullToRefresh(onRefresh: () => void) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!pulling.current) return;
    pulling.current = false;
    const delta = e.changedTouches[0].clientY - startY.current;
    if (delta > 80) {
      onRefresh();
    }
  }, [onRefresh]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return scrollRef;
}
