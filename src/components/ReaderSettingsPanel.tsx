import { useEffect, useRef } from "react";
import type { ReadingMode, ReadingDirection, FitMode } from "../stores/readerStore";
import "./ReaderSettingsPanel.css";

interface ReaderSettingsPanelProps {
  readingMode: ReadingMode;
  readingDirection: ReadingDirection;
  fitMode: FitMode;
  totalPages: number;
  onModeChange: (mode: ReadingMode) => void;
  onDirectionChange: (direction: ReadingDirection) => void;
  onFitModeChange: (mode: FitMode) => void;
  onClose: () => void;
}

export default function ReaderSettingsPanel({
  readingMode,
  readingDirection,
  fitMode,
  totalPages,
  onModeChange,
  onDirectionChange,
  onFitModeChange,
  onClose,
}: ReaderSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    // Delay listener to avoid the opening click from closing
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div ref={panelRef} className="reader-settings-panel">
      <div className="settings-group">
        <div className="settings-group__title">阅读模式</div>
        <div className="settings-group__options">
          <button
            className={`settings-option ${readingMode === "single" ? "settings-option--active" : ""}`}
            onClick={() => onModeChange("single")}
          >
            单页模式
          </button>
          <button
            className={`settings-option ${readingMode === "continuous" ? "settings-option--active" : ""}`}
            onClick={() => onModeChange("continuous")}
          >
            连续滚动
          </button>
          <button
            className={`settings-option ${readingMode === "spread" ? "settings-option--active" : ""}`}
            onClick={() => onModeChange("spread")}
            disabled={totalPages <= 1}
          >
            双页展开
          </button>
        </div>
      </div>
      <div className="settings-group">
        <div className="settings-group__title">阅读方向</div>
        <div className="settings-group__options">
          <button
            className={`settings-option ${readingDirection === "ltr" ? "settings-option--active" : ""}`}
            onClick={() => onDirectionChange("ltr")}
          >
            从左到右
          </button>
          <button
            className={`settings-option ${readingDirection === "rtl" ? "settings-option--active" : ""}`}
            onClick={() => onDirectionChange("rtl")}
          >
            从右到左
          </button>
        </div>
      </div>
      <div className="settings-group">
        <div className="settings-group__title">适配模式</div>
        <div className="settings-group__options">
          <button
            className={`settings-option ${fitMode === "best-fit" ? "settings-option--active" : ""}`}
            onClick={() => onFitModeChange("best-fit")}
            disabled={readingMode === "continuous"}
          >
            最佳适配
          </button>
          <button
            className={`settings-option ${fitMode === "fit-width" ? "settings-option--active" : ""}`}
            onClick={() => onFitModeChange("fit-width")}
            disabled={readingMode === "continuous"}
          >
            适配宽度
          </button>
          <button
            className={`settings-option ${fitMode === "fit-height" ? "settings-option--active" : ""}`}
            onClick={() => onFitModeChange("fit-height")}
            disabled={readingMode === "continuous"}
          >
            适配高度
          </button>
          <button
            className={`settings-option ${fitMode === "original" ? "settings-option--active" : ""}`}
            onClick={() => onFitModeChange("original")}
            disabled={readingMode === "continuous"}
          >
            原始大小
          </button>
        </div>
        {readingMode === "continuous" && (
          <div className="settings-group__hint">连续滚动模式下不可用</div>
        )}
      </div>
    </div>
  );
}
