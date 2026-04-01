import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, Routes, Route } from "react-router";

// Mock Tauri API for BookCard
vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: (path: string) => `http://asset.localhost/${path}`,
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={ui} />
      </Routes>
    </BrowserRouter>,
  );
}

describe("Layout", () => {
  it("renders sidebar with logo and title", async () => {
    const { default: Layout } = await import("../components/Layout");
    renderWithRouter(<Layout />);
    expect(screen.getByText("Manga Flow")).toBeInTheDocument();
  });

  it("renders 书库 and 设置 nav links", async () => {
    const { default: Layout } = await import("../components/Layout");
    renderWithRouter(<Layout />);
    expect(screen.getByText("书库")).toBeInTheDocument();
    expect(screen.getByText("设置")).toBeInTheDocument();
  });

  it("书库 link points to /", async () => {
    const { default: Layout } = await import("../components/Layout");
    renderWithRouter(<Layout />);
    const link = screen.getByText("书库").closest("a");
    expect(link).toHaveAttribute("href", "/");
  });

  it("设置 link points to /settings", async () => {
    const { default: Layout } = await import("../components/Layout");
    renderWithRouter(<Layout />);
    const link = screen.getByText("设置").closest("a");
    expect(link).toHaveAttribute("href", "/settings");
  });

  it("renders Outlet content", async () => {
    const { default: Layout } = await import("../components/Layout");
    renderWithRouter(<Layout />);
    // Layout renders Outlet which renders nothing in this test context
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });
});

