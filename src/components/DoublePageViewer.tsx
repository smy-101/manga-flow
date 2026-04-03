import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  getSpreadPages,
  getPreloadRangeForSpread,
} from "../utils/spreadUtils";
import { useReaderStore } from "../stores/readerStore";
import type { ReadingDirection, FitMode } from "../stores/readerStore";
import type { Page } from "../db/types";
import "./DoublePageViewer.css";

const GAP = 4;

interface DoublePageViewerProps {
  pages: Page[];
  currentIndex: number;
  readingDirection?: ReadingDirection;
  fitMode?: FitMode;
  onNext: () => void;
  onPrev: () => void;
}

export default function DoublePageViewer({
  pages,
  currentIndex,
  readingDirection = "ltr",
  fitMode = "best-fit",
  onNext,
  onPrev,
}: DoublePageViewerProps) {
  const zoomLevel = useReaderStore((s) => s.zoomLevel);
  const isZoomed = zoomLevel > 1;

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const [imgNatSizes, setImgNatSizes] = useState<Record<number, { w: number; h: number }>>({});
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

  // Reset image dimensions when spread changes
  useEffect(() => {
    setImgNatSizes({});
  }, [currentIndex]);

  const spreadPageIndices = useMemo(
    () => getSpreadPages(currentIndex, pages.length),
    [currentIndex, pages.length],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isZoomed) return;
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      };
      el.style.cursor = "grabbing";
    },
    [isZoomed],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollLeft = d.scrollLeft - (e.clientX - d.startX);
    el.scrollTop = d.scrollTop - (e.clientY - d.startY);
  }, []);

  const handleMouseUp = useCallback(() => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    const el = containerRef.current;
    if (el) el.style.cursor = "";
  }, []);

  const preloadIndices = useMemo(
    () => getPreloadRangeForSpread(currentIndex, pages.length),
    [currentIndex, pages.length],
  );

  const isRtl = readingDirection === "rtl";
  const isSolo = spreadPageIndices.length === 1;

  // Determine display order
  const displayIndices = isRtl && !isSolo
    ? [...spreadPageIndices].reverse()
    : spreadPageIndices;

  // Calculate zoomed dimensions per image — zoom image content, not black margins
  const zoomedStyles = useMemo(() => {
    if (!isZoomed || !containerSize.w) return {} as Record<number, React.CSSProperties>;
    const halfW = (containerSize.w - GAP) / 2;
    const styles: Record<number, React.CSSProperties> = {};

    for (const idx of spreadPageIndices) {
      const nat = imgNatSizes[idx];
      if (!nat) continue;
      const boxW = isSolo ? containerSize.w : halfW;
      const boxH = containerSize.h;

      let baseW: number, baseH: number;
      switch (fitMode) {
        case "fit-width": {
          const scale = boxW / nat.w;
          baseW = boxW;
          baseH = nat.h * scale;
          break;
        }
        case "fit-height": {
          const scale = boxH / nat.h;
          baseW = nat.w * scale;
          baseH = boxH;
          break;
        }
        case "original": {
          baseW = nat.w;
          baseH = nat.h;
          break;
        }
        default: {
          const scale = Math.min(boxW / nat.w, boxH / nat.h);
          baseW = nat.w * scale;
          baseH = nat.h * scale;
          break;
        }
      }

      styles[idx] = {
        width: baseW * zoomLevel,
        height: baseH * zoomLevel,
        objectFit: "unset",
        maxWidth: "none",
        maxHeight: "none",
      };
    }

    return styles;
  }, [isZoomed, zoomLevel, imgNatSizes, containerSize, fitMode, isSolo, spreadPageIndices]);

  const hasAllDims = spreadPageIndices.every((idx) => imgNatSizes[idx]?.w > 0) && containerSize.w > 0;

  // Center content when zoom changes or image dimensions become available
  useEffect(() => {
    const el = containerRef.current;
    if (!el || zoomLevel === 1) return;
    const extraW = el.scrollWidth - el.clientWidth;
    const extraH = el.scrollHeight - el.clientHeight;
    el.scrollLeft = extraW / 2;
    el.scrollTop = extraH / 2;
  }, [zoomLevel, imgNatSizes]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isZoomed) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const quarter = rect.width / 4;
      if (x < quarter) {
        isRtl ? onNext() : onPrev();
      } else if (x > quarter * 3) {
        isRtl ? onPrev() : onNext();
      }
    },
    [onNext, onPrev, isRtl, isZoomed],
  );

  return (
    <>
      <div
        ref={containerRef}
        className={`spread-image-area${fitMode !== "best-fit" || isZoomed ? " spread-image-area--scrollable" : ""}${isZoomed ? " spread-image-area--zoomed" : ""}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="spread-image-wrapper"
          style={isZoomed && hasAllDims ? { width: "fit-content", height: "fit-content" } : undefined}
        >
          {displayIndices.map((idx) => {
            const page = pages[idx];
            if (!page) return null;
            return (
              <img
                key={idx}
                className={`spread-image${isSolo ? " spread-image--solo" : ""}${fitMode !== "best-fit" ? ` spread-image--${fitMode}` : ""}`}
                style={zoomedStyles[idx]}
                src={convertFileSrc(page.file_path)}
                alt={`Page ${idx + 1}`}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  setImgNatSizes((prev) => ({ ...prev, [idx]: { w: img.naturalWidth, h: img.naturalHeight } }));
                }}
              />
            );
          })}
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
