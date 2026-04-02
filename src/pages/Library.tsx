import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useLibraryStore } from "../stores/libraryStore";
import { useSettingsStore } from "../stores/settingsStore";
import { bookRepo } from "../repos/bookRepo";
import { chapterRepo } from "../repos/chapterRepo";
import { pageRepo } from "../repos/pageRepo";
import { progressRepo } from "../repos/progressRepo";
import BookCard from "../components/BookCard";
import ConfirmDialog from "../components/ConfirmDialog";
import type { Book, ImportResult } from "../db/types";
import type { ProgressWithBook } from "../repos/progressRepo";
import "./Library.css";

export default function Library() {
  const navigate = useNavigate();
  const { books, loading, importState, setBooks, setLoading, setImportState, removeBook } =
    useLibraryStore();
  const libraryPath = useSettingsStore((s) => s.libraryPath);
  const [recentProgress, setRecentProgress] = useState<ProgressWithBook[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const allBooks = await bookRepo.getAll();
      setBooks(allBooks);
      const recent = await progressRepo.getRecent(10);
      setRecentProgress(recent);
    } catch (e) {
      console.error("Failed to load books:", e);
    } finally {
      setLoading(false);
    }
  }, [setBooks, setLoading]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const doImport = async (sourcePath: string, sourceType: string) => {
    setImportState({ status: "importing", message: "正在导入...", progress: 0 });

    let unlisten: (() => void) | null = null;
    try {
      unlisten = await listen<{ current: number; total: number }>("import-progress", (event) => {
        const { current, total } = event.payload;
        const pct = total > 0 ? Math.round((current / total) * 100) : 0;
        setImportState({
          status: "importing",
          message: `正在导入... ${current}/${total}`,
          progress: pct,
        });
      });

      const result = await invoke<ImportResult>("import_manga", {
        sourcePath,
        libraryDir: libraryPath,
        sourceType,
      });

      // Create book record with actual cover_path from Rust
      const bookId = await bookRepo.create({
        title: result.title,
        cover_path: result.cover_path,
        source_type: sourceType,
        book_uuid: result.book_id,
      });

      // Create chapters and pages from import result
      const chapterIds = await chapterRepo.createBatch(
        bookId,
        result.chapters.map((ch) => ({
          title: ch.title,
          chapterOrder: ch.chapter_order,
          pageCount: ch.page_files.length,
        })),
      );

      for (let i = 0; i < result.chapters.length; i++) {
        const chapter = result.chapters[i];
        const chapterId = chapterIds[i];
        const pages = chapter.page_files.map((fileName, j) => ({
          pageIndex: j + 1,
          fileName,
          filePath: `${result.pages_dir}/${fileName}`,
        }));
        await pageRepo.createBatch(chapterId, pages);
      }

      setImportState({ status: "done" });
      await loadBooks();
    } catch (e) {
      setImportState({ status: "error", message: String(e) });
    } finally {
      unlisten?.();
    }
  };

  const handleImportFolder = async () => {
    const selected = await open({ directory: true, title: "选择漫画文件夹" });
    if (!selected) return;
    await doImport(selected as string, "folder");
  };

  const handleImportFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "漫画文件", extensions: ["zip", "cbz", "epub"] }],
      title: "选择漫画文件",
    });
    if (!selected) return;
    const ext = (selected as string).split(".").pop()?.toLowerCase();
    const sourceType = ext === "cbz" ? "cbz" : ext === "epub" ? "epub" : "zip";
    await doImport(selected as string, sourceType);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await bookRepo.delete(deleteTarget.id, libraryPath);
      removeBook(deleteTarget.id);
    } catch (e) {
      console.error("Failed to delete book:", e);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="library-page">
      <header className="library-header">
        <h2 className="library-title">我的书库</h2>
        <div className="library-actions">
          <button className="btn btn--primary" onClick={handleImportFolder}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
            导入文件夹
          </button>
          <button className="btn btn--outline" onClick={handleImportFile}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            导入文件
          </button>
        </div>
      </header>

      {importState.status === "importing" && (
        <div className="import-progress">
          <div className="import-progress-bar">
            <div
              className="import-progress-fill"
              style={{ width: `${importState.progress ?? 0}%`, animation: "none" }}
            />
          </div>
          <span className="import-progress-text">{importState.message}</span>
        </div>
      )}

      {importState.status === "error" && (
        <div className="import-error">{importState.message}</div>
      )}

      {recentProgress.length > 0 && (
        <section className="continue-reading">
          <h3 className="section-title">继续阅读</h3>
          <div className="continue-row">
            {recentProgress.map((rp) => (
              <div
                key={rp.book_id}
                className="continue-card"
                onClick={() => navigate(`/reader/${rp.book_id}`)}
              >
                <div className="continue-cover">
                  {rp.cover_path ? (
                    <img src={convertFileSrc(rp.cover_path)} alt={rp.title} />
                  ) : (
                    <div className="cover-placeholder" aria-label="无封面">📖</div>
                  )}
                </div>
                <div className="continue-info">
                  <span className="continue-title">{rp.title}</span>
                  <span className="continue-progress">第{rp.page_index}页 / 共{rp.total_pages}页</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="library-empty">
          <div className="spinner" />
        </div>
      ) : books.length === 0 ? (
        <div className="library-empty">
          <div className="empty-icon">📚</div>
          <h3 className="empty-title">还没有漫画</h3>
          <p className="empty-subtitle">导入你的第一本漫画开始阅读</p>
          <div className="empty-actions">
            <button className="btn btn--primary" onClick={handleImportFolder}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
              导入文件夹
            </button>
            <button className="btn btn--outline" onClick={handleImportFile}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              导入文件
            </button>
          </div>
        </div>
      ) : (
        <div className="book-grid">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onClick={() => navigate(`/reader/${book.id}`)}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        message={`确定要删除「${deleteTarget?.title}」吗？`}
        confirmLabel="删除"
        confirmVariant="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