describe("BookCard", () => {
  const baseBook = {
    id: 1,
    title: "Test Manga",
    cover_path: "/path/to/cover.jpg",
    source_type: "folder",
    book_uuid: "u1",
    created_at: "2026-01-01",
  };

  it("renders book title", async () => {
    const { default: BookCard } = await import("../components/BookCard");
    render(<BookCard book={baseBook} onClick={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Test Manga")).toBeInTheDocument();
  });

  it("renders cover image via convertFileSrc", async () => {
    const { default: BookCard } = await import("../components/BookCard");
    render(<BookCard book={baseBook} onClick={vi.fn()} onDelete={vi.fn()} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "http://asset.localhost//path/to/cover.jpg");
    expect(img).toHaveAttribute("alt", "Test Manga");
  });

  it("shows placeholder when cover_path is empty", async () => {
    const { default: BookCard } = await import("../components/BookCard");
    const book = { ...baseBook, cover_path: "" };
    render(<BookCard book={book} onClick={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByLabelText("无封面")).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", async () => {
    const { default: BookCard } = await import("../components/BookCard");
    const onClick = vi.fn();
    render(<BookCard book={baseBook} onClick={onClick} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByText("Test Manga"));
    expect(onClick).toHaveBeenCalledWith(baseBook);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const { default: BookCard } = await import("../components/BookCard");
    const onDelete = vi.fn();
    const onClick = vi.fn();
    render(<BookCard book={baseBook} onClick={onClick} onDelete={onDelete} />);
    await userEvent.click(screen.getByTitle("删除"));
    expect(onDelete).toHaveBeenCalledWith(baseBook);
    // onClick should NOT be called (stopPropagation)
    expect(onClick).not.toHaveBeenCalled();
  });

  it("delete button has title attribute", async () => {
    const { default: BookCard } = await import("../components/BookCard");
    render(<BookCard book={baseBook} onClick={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTitle("删除")).toBeInTheDocument();
  });
});

describe("ErrorBoundary", () => {
  it("renders children when no error", async () => {
    const { default: ErrorBoundary } = await import("../components/ErrorBoundary");
    render(<ErrorBoundary>子组件</ErrorBoundary>);
    expect(screen.getByText("子组件")).toBeInTheDocument();
  });

  it("renders error UI when child throws", async () => {
    const { default: ErrorBoundary } = await import("../components/ErrorBoundary");
    const Throwing = () => {
      throw new Error("测试错误");
    };
    render(
      <ErrorBoundary>
        <Throwing />
      </ErrorBoundary>,
    );
    expect(screen.getByText("出了点问题")).toBeInTheDocument();
    expect(screen.getByText("测试错误")).toBeInTheDocument();
    expect(screen.getByText("返回书库")).toBeInTheDocument();
  });

  it("shows fallback message when error has no message", async () => {
    const { default: ErrorBoundary } = await import("../components/ErrorBoundary");
    const Throwing = () => {
      throw new Error();
    };
    render(
      <ErrorBoundary>
        <Throwing />
      </ErrorBoundary>,
    );
    expect(screen.getByText("发生了未知错误")).toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  it("returns null when open is false", async () => {
    const { default: ConfirmDialog } = await import("../components/ConfirmDialog");
    const { container } = render(
      <ConfirmDialog open={false} message="test" onClose={vi.fn()} onConfirm={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders message when open is true", async () => {
    const { default: ConfirmDialog } = await import("../components/ConfirmDialog");
    render(<ConfirmDialog open={true} message="确定要删除吗？" onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText("确定要删除吗？")).toBeInTheDocument();
  });

  it("renders default confirm label '确定'", async () => {
    const { default: ConfirmDialog } = await import("../components/ConfirmDialog");
    render(<ConfirmDialog open={true} message="test" onClose={vi.fn()} onConfirm={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    const confirmBtn = buttons.find((b) => b.textContent === "确定");
    expect(confirmBtn).toBeDefined();
  });

  it("renders custom confirmLabel", async () => {
    const { default: ConfirmDialog } = await import("../components/ConfirmDialog");
    render(<ConfirmDialog open={true} message="test" confirmLabel="删除" onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText("删除")).toBeInTheDocument();
  });

  it("applies danger variant class", async () => {
    const { default: ConfirmDialog } = await import("../components/ConfirmDialog");
    render(<ConfirmDialog open={true} message="test" confirmLabel="删除" confirmVariant="danger" onClose={vi.fn()} onConfirm={vi.fn()} />);
    const deleteBtn = screen.getByText("删除");
    expect(deleteBtn.classList.contains("btn--danger")).toBe(true);
  });

  it("applies primary variant class by default", async () => {
    const { default: ConfirmDialog } = await import("../components/ConfirmDialog");
    render(<ConfirmDialog open={true} message="test" onClose={vi.fn()} onConfirm={vi.fn()} />);
    const confirmBtn = screen.getByText("确定");
    expect(confirmBtn.classList.contains("btn--primary")).toBe(true);
  });

  it("calls onClose when cancel button is clicked", async () => {
    const { default: ConfirmDialog } = await import("../components/ConfirmDialog");
    const onClose = vi.fn();
    render(<ConfirmDialog open={true} message="test" onClose={onClose} onConfirm={vi.fn()} />);
    await userEvent.click(screen.getByText("取消"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const { default: ConfirmDialog } = await import("../components/ConfirmDialog");
    const onConfirm = vi.fn();
    render(<ConfirmDialog open={true} message="test" onClose={vi.fn()} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByText("确定"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onClose when overlay is clicked", async () => {
    const { default: ConfirmDialog } = await import("../components/ConfirmDialog");
    const onClose = vi.fn();
    render(<ConfirmDialog open={true} message="test" onClose={onClose} onConfirm={vi.fn()} />);
    const overlay = screen.getByText("test").closest(".modal-overlay")!;
    await userEvent.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when modal content is clicked", async () => {
    const { default: ConfirmDialog } = await import("../components/ConfirmDialog");
    const onClose = vi.fn();
    render(<ConfirmDialog open={true} message="test" onClose={onClose} onConfirm={vi.fn()} />);
    const modal = screen.getByText("test").closest(".modal")!;
    await userEvent.click(modal);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("PageSlider", () => {
  it("renders range input with correct min/max/value", async () => {
    const { default: PageSlider } = await import("../components/PageSlider");
    render(<PageSlider currentIndex={2} totalPages={10} onChange={vi.fn()} />);
    const input = screen.getByRole("slider");
    expect(input).toHaveAttribute("min", "1");
    expect(input).toHaveAttribute("max", "10");
    expect(input).toHaveValue("3");
  });

  it("displays current page and total pages", async () => {
    const { default: PageSlider } = await import("../components/PageSlider");
    render(<PageSlider currentIndex={4} totalPages={20} onChange={vi.fn()} />);
    expect(screen.getByText("5 / 20")).toBeInTheDocument();
  });

  it("does not call onChange during drag, only on release", async () => {
    const { default: PageSlider } = await import("../components/PageSlider");
    const onChange = vi.fn();
    render(<PageSlider currentIndex={0} totalPages={10} onChange={onChange} />);
    const input = screen.getByRole("slider");
    fireEvent.change(input, { target: { value: "5" } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerUp(input, { target: input, pointerId: 1 });
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("hides when totalPages is 1", async () => {
    const { default: PageSlider } = await import("../components/PageSlider");
    const { container } = render(<PageSlider currentIndex={0} totalPages={1} onChange={vi.fn()} />);
    expect(container.querySelector(".page-slider")).toBeNull();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });
});

describe("ContinuousScrollViewer", () => {
  const mockPages = [
    { id: 1, chapter_id: 1, page_index: 1, file_name: "001.jpg", file_path: "/books/uuid/pages/001.jpg" },
    { id: 2, chapter_id: 1, page_index: 2, file_name: "002.jpg", file_path: "/books/uuid/pages/002.jpg" },
    { id: 3, chapter_id: 1, page_index: 3, file_name: "003.jpg", file_path: "/books/uuid/pages/003.jpg" },
  ];

  it("renders images for all pages", async () => {
    const { default: ContinuousScrollViewer } = await import("../components/ContinuousScrollViewer");
    const { container } = render(
      <ContinuousScrollViewer pages={mockPages} currentIndex={0} onVisiblePageChange={vi.fn()} />,
    );
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(3);
  });

  it("renders placeholder divs with correct data attributes", async () => {
    const { default: ContinuousScrollViewer } = await import("../components/ContinuousScrollViewer");
    render(
      <ContinuousScrollViewer pages={mockPages} currentIndex={0} onVisiblePageChange={vi.fn()} />,
    );
    const placeholders = screen.getAllByTestId("scroll-page");
    expect(placeholders).toHaveLength(3);
  });

  it("only renders images within buffer range for many pages", async () => {
    // Use a no-op IntersectionObserver so renderRange stays at initial value
    const SavedIO = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] { return []; }
    } as unknown as typeof IntersectionObserver;

    try {
      const { default: ContinuousScrollViewer } = await import("../components/ContinuousScrollViewer");
      const manyPages = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        chapter_id: 1,
        page_index: i + 1,
        file_name: `${String(i + 1).padStart(3, "0")}.jpg`,
        file_path: `/books/uuid/pages/${String(i + 1).padStart(3, "0")}.jpg`,
      }));
      const { container } = render(
        <ContinuousScrollViewer pages={manyPages} currentIndex={10} onVisiblePageChange={vi.fn()} />,
      );
      // BUFFER=2, currentIndex=10 → initial renderRange=[8,12], 5 pages have <img>, rest placeholders
      const images = container.querySelectorAll("img");
      const placeholders = container.querySelectorAll(".continuous-scroll-page__placeholder");
      expect(images.length).toBe(5);
      expect(placeholders.length).toBe(15);
    } finally {
      globalThis.IntersectionObserver = SavedIO;
    }
  });

  it("calls onVisiblePageChange when scroll detects a new visible page", async () => {
    const { default: ContinuousScrollViewer } = await import("../components/ContinuousScrollViewer");
    const onVisiblePageChange = vi.fn();

    const { container } = render(
      <ContinuousScrollViewer pages={mockPages} currentIndex={0} onVisiblePageChange={onVisiblePageChange} />,
    );

    const viewerContainer = container.querySelector(".continuous-scroll-viewer")!;
    const pageElements = container.querySelectorAll("[data-page-index]");

    // Simulate layout: container 800px tall → center at 400px
    vi.spyOn(viewerContainer as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 0, bottom: 800, height: 800, left: 0, right: 600, width: 600, x: 0, y: 0,
    } as DOMRect);

    // Page 1 spans 200–600px, containing the center point
    vi.spyOn(pageElements[1] as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 200, bottom: 600, height: 400, left: 0, right: 600, width: 600, x: 200, y: 200,
    } as DOMRect);

    fireEvent.scroll(viewerContainer);

    expect(onVisiblePageChange).toHaveBeenCalledWith(1);
  });
});

describe("ReaderToolbar", () => {
  it("renders back button", async () => {
    const { default: ReaderToolbar } = await import("../components/ReaderToolbar");
    render(
      <ReaderToolbar
        pageIndex={0}
        totalPages={10}
        readingMode="single"
        onBack={vi.fn()}
        onModeChange={vi.fn()}
      />,
    );
    expect(screen.getByTitle("返回书库")).toBeInTheDocument();
  });

  it("renders page info", async () => {
    const { default: ReaderToolbar } = await import("../components/ReaderToolbar");
    render(
      <ReaderToolbar
        pageIndex={2}
        totalPages={10}
        readingMode="single"
        onBack={vi.fn()}
        onModeChange={vi.fn()}
      />,
    );
    expect(screen.getByText("3 / 10")).toBeInTheDocument();
  });

  it("renders mode toggle button", async () => {
    const { default: ReaderToolbar } = await import("../components/ReaderToolbar");
    render(
      <ReaderToolbar
        pageIndex={0}
        totalPages={10}
        readingMode="single"
        onBack={vi.fn()}
        onModeChange={vi.fn()}
      />,
    );
    expect(screen.getByTitle("连续滚动")).toBeInTheDocument();
  });

  it("calls onBack when back button clicked", async () => {
    const { default: ReaderToolbar } = await import("../components/ReaderToolbar");
    const onBack = vi.fn();
    render(
      <ReaderToolbar
        pageIndex={0}
        totalPages={10}
        readingMode="single"
        onBack={onBack}
        onModeChange={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByTitle("返回书库"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("calls onModeChange when mode toggle clicked", async () => {
    const { default: ReaderToolbar } = await import("../components/ReaderToolbar");
    const onModeChange = vi.fn();
    render(
      <ReaderToolbar
        pageIndex={0}
        totalPages={10}
        readingMode="single"
        onBack={vi.fn()}
        onModeChange={onModeChange}
      />,
    );
    await userEvent.click(screen.getByTitle("连续滚动"));
    expect(onModeChange).toHaveBeenCalledWith("continuous");
  });

  it("reflects current mode via aria-pressed", async () => {
    const { default: ReaderToolbar } = await import("../components/ReaderToolbar");
    const { rerender } = render(
      <ReaderToolbar
        pageIndex={0}
        totalPages={10}
        readingMode="single"
        onBack={vi.fn()}
        onModeChange={vi.fn()}
      />,
    );
    expect(screen.getByTitle("连续滚动")).toHaveAttribute("aria-pressed", "false");

    const { default: ReaderToolbar2 } = await import("../components/ReaderToolbar");
    rerender(
      <ReaderToolbar2
        pageIndex={0}
        totalPages={10}
        readingMode="continuous"
        onBack={vi.fn()}
        onModeChange={vi.fn()}
      />,
    );
    expect(screen.getByTitle("单页模式")).toHaveAttribute("aria-pressed", "true");
  });
});
