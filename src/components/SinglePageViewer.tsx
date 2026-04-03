import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getPreloadRange } from "../stores/readerStore";
import { useReaderStore } from "../stores/readerStore";
import type { ReadingDirection, FitMode } from "../stores/readerStore";
import type { Page } from "../db/types";
import "./SinglePageViewer.css";

const CLICK_REGION_DIVISIONS = 3;
const DRAG_THRESHOLD = 3;

interface SinglePageViewerProps {
  pages: Page[];
  currentIndex: number;
  readingDirection?: ReadingDirection;
  fitMode?: FitMode;
  onNext: () => void;
  onPrev: () => void;
}

export default function SinglePageViewer({
  pages,
  currentIndex,
  readingDirection = "ltr",
  fitMode = "best-fit",
  onNext,
  onPrev,
}: SinglePageViewerProps) {
  const zoomLevel = useReaderStore((s) => s.zoomLevel);
  const isZoomed = zoomLevel > 1;

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    didDrag: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const [imgNatSize, setImgNatSize] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // Track container dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset image dimensions when page changes
  useEffect(() => {
    setImgNatSize({ w: 0, h: 0 });
  }, [currentIndex]);

  // Calculate zoomed image dimensions — zoom the image content, not black margins
  const zoomedImageStyle = useMemo(() => {
    if (!isZoomed || !imgNatSize.w || !containerSize.w) return undefined;

    let baseW: number, baseH: number;

    switch (fitMode) {
      case "fit-width": {
        const scale = containerSize.w / imgNatSize.w;
        baseW = containerSize.w;
        baseH = imgNatSize.h * scale;
        break;
      }
      case "fit-height": {
        const scale = containerSize.h / imgNatSize.h;
        baseW = imgNatSize.w * scale;
        baseH = containerSize.h;
        break;
      }
      case "original": {
        baseW = imgNatSize.w;
        baseH = imgNatSize.h;
        break;
      }
      default: {
        // best-fit
        const scale = Math.min(
          containerSize.w / imgNatSize.w,
          containerSize.h / imgNatSize.h,
        );
        baseW = imgNatSize.w * scale;
        baseH = imgNatSize.h * scale;
        break;
      }
    }

    return {
      width: baseW * zoomLevel,
      height: baseH * zoomLevel,
      objectFit: "unset",
      maxWidth: "none",
      maxHeight: "none",
    };
  }, [isZoomed, zoomLevel, imgNatSize, containerSize, fitMode]);

  const hasDims = imgNatSize.w > 0 && containerSize.w > 0;

  // Center content when zoom changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el || zoomLevel === 1) return;
    const extraW = el.scrollWidth - el.clientWidth;
    const extraH = el.scrollHeight - el.clientHeight;
    el.scrollLeft = extraW / 2;
    el.scrollTop = extraH / 2;
  }, [zoomLevel, imgNatSize]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isZoomed) return;
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;
      dragRef.current = {
        active: true,
        didDrag: false,
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      };
    },
    [isZoomed],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.didDrag) {
      if (Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
      d.didDrag = true;
      const el = containerRef.current;
      if (el) el.style.cursor = "grabbing";
    }
    const el = containerRef.current;
    if (!el) return;
    el.scrollLeft = d.scrollLeft - dx;
    el.scrollTop = d.scrollTop - dy;
  }, []);

  const handleMouseUp = useCallback(() => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    const el = containerRef.current;
    if (el) el.style.cursor = "";
  }, []);

  const preloadIndices = useMemo(
    () => getPreloadRange(currentIndex, pages.length),
    [currentIndex, pages.length],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isZoomed) return;
      if (dragRef.current.didDrag) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const third = rect.width / CLICK_REGION_DIVISIONS;
      const isRtl = readingDirection === "rtl";
      if (x < third) {
        isRtl ? onNext() : onPrev();
      } else if (x > third * 2) {
        isRtl ? onPrev() : onNext();
      }
    },
    [onNext, onPrev, readingDirection],
  );

  const currentPage = pages[currentIndex];

  return (
    <>
      <div
        ref={containerRef}
        className={`reader-image-area${fitMode !== "best-fit" || isZoomed ? " reader-image-area--scrollable" : ""}${isZoomed ? " reader-image-area--zoomed" : ""}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="reader-image-wrapper"
          style={isZoomed && hasDims ? { width: "fit-content", height: "fit-content" } : undefined}
        >
          {currentPage && (
            <img
              className={`reader-image${fitMode !== "best-fit" ? ` reader-image--${fitMode}` : ""}`}
              style={zoomedImageStyle}
              src={convertFileSrc(currentPage.file_path)}
              alt={`Page ${currentIndex + 1}`}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                setImgNatSize({ w: img.naturalWidth, h: img.naturalHeight });
              }}
            />
          )}
        </div>
      </div>
      {preloadIndices.map((idx) => {
          const page = pages[idx];
          if (!page) return null;
          return (
            <img
              key={idx}
              src={convertFileSrc(page.file_path)}
              alt=""
              style={{ display: "none" }}
            />
          );
        })}
    </>
  );
}
