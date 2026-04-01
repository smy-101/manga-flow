import { useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useReaderStore } from "../stores/readerStore";
import { pageRepo } from "../repos/pageRepo";
import { progressRepo } from "../repos/progressRepo";
import "./Reader.css";

/** Click area division: left/right fraction for prev/next page */
const CLICK_REGION_DIVISIONS = 3;

/** Debounce interval for progress saves (ms) */
const PROGRESS_SAVE_DELAY = 500;

export default function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const bookIdNum = Number(bookId);
  const {
    pages,
    currentIndex,
    setBookId,
    setPages,
    setCurrentIndex,
    nextPage,
    prevPage,
  } = useReaderStore();

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!bookIdNum) return;
    setBookId(bookIdNum);

    async function load() {
      // Load all pages across all chapters for sequential reading
      const allPages = await pageRepo.getByBookId(bookIdNum);
      setPages(allPages);

      // Check for existing progress
      const progress = await progressRepo.getByBookId(bookIdNum);
      if (progress && progress.page_index > 0) {
        setCurrentIndex(progress.page_index - 1);
      }
    }
    load();
  }, [bookIdNum, setBookId, setPages, setCurrentIndex]);

  const saveProgress = useCallback(async () => {
    if (!bookIdNum || pages.length === 0) return;
    const page = pages[currentIndex];
    if (!page) return;
    await progressRepo.upsert(bookIdNum, page.chapter_id, currentIndex + 1);

    if (currentIndex >= pages.length - 1) {
      await progressRepo.markFinished(bookIdNum);
    }
  }, [bookIdNum, pages, currentIndex]);

  useEffect(() => {
    if (pages.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProgress();
    }, PROGRESS_SAVE_DELAY);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [currentIndex, pages.length, saveProgress]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextPage();
      } else if (e.key === "ArrowLeft") {
        prevPage();
      } else if (e.key === "Escape") {
        navigate("/");
      }
    },
    [nextPage, prevPage, navigate],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / CLICK_REGION_DIVISIONS;
    if (x < third) {
      prevPage();
    } else if (x > third * 2) {
      nextPage();
    }
  };

  const currentPage = pages[currentIndex];
  const totalPages = pages.length;

  if (pages.length === 0) {
    return (
      <div className="reader-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="reader">
      <div className="reader-topbar">
        <button className="reader-back" onClick={() => navigate("/")} title="返回书库">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="reader-page-info">
          {currentIndex + 1} / {totalPages}
        </span>
        <div style={{ width: 36 }} />
      </div>
      <div className="reader-image-area" onClick={handleClick}>
        {currentPage && (
          <img
            className="reader-image"
            src={convertFileSrc(currentPage.file_path)}
            alt={`Page ${currentIndex + 1}`}
          />
        )}
      </div>
    </div>
  );
}
