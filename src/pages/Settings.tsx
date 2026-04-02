import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import ConfirmDialog from "../components/ConfirmDialog";
import "./Settings.css";

export default function Settings() {
  const libraryPath = useSettingsStore((s) => s.libraryPath);
  const setLibraryPath = useSettingsStore((s) => s.setLibraryPath);
  const defaultReadingMode = useSettingsStore((s) => s.defaultReadingMode);
  const setDefaultReadingMode = useSettingsStore((s) => s.setDefaultReadingMode);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangeDir = async () => {
    setShowConfirm(false);
    const selected = await open({
      directory: true,
      title: "选择新的漫画库目录",
    });
    if (!selected) return;

    try {
      await invoke("init_library_dir", { libraryPath: selected });
      setLibraryPath(selected as string);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="settings-page">
      <h2 className="settings-title">设置</h2>
      <div className="settings-card">
        <div className="settings-field">
          <label className="settings-label">漫画库目录</label>
          <div className="settings-path-row">
            <span className="settings-path">{libraryPath || "未设置"}</span>
            <button className="btn btn--outline" onClick={() => setShowConfirm(true)}>
              更改目录
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="settings-error">{error}</div>
      )}

      <div className="settings-card">
        <div className="settings-field">
          <label className="settings-label">默认阅读模式</label>
          <div className="settings-mode-options">
            <button
              className={`settings-mode-btn ${defaultReadingMode === "single" ? "settings-mode-btn--active" : ""}`}
              onClick={() => setDefaultReadingMode("single")}
            >
              单页模式
            </button>
            <button
              className={`settings-mode-btn ${defaultReadingMode === "continuous" ? "settings-mode-btn--active" : ""}`}
              onClick={() => setDefaultReadingMode("continuous")}
            >
              连续滚动
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        message="更改目录后，数据库中的书籍记录仍会保留，但其文件路径指向旧目录，这些书籍将无法正常打开。旧目录中的文件不会被移动或删除。确定要更改目录吗？"
        confirmLabel="确定更改"
        onClose={() => setShowConfirm(false)}
        onConfirm={handleChangeDir}
      />
    </div>
  );
}
