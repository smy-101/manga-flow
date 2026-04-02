import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: (path: string) => `http://asset.localhost/${path}`,
}));

const mockPages = [
  { id: 1, chapter_id: 1, page_index: 1, file_name: "001.jpg", file_path: "/books/uuid/pages/001.jpg" },
  { id: 2, chapter_id: 1, page_index: 2, file_name: "002.jpg", file_path: "/books/uuid/pages/002.jpg" },
  { id: 3, chapter_id: 1, page_index: 3, file_name: "003.jpg", file_path: "/books/uuid/pages/003.jpg" },
];

describe("SinglePageViewer click direction", () => {
  it("LTR: clicking right third triggers onNext", async () => {
    const { default: SinglePageViewer } = await import("../components/SinglePageViewer");
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(
      <SinglePageViewer
        pages={mockPages}
        currentIndex={0}
        readingDirection="ltr"
        onNext={onNext}
        onPrev={onPrev}
      />,
    );
    const area = document.querySelector(".reader-image-area")!;
    // Simulate getBoundingClientRect: 900px wide
    vi.spyOn(area as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 0, bottom: 600, height: 600, left: 0, right: 900, width: 900, x: 0, y: 0,
    } as DOMRect);

    // Click at x=800 (right third: 600-900)
    fireEvent.click(area, { clientX: 800, clientY: 300 });
    expect(onNext).toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
  });

  it("LTR: clicking left third triggers onPrev", async () => {
    const { default: SinglePageViewer } = await import("../components/SinglePageViewer");
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(
      <SinglePageViewer
        pages={mockPages}
        currentIndex={1}
        readingDirection="ltr"
        onNext={onNext}
        onPrev={onPrev}
      />,
    );
    const area = document.querySelector(".reader-image-area")!;
    vi.spyOn(area as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 0, bottom: 600, height: 600, left: 0, right: 900, width: 900, x: 0, y: 0,
    } as DOMRect);

    // Click at x=100 (left third: 0-300)
    fireEvent.click(area, { clientX: 100, clientY: 300 });
    expect(onPrev).toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  it("RTL: clicking left third triggers onNext", async () => {
    const { default: SinglePageViewer } = await import("../components/SinglePageViewer");
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(
      <SinglePageViewer
        pages={mockPages}
        currentIndex={0}
        readingDirection="rtl"
        onNext={onNext}
        onPrev={onPrev}
      />,
    );
    const area = document.querySelector(".reader-image-area")!;
    vi.spyOn(area as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 0, bottom: 600, height: 600, left: 0, right: 900, width: 900, x: 0, y: 0,
    } as DOMRect);

    // Click at x=100 (left third) — RTL reverses: left = next
    fireEvent.click(area, { clientX: 100, clientY: 300 });
    expect(onNext).toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
  });

  it("RTL: clicking right third triggers onPrev", async () => {
    const { default: SinglePageViewer } = await import("../components/SinglePageViewer");
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(
      <SinglePageViewer
        pages={mockPages}
        currentIndex={1}
        readingDirection="rtl"
        onNext={onNext}
        onPrev={onPrev}
      />,
    );
    const area = document.querySelector(".reader-image-area")!;
    vi.spyOn(area as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 0, bottom: 600, height: 600, left: 0, right: 900, width: 900, x: 0, y: 0,
    } as DOMRect);

    // Click at x=800 (right third) — RTL reverses: right = prev
    fireEvent.click(area, { clientX: 800, clientY: 300 });
    expect(onPrev).toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });
});
