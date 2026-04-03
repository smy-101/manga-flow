import { useCallback, useMemo } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  getSpreadPages,
  getPreloadRangeForSpread,
} from "../utils/spreadUtils";
import type { ReadingDirection, FitMode } from "../stores/readerStore";
import type { Page } from "../db/types";
import "./DoublePageViewer.css";

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
  const spreadPageIndices = useMemo(
    () => getSpreadPages(currentIndex, pages.length),
    [currentIndex, pages.length],
  );

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

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const quarter = rect.width / 4;
      if (x < quarter) {
        isRtl ? onNext() : onPrev();
      } else if (x > quarter * 3) {
        isRtl ? onPrev() : onNext();
      }
    },
    [onNext, onPrev, isRtl],
  );

  return (
    <>
      <div className={`spread-image-area${fitMode !== "best-fit" ? " spread-image-area--scrollable" : ""}`} onClick={handleClick}>
        {displayIndices.map((idx) => {
          const page = pages[idx];
          if (!page) return null;
          return (
            <img
              key={idx}
              className={`spread-image${isSolo ? " spread-image--solo" : ""}${fitMode !== "best-fit" ? ` spread-image--${fitMode}` : ""}`}
              src={convertFileSrc(page.file_path)}
              alt={`Page ${idx + 1}`}
            />
          );
        })}
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
