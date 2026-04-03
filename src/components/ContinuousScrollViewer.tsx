import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useReaderStore } from "../stores/readerStore";
import type { Page } from "../db/types";
import type { ReadingDirection } from "../stores/readerStore";
import "./ContinuousScrollViewer.css";

const BUFFER = 2;
const SCROLL_STEP = 300;

interface ContinuousScrollViewerProps {
  pages: Page[];
  currentIndex: number;
  readingDirection?: ReadingDirection;
  onVisiblePageChange: (index: number) => void;
}

export interface ContinuousScrollViewerHandle {
  scrollBy: (delta: number) => void;
}

const ContinuousScrollViewer = forwardRef<ContinuousScrollViewerHandle, ContinuousScrollViewerProps>(
  function ContinuousScrollViewer(
    { pages, currentIndex, readingDirection = "ltr", onVisiblePageChange }: ContinuousScrollViewerProps,
    ref,
  ) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleIndexRef = useRef(currentIndex);
  const pageElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const initialIndexRef = useRef(currentIndex);
  const initialScrollDone = useRef(false);
  const settlingRef = useRef(false);
  const heightsRef = useRef<Map<number, number>>(new Map());
  const isRtl = readingDirection === "rtl";
  const zoomLevel = useReaderStore((s) => s.zoomLevel);
  const zoomedIn = zoomLevel > 1;

  // Drag-to-pan when zoomed in
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!zoomedIn) return;
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const scrollLeft = el.scrollLeft;
      const scrollTop = el.scrollTop;
      el.style.cursor = "grabbing";

      const onMouseMove = (ev: MouseEvent) => {
        el.scrollLeft = scrollLeft - (ev.clientX - startX);
        el.scrollTop = scrollTop - (ev.clientY - startY);
      };
      const onMouseUp = () => {
        el.style.cursor = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [zoomedIn],
  );

  useImperativeHandle(ref, () => ({
    scrollBy(delta: number) {
      containerRef.current?.scrollBy({ top: delta, behavior: "smooth" });
    },
  }), []);

  // Keyboard scrolling: RTL reverses ← →, ↑ ↓ unchanged
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const scrollForward = isRtl ? "ArrowLeft" : "ArrowRight";
      const scrollBack = isRtl ? "ArrowRight" : "ArrowLeft";
      if (e.key === "ArrowDown" || e.key === scrollForward) {
        e.preventDefault();
        container.scrollBy({ top: SCROLL_STEP, behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === scrollBack) {
        e.preventDefault();
        container.scrollBy({ top: -SCROLL_STEP, behavior: "smooth" });
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [isRtl]);

  // Virtual rendering: only render <img> for visible ± buffer pages
  const [renderRange, setRenderRange] = useState<[number, number]>(() => [
    Math.max(0, currentIndex - BUFFER),
    Math.min(pages.length - 1, currentIndex + BUFFER),
  ]);

  const setPageRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      pageElementsRef.current[index] = el;
    },
    [],
  );

  // IntersectionObserver: track visible pages and update render range
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const visibleSet = new Set<number>();

    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;
        for (const entry of entries) {
          const idx = Number(
            (entry.target as HTMLElement).dataset.pageIndex,
          );
          if (entry.isIntersecting) {
            if (!visibleSet.has(idx)) {
              visibleSet.add(idx);
              changed = true;
            }
          } else {
            if (visibleSet.has(idx)) {
              visibleSet.delete(idx);
              changed = true;
            }
          }
        }
        if (changed && visibleSet.size > 0) {
          const indices = Array.from(visibleSet);
          const min = Math.min(...indices);
          const max = Math.max(...indices);
          setRenderRange([
            Math.max(0, min - BUFFER),
            Math.min(pages.length - 1, max + BUFFER),
          ]);
        }
      },
      { root: container, threshold: 0.1 },
    );

    const observeAll = () => {
      pageElementsRef.current.forEach((el) => {
        if (el) observer.observe(el);
      });
    };

    observeAll();
    // Re-observe when new elements mount (triggered by renderRange changes)
    const mo = new MutationObserver(() => observeAll());
    mo.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, [pages.length]);

  // Re-scroll to target page to handle layout shifts from lazy-loaded images
  const startSettling = useCallback((targetEl: HTMLDivElement) => {
    settlingRef.current = true;
    let rafId = 0;
    const start = performance.now();

    const stopSettling = () => {
      if (!settlingRef.current) return;
      settlingRef.current = false;
      cancelAnimationFrame(rafId);
    };

    const container = containerRef.current;
    container?.addEventListener("wheel", stopSettling, { once: true, passive: true });
    container?.addEventListener("pointerdown", stopSettling, { once: true, passive: true });

    const maintain = () => {
      if (!settlingRef.current) return;
      if (performance.now() - start > 1500) {
        settlingRef.current = false;
        return;
      }
      targetEl.scrollIntoView({ block: "start" });
      rafId = requestAnimationFrame(maintain);
    };
    rafId = requestAnimationFrame(maintain);
  }, []);

  // Detect visible page by finding which element contains the viewport center
  const handleScroll = useCallback(() => {
    if (!initialScrollDone.current || settlingRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const centerPoint = containerRect.top + containerRect.height / 2;

    for (let i = 0; i < pageElementsRef.current.length; i++) {
      const el = pageElementsRef.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= centerPoint && rect.bottom >= centerPoint) {
        if (i !== visibleIndexRef.current) {
          visibleIndexRef.current = i;
          onVisiblePageChange(i);
        }
        break;
      }
    }
  }, [onVisiblePageChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Handle external currentIndex changes (e.g., from PageSlider drag)
  useEffect(() => {
    if (!initialScrollDone.current) return;
    if (visibleIndexRef.current === currentIndex) return;

    // Expand render range to include target page
    setRenderRange([
      Math.max(0, currentIndex - BUFFER),
      Math.min(pages.length - 1, currentIndex + BUFFER),
    ]);

    const rafId = requestAnimationFrame(() => {
      const targetEl = pageElementsRef.current[currentIndex];
      if (!targetEl) return;
      targetEl.scrollIntoView({ block: "start" });
      visibleIndexRef.current = currentIndex;
      startSettling(targetEl);
    });

    return () => cancelAnimationFrame(rafId);
  }, [currentIndex, pages.length, startSettling]);

  // Cache height on image load, then handle initial scroll
  const handleImageLoad = useCallback(
    (idx: number) => {
      const el = pageElementsRef.current[idx];
      if (el) {
        // Store base height (at zoom=1) so placeholders scale correctly
        heightsRef.current.set(idx, el.offsetHeight / zoomLevel);
      }

      if (initialScrollDone.current) return;
      if (idx !== initialIndexRef.current) return;
      const targetEl = pageElementsRef.current[idx];
      if (targetEl) {
        initialScrollDone.current = true;
        targetEl.scrollIntoView({ block: "start" });
        if (initialIndexRef.current > 0) {
          startSettling(targetEl);
        }
      }
    },
    [startSettling, zoomLevel],
  );

  // Fallback: if image was loaded from cache before onLoad handler attached
  useEffect(() => {
    if (initialScrollDone.current) return;
    if (initialIndexRef.current === 0) {
      initialScrollDone.current = true;
      return;
    }
    const el = pageElementsRef.current[initialIndexRef.current];
    const img = el?.querySelector("img");
    if (img && img.complete && img.naturalHeight > 0) {
      initialScrollDone.current = true;
      el!.scrollIntoView({ block: "start" });
      startSettling(el!);
    }
  }, [pages, startSettling]);

  const getPlaceholderStyle = useCallback(
    (idx: number): React.CSSProperties => {
      const cached = heightsRef.current.get(idx);
      if (cached) return { minHeight: cached * zoomLevel };
      const measured = Array.from(heightsRef.current.values());
      if (measured.length > 0) {
        const avg = measured.reduce((a, b) => a + b, 0) / measured.length;
        return { minHeight: avg * zoomLevel };
      }
      return {};
    },
    [zoomLevel],
  );

  return (
    <div
      className={`continuous-scroll-viewer${zoomedIn ? " continuous-scroll-viewer--zoomed" : ""}`}
      ref={containerRef}
      tabIndex={-1}
      onMouseDown={handleMouseDown}
    >
      {pages.map((page, idx) => (
        <div
          key={page.id}
          className="continuous-scroll-page"
          ref={setPageRef(idx)}
          data-page-index={idx}
          data-testid="scroll-page"
          style={{
            ...getPlaceholderStyle(idx),
            ...(zoomLevel !== 1 ? { width: `${zoomLevel * 100}%` } : {}),
          }}
        >
          {idx >= renderRange[0] && idx <= renderRange[1] ? (
            <div className="continuous-scroll-page__content">
              <img
                src={convertFileSrc(page.file_path)}
                alt={`Page ${idx + 1}`}
                loading="eager"
                onLoad={() => handleImageLoad(idx)}
              />
            </div>
          ) : (
            <div className="continuous-scroll-page__placeholder" />
          )}
        </div>
      ))}
    </div>
  );
});

export default ContinuousScrollViewer;
