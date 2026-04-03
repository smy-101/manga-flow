import { useEffect } from "react";
import { useReaderStore } from "../stores/readerStore";

export function useZoomEvents() {
  const zoomIn = useReaderStore((s) => s.zoomIn);
  const zoomOut = useReaderStore((s) => s.zoomOut);
  const resetZoom = useReaderStore((s) => s.resetZoom);
  const setZoom = useReaderStore((s) => s.setZoom);
  const zoomLevel = useReaderStore((s) => s.zoomLevel);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else if (e.deltaY > 0) {
        zoomOut();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    };

    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".reader-topbar") || target.closest(".page-slider")) return;

      if (zoomLevel === 1) {
        setZoom(2);
      } else {
        resetZoom();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    const readerEl = document.querySelector(".reader");
    readerEl?.addEventListener("dblclick", handleDoubleClick);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      readerEl?.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [zoomIn, zoomOut, resetZoom, setZoom, zoomLevel]);
}
