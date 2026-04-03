import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ReaderSettingsPanel", () => {
  const defaultProps = {
    readingMode: "single" as const,
    readingDirection: "ltr" as const,
    totalPages: 10,
    onModeChange: vi.fn(),
    onDirectionChange: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders two setting groups (reading mode + reading direction)", async () => {
    const { default: ReaderSettingsPanel } = await import("../components/ReaderSettingsPanel");
    render(<ReaderSettingsPanel {...defaultProps} />);
    expect(screen.getByText("阅读模式")).toBeInTheDocument();
    expect(screen.getByText("阅读方向")).toBeInTheDocument();
  });

  it("renders mode options", async () => {
    const { default: ReaderSettingsPanel } = await import("../components/ReaderSettingsPanel");
    render(<ReaderSettingsPanel {...defaultProps} />);
    expect(screen.getByText("单页模式")).toBeInTheDocument();
    expect(screen.getByText("连续滚动")).toBeInTheDocument();
    expect(screen.getByText("双页展开")).toBeInTheDocument();
  });

  it("renders direction options", async () => {
    const { default: ReaderSettingsPanel } = await import("../components/ReaderSettingsPanel");
    render(<ReaderSettingsPanel {...defaultProps} />);
    expect(screen.getByText("从左到右")).toBeInTheDocument();
    expect(screen.getByText("从右到左")).toBeInTheDocument();
  });

  it("highlights current values", async () => {
    const { default: ReaderSettingsPanel } = await import("../components/ReaderSettingsPanel");
    render(<ReaderSettingsPanel {...defaultProps} />);
    expect(screen.getByText("单页模式").closest(".settings-option")).toHaveClass("settings-option--active");
    expect(screen.getByText("从左到右").closest(".settings-option")).toHaveClass("settings-option--active");
  });

  it("calls onModeChange when clicking a different mode option", async () => {
    const { default: ReaderSettingsPanel } = await import("../components/ReaderSettingsPanel");
    const onModeChange = vi.fn();
    render(<ReaderSettingsPanel {...defaultProps} onModeChange={onModeChange} />);
    await userEvent.click(screen.getByText("连续滚动"));
    expect(onModeChange).toHaveBeenCalledWith("continuous");
  });

  it("calls onModeChange with 'spread' when clicking 双页展开", async () => {
    const { default: ReaderSettingsPanel } = await import("../components/ReaderSettingsPanel");
    const onModeChange = vi.fn();
    render(<ReaderSettingsPanel {...defaultProps} onModeChange={onModeChange} />);
    await userEvent.click(screen.getByText("双页展开"));
    expect(onModeChange).toHaveBeenCalledWith("spread");
  });

  it("highlights spread mode when active", async () => {
    const { default: ReaderSettingsPanel } = await import("../components/ReaderSettingsPanel");
    render(<ReaderSettingsPanel {...defaultProps} readingMode="spread" />);
    expect(screen.getByText("双页展开").closest(".settings-option")).toHaveClass("settings-option--active");
  });

  it("calls onDirectionChange when clicking a different direction option", async () => {
    const { default: ReaderSettingsPanel } = await import("../components/ReaderSettingsPanel");
    const onDirectionChange = vi.fn();
    render(<ReaderSettingsPanel {...defaultProps} onDirectionChange={onDirectionChange} />);
    await userEvent.click(screen.getByText("从右到左"));
    expect(onDirectionChange).toHaveBeenCalledWith("rtl");
  });

  it("calls onClose when ESC is pressed", async () => {
    const { default: ReaderSettingsPanel } = await import("../components/ReaderSettingsPanel");
    const onClose = vi.fn();
    render(<ReaderSettingsPanel {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("disables spread option when totalPages <= 1", async () => {
    const { default: ReaderSettingsPanel } = await import("../components/ReaderSettingsPanel");
    render(<ReaderSettingsPanel {...defaultProps} totalPages={1} />);
    expect(screen.getByText("双页展开")).toBeDisabled();
  });

  it("enables spread option when totalPages > 1", async () => {
    const { default: ReaderSettingsPanel } = await import("../components/ReaderSettingsPanel");
    render(<ReaderSettingsPanel {...defaultProps} totalPages={2} />);
    expect(screen.getByText("双页展开")).not.toBeDisabled();
  });
});
