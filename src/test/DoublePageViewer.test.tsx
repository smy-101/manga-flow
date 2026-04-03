import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: (path: string) => `http://asset.localhost/${path}`,
}));

const mockPages = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  chapter_id: 1,
  page_index: i + 1,
  file_name: `${String(i + 1).padStart(3, "0")}.jpg`,
  file_path: `/books/uuid/pages/${String(i + 1).padStart(3, "0")}.jpg`,
}));

// Helper to render DoublePageViewer with dynamic import
async function renderViewer(
  overrides: Record<string, unknown> = {},
) {
  const { default: DoublePageViewer } = await import(
    "../components/DoublePageViewer"
  );
  const props = {
    pages: mockPages,
    currentIndex: 0,
    readingDirection: "ltr" as const,
    onNext: vi.fn(),
    onPrev: vi.fn(),
    ...overrides,
  };
  const result = render(<DoublePageViewer {...props} />);
  const area = document.querySelector(".spread-image-area")!;
  return { ...result, area, props };
}

// --- 3.1 Basic rendering ---
describe("DoublePageViewer basic rendering", () => {
  it("renders 1 image for cover (index 0)", async () => {
    await renderViewer({ currentIndex: 0 });
    const visibleImgs = document.querySelectorAll(
      ".spread-image-area img:not([style*='display: none'])",
    );
    expect(visibleImgs.length).toBe(1);
  });

  it("renders 2 images for a spread (index 1)", async () => {
    await renderViewer({ currentIndex: 1 });
    const visibleImgs = document.querySelectorAll(
      ".spread-image-area img:not([style*='display: none'])",
    );
    expect(visibleImgs.length).toBe(2);
  });

  it("renders 1 image for last page in odd-total book", async () => {
    const oddPages = mockPages.slice(0, 9); // 9 pages
    const { unmount } = await renderViewer({ pages: oddPages, currentIndex: 7 });
    const visibleImgs = document.querySelectorAll(
      ".spread-image-area img:not([style*='display: none'])",
    );
    expect(visibleImgs.length).toBe(2); // spread [7,8]
    unmount();

    // Now the last solo page
    await renderViewer({ pages: oddPages, currentIndex: 8 });
    const soloImgs = document.querySelectorAll(
      ".spread-image-area img:not([style*='display: none'])",
    );
    expect(soloImgs.length).toBe(1);
  });
});

// --- 3.2 RTL page order ---
describe("DoublePageViewer RTL page order", () => {
  it("LTR: page at lower index appears first in DOM", async () => {
    await renderViewer({ currentIndex: 1, readingDirection: "ltr" });
    const imgs = document.querySelectorAll(
      ".spread-image-area img:not([style*='display: none'])",
    );
    expect(imgs[0].getAttribute("alt")).toBe("Page 2");
    expect(imgs[1].getAttribute("alt")).toBe("Page 3");
  });

  it("RTL: page at higher index appears first in DOM", async () => {
    await renderViewer({ currentIndex: 1, readingDirection: "rtl" });
    const imgs = document.querySelectorAll(
      ".spread-image-area img:not([style*='display: none'])",
    );
    expect(imgs[0].getAttribute("alt")).toBe("Page 3");
    expect(imgs[1].getAttribute("alt")).toBe("Page 2");
  });
});

// --- 3.3 Click navigation (1/4 hot zones) ---
describe("DoublePageViewer click navigation", () => {
  it("LTR: clicking right 1/4 triggers onNext", async () => {
    const { area, props } = await renderViewer({
      currentIndex: 1,
      readingDirection: "ltr",
    });
    vi.spyOn(area as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 0, bottom: 600, height: 600, left: 0, right: 800, width: 800, x: 0, y: 0,
    } as DOMRect);
    // Right 1/4 = 600-800
    fireEvent.click(area, { clientX: 700, clientY: 300 });
    expect(props.onNext).toHaveBeenCalled();
    expect(props.onPrev).not.toHaveBeenCalled();
  });

  it("LTR: clicking left 1/4 triggers onPrev", async () => {
    const { area, props } = await renderViewer({
      currentIndex: 3,
      readingDirection: "ltr",
    });
    vi.spyOn(area as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 0, bottom: 600, height: 600, left: 0, right: 800, width: 800, x: 0, y: 0,
    } as DOMRect);
    // Left 1/4 = 0-200
    fireEvent.click(area, { clientX: 100, clientY: 300 });
    expect(props.onPrev).toHaveBeenCalled();
    expect(props.onNext).not.toHaveBeenCalled();
  });

  it("clicking middle 1/2 triggers neither", async () => {
    const { area, props } = await renderViewer({
      currentIndex: 1,
      readingDirection: "ltr",
    });
    vi.spyOn(area as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 0, bottom: 600, height: 600, left: 0, right: 800, width: 800, x: 0, y: 0,
    } as DOMRect);
    // Middle 1/2 = 200-600
    fireEvent.click(area, { clientX: 400, clientY: 300 });
    expect(props.onNext).not.toHaveBeenCalled();
    expect(props.onPrev).not.toHaveBeenCalled();
  });

  it("RTL: clicking left 1/4 triggers onNext", async () => {
    const { area, props } = await renderViewer({
      currentIndex: 1,
      readingDirection: "rtl",
    });
    vi.spyOn(area as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 0, bottom: 600, height: 600, left: 0, right: 800, width: 800, x: 0, y: 0,
    } as DOMRect);
    // Left 1/4 = 0-200, RTL reverses: left = next
    fireEvent.click(area, { clientX: 100, clientY: 300 });
    expect(props.onNext).toHaveBeenCalled();
    expect(props.onPrev).not.toHaveBeenCalled();
  });

  it("RTL: clicking right 1/4 triggers onPrev", async () => {
    const { area, props } = await renderViewer({
      currentIndex: 3,
      readingDirection: "rtl",
    });
    vi.spyOn(area as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 0, bottom: 600, height: 600, left: 0, right: 800, width: 800, x: 0, y: 0,
    } as DOMRect);
    // Right 1/4 = 600-800, RTL reverses: right = prev
    fireEvent.click(area, { clientX: 700, clientY: 300 });
    expect(props.onPrev).toHaveBeenCalled();
    expect(props.onNext).not.toHaveBeenCalled();
  });
});

// --- 3.4 Preloading ---
describe("DoublePageViewer preloading", () => {
  it("renders hidden preload images for adjacent spreads", async () => {
    await renderViewer({ currentIndex: 3, pages: mockPages });
    const hiddenImgs = document.querySelectorAll(
      'img[style*="display: none"]',
    );
    // Should preload pages from spreads around index 3-4
    const srcs = Array.from(hiddenImgs).map((img) => img.getAttribute("src"));
    // Should include pages from adjacent spreads (1,2 and 5,6,7,8)
    expect(srcs.some((s) => s?.includes("002"))).toBe(true);
    expect(srcs.some((s) => s?.includes("006"))).toBe(true);
  });
});
