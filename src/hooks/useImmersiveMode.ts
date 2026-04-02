import { useCallback, useRef, useState } from "react";

/** Hide UI after this many ms of inactivity */
const UI_HIDE_DELAY = 3000;

/** Mouse Y threshold (px) from top/bottom to show UI */
const UI_SHOW_THRESHOLD = 40;

export function useImmersiveMode() {
  const [showUI, setShowUI] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const isOverUI = !!target.closest(".reader-topbar, .page-slider");

      const windowHeight = window.innerHeight;
      const nearEdge =
        e.clientY <= UI_SHOW_THRESHOLD ||
        e.clientY >= windowHeight - UI_SHOW_THRESHOLD;

      if (nearEdge || isOverUI) {
        setShowUI(true);
      }

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

      if (!isOverUI) {
        hideTimerRef.current = setTimeout(() => {
          setShowUI(false);
        }, UI_HIDE_DELAY);
      }
    },
    [setShowUI],
  );

  return { showUI, handleMouseMove };
}
