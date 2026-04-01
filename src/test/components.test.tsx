import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
