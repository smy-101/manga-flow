import { useEffect, useRef } from "react";
import type { ReadingMode, ReadingDirection } from "../stores/readerStore";
import "./ReaderSettingsPanel.css";

interface ReaderSettingsPanelProps {
  readingMode: ReadingMode;
  readingDirection: ReadingDirection;
  onModeChange: (mode: ReadingMode) => void;
  onDirectionChange: (direction: ReadingDirection) => void;
  onClose: () => void;
}

export default function ReaderSettingsPanel({
  readingMode,
  readingDirection,
  onModeChange,
  onDirectionChange,
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
    </div>
  );
}
