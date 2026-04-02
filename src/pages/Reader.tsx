import { useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useReaderStore } from "../stores/readerStore";
import type { ReadingMode } from "../stores/readerStore";
import { useSettingsStore } from "../stores/settingsStore";
import { pageRepo } from "../repos/pageRepo";
import { progressRepo } from "../repos/progressRepo";
import { useImmersiveMode } from "../hooks/useImmersiveMode";
import ReaderToolbar from "../components/ReaderToolbar";
import SinglePageViewer from "../components/SinglePageViewer";
import ContinuousScrollViewer from "../components/ContinuousScrollViewer";
import type { ContinuousScrollViewerHandle } from "../components/ContinuousScrollViewer";
import PageSlider from "../components/PageSlider";
import "./Reader.css";

/** Debounce interval for progress saves (ms) */
const PROGRESS_SAVE_DELAY = 500;

export default function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const bookIdNum = Number(bookId);
  const {
    pages,
    currentIndex,
    readingMode,
    setBookId,
    setPages,
    setCurrentIndex,
    setReadingMode,
    nextPage,
    prevPage,
  } = useReaderStore();

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollViewerRef = useRef<ContinuousScrollViewerHandle>(null);
  const { showUI, handleMouseMove } = useImmersiveMode();

  useEffect(() => {
    if (!bookIdNum) return;
    setBookId(bookIdNum);
    setReadingMode(useSettingsStore.getState().defaultReadingMode);

    async function load() {
      const allPages = await pageRepo.getByBookId(bookIdNum);
      setPages(allPages);

      const progress = await progressRepo.getByBookId(bookIdNum);
      if (progress && progress.page_index > 0) {
        setCurrentIndex(progress.page_index - 1);
      }
    }
    load();
  }, [bookIdNum, setBookId, setPages, setCurrentIndex, setReadingMode]);

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
      if (e.key === "Escape") {
        navigate("/");
        return;
      }
      if (readingMode === "single") {
        if (e.key === "ArrowRight") {
          nextPage();
        } else if (e.key === "ArrowLeft") {
          prevPage();
        }
      } else {
        const SCROLL_STEP = 300;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          scrollViewerRef.current?.scrollBy(SCROLL_STEP);
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          scrollViewerRef.current?.scrollBy(-SCROLL_STEP);
        }
      }
    },
    [readingMode, nextPage, prevPage, navigate],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleModeChange = useCallback(
    (mode: ReadingMode) => {
      setReadingMode(mode);
    },
    [setReadingMode],
  );

  const handleVisiblePageChange = useCallback(
    (index: number) => {
      setCurrentIndex(index);
    },
    [setCurrentIndex],
  );

  const totalPages = pages.length;

  if (pages.length === 0) {
    return (
      <div className="reader-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="reader" onMouseMove={handleMouseMove}>
      <ReaderToolbar
        visible={showUI}
        pageIndex={currentIndex}
        totalPages={totalPages}
        readingMode={readingMode}
        onBack={() => navigate("/")}
        onModeChange={handleModeChange}
      />
      {readingMode === "single" ? (
        <SinglePageViewer
          pages={pages}
          currentIndex={currentIndex}
          onNext={nextPage}
          onPrev={prevPage}
        />
      ) : (
        <ContinuousScrollViewer
          ref={scrollViewerRef}
          key={bookIdNum}
          pages={pages}
          currentIndex={currentIndex}
          onVisiblePageChange={handleVisiblePageChange}
        />
      )}
      <PageSlider
        visible={showUI}
        currentIndex={currentIndex}
        totalPages={totalPages}
        onChange={setCurrentIndex}
      />
    </div>
  );
}
