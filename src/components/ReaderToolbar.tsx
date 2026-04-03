import { useState } from "react";
import type { ReadingMode, ReadingDirection, FitMode } from "../stores/readerStore";
import { getSpreadPages } from "../utils/spreadUtils";
import ReaderSettingsPanel from "./ReaderSettingsPanel";
import ZoomControl from "./ZoomControl";
import "./ReaderToolbar.css";

interface ReaderToolbarProps {
  visible: boolean;
  pageIndex: number;
  totalPages: number;
  readingMode: ReadingMode;
  readingDirection: ReadingDirection;
  fitMode: FitMode;
  onBack: () => void;
  onNext: () => void;
  onPrev: () => void;
  onModeChange: (mode: ReadingMode) => void;
  onDirectionChange: (direction: ReadingDirection) => void;
  onFitModeChange: (mode: FitMode) => void;
}

export default function ReaderToolbar({
  visible,
  pageIndex,
  totalPages,
  readingMode,
  readingDirection,
  fitMode,
  onBack,
  onNext,
  onPrev,
  onModeChange,
  onDirectionChange,
  onFitModeChange,
}: ReaderToolbarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const pageInfo = (() => {
    if (readingMode !== "spread") {
      return `${pageIndex + 1} / ${totalPages}`;
    }
    const spreadIndices = getSpreadPages(pageIndex, totalPages);
    if (spreadIndices.length === 1) {
      return `${spreadIndices[0] + 1} / ${totalPages}`;
    }
    return `${spreadIndices[0] + 1}-${spreadIndices[1] + 1} / ${totalPages}`;
  })();

  return (
    <div className={`reader-topbar${visible ? "" : " reader-topbar--hidden"}`}>
      <button className="reader-back" onClick={onBack} title="返回书库">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="reader-page-info">
        <button className="reader-topbar-btn reader-page-nav" onClick={onPrev} disabled={pageIndex === 0} title="上一页">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        {pageInfo}
        <button className="reader-topbar-btn reader-page-nav" onClick={onNext} disabled={pageIndex >= totalPages - 1} title="下一页">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </span>
      <div className="reader-topbar-settings">
        <ZoomControl />
        <button
          className="reader-topbar-btn"
          onClick={() => setSettingsOpen((prev) => !prev)}
          title="设置"
          aria-pressed={settingsOpen}
        >
          {/* Gear icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        {settingsOpen && (
          <ReaderSettingsPanel
            readingMode={readingMode}
            readingDirection={readingDirection}
            fitMode={fitMode}
            totalPages={totalPages}
            onModeChange={onModeChange}
            onDirectionChange={onDirectionChange}
            onFitModeChange={onFitModeChange}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
