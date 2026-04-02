import { useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useReaderStore } from "../stores/readerStore";
import type { ReadingMode, ReadingDirection } from "../stores/readerStore";
import { useSettingsStore } from "../stores/settingsStore";
import { pageRepo } from "../repos/pageRepo";
import { progressRepo } from "../repos/progressRepo";
import { bookPreferencesRepo } from "../repos/bookPreferencesRepo";
import { resolvePreferences } from "../utils/resolvePreferences";
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
    readingDirection,
    setBookId,
    setPages,
    setCurrentIndex,
    setReadingMode,
    setReadingDirection,
    nextPage,
    prevPage,
  } = useReaderStore();

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollViewerRef = useRef<ContinuousScrollViewerHandle>(null);
  const { showUI, handleMouseMove } = useImmersiveMode();

  useEffect(() => {
    if (!bookIdNum) return;
    setBookId(bookIdNum);

    const globalDefaults = useSettingsStore.getState();
    setReadingMode(globalDefaults.defaultReadingMode);
    setReadingDirection(globalDefaults.defaultReadingDirection);

    async function load() {
      const allPages = await pageRepo.getByBookId(bookIdNum);
      setPages(allPages);

      const progress = await progressRepo.getByBookId(bookIdNum);
      if (progress && progress.page_index > 0) {
        setCurrentIndex(progress.page_index - 1);
      }

      const bookPrefs = await bookPreferencesRepo.get(bookIdNum);
      const resolved = resolvePreferences(
        { defaultReadingMode: globalDefaults.defaultReadingMode, defaultReadingDirection: globalDefaults.defaultReadingDirection },
        bookPrefs,
      );
      setReadingMode(resolved.readingMode);
      setReadingDirection(resolved.readingDirection);
    }
    load();
  }, [bookIdNum, setBookId, setPages, setCurrentIndex, setReadingMode, setReadingDirection]);

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

  const isRtl = readingDirection === "rtl";

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/");
        return;
      }
      if (readingMode !== "single") return;
      const goNext = isRtl ? "ArrowLeft" : "ArrowRight";
      const goPrev = isRtl ? "ArrowRight" : "ArrowLeft";
      if (e.key === goNext) {
        nextPage();
      } else if (e.key === goPrev) {
        prevPage();
      }
    },
    [readingMode, isRtl, nextPage, prevPage, navigate],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleModeChange = useCallback(
    (mode: ReadingMode) => {
      setReadingMode(mode);
      if (bookIdNum) {
        bookPreferencesRepo.upsert(bookIdNum, { reading_mode: mode });
      }
    },
    [setReadingMode, bookIdNum],
  );

  const handleDirectionChange = useCallback(
    (direction: ReadingDirection) => {
      setReadingDirection(direction);
      if (bookIdNum) {
        bookPreferencesRepo.upsert(bookIdNum, { reading_direction: direction });
      }
    },
    [setReadingDirection, bookIdNum],
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
        readingDirection={readingDirection}
        onBack={() => navigate("/")}
        onModeChange={handleModeChange}
        onDirectionChange={handleDirectionChange}
      />
      {readingMode === "single" ? (
        <SinglePageViewer
          pages={pages}
          currentIndex={currentIndex}
          readingDirection={readingDirection}
          onNext={nextPage}
          onPrev={prevPage}
        />
      ) : (
        <ContinuousScrollViewer
          ref={scrollViewerRef}
          key={bookIdNum}
          pages={pages}
          currentIndex={currentIndex}
          readingDirection={readingDirection}
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
