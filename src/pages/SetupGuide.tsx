import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import "./SetupGuide.css";

export default function SetupGuide() {
  const setLibraryPath = useSettingsStore((s) => s.setLibraryPath);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async () => {
    setError(null);
    const selected = await open({
      directory: true,
      title: "选择漫画库存放目录",
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
    <div className="setup">
      <div className="setup-card">
        <div className="setup-icon">📚</div>
        <h1 className="setup-title">欢迎使用 Manga Flow</h1>
        <p className="setup-desc">请选择一个目录来存放你的漫画库</p>
        <button className="setup-btn" onClick={handleSelect}>
          选择目录
        </button>
        {error && <p className="setup-error">{error}</p>}
      </div>
    </div>
  );
}
