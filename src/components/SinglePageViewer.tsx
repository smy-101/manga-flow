import { useCallback, useMemo } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getPreloadRange } from "../stores/readerStore";
import type { ReadingDirection } from "../stores/readerStore";
import type { Page } from "../db/types";
import "./SinglePageViewer.css";

const CLICK_REGION_DIVISIONS = 3;

interface SinglePageViewerProps {
  pages: Page[];
  currentIndex: number;
  readingDirection?: ReadingDirection;
  onNext: () => void;
  onPrev: () => void;
}

export default function SinglePageViewer({
  pages,
  currentIndex,
  readingDirection = "ltr",
  onNext,
  onPrev,
}: SinglePageViewerProps) {
  const preloadIndices = useMemo(
    () => getPreloadRange(currentIndex, pages.length),
    [currentIndex, pages.length],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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
      <div className="reader-image-area" onClick={handleClick}>
        {currentPage && (
          <img
            className="reader-image"
            src={convertFileSrc(currentPage.file_path)}
            alt={`Page ${currentIndex + 1}`}
          />
        )}
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
