import type { ReadingMode } from "../stores/readerStore";
import "./ReaderToolbar.css";

interface ReaderToolbarProps {
  visible: boolean;
  pageIndex: number;
  totalPages: number;
  readingMode: ReadingMode;
  onBack: () => void;
  onModeChange: (mode: ReadingMode) => void;
}

export default function ReaderToolbar({
  visible,
  pageIndex,
  totalPages,
  readingMode,
  onBack,
  onModeChange,
}: ReaderToolbarProps) {
  const toggleMode = () => {
    onModeChange(readingMode === "single" ? "continuous" : "single");
  };

  return (
    <div className={`reader-topbar${visible ? "" : " reader-topbar--hidden"}`}>
      <button className="reader-back" onClick={onBack} title="返回书库">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="reader-page-info">
        {pageIndex + 1} / {totalPages}
      </span>
      <button
        className="reader-topbar-btn"
        onClick={toggleMode}
        title={readingMode === "single" ? "连续滚动" : "单页模式"}
        aria-pressed={readingMode === "continuous"}
      >
        {readingMode === "single" ? (
          // Scroll/list icon for continuous mode
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        ) : (
          // Single page icon
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        )}
      </button>
    </div>
  );
}
