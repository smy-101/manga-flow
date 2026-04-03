import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReaderStore } from "../stores/readerStore";

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: (path: string) => `http://asset.localhost/${path}`,
}));

describe("ZoomControl", () => {
  beforeEach(() => {
    useReaderStore.setState({ zoomLevel: 1 });
  });

  async function renderZoomControl() {
    const { default: ZoomControl } = await import("../components/ZoomControl");
    return render(<ZoomControl />);
  }

  it("renders [-] 100% [+] at default zoom", async () => {
    await renderZoomControl();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByTitle("缩小")).toBeInTheDocument();
    expect(screen.getByTitle("放大")).toBeInTheDocument();
  });

  it("displays 125% after zoom in", async () => {
    useReaderStore.setState({ zoomLevel: 1.25 });
    await renderZoomControl();
    expect(screen.getByText("125%")).toBeInTheDocument();
  });

  it("displays 50% for zoomLevel 0.5", async () => {
    useReaderStore.setState({ zoomLevel: 0.5 });
    await renderZoomControl();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("displays 500% at max zoom", async () => {
    useReaderStore.setState({ zoomLevel: 5 });
    await renderZoomControl();
    expect(screen.getByText("500%")).toBeInTheDocument();
  });

  it("calls zoomIn when + button clicked", async () => {
    await renderZoomControl();
    await userEvent.click(screen.getByTitle("放大"));
    expect(useReaderStore.getState().zoomLevel).toBe(1.25);
  });

  it("calls zoomOut when - button clicked", async () => {
    useReaderStore.setState({ zoomLevel: 1.5 });
    await renderZoomControl();
    await userEvent.click(screen.getByTitle("缩小"));
    expect(useReaderStore.getState().zoomLevel).toBe(1.25);
  });

  it("calls resetZoom when percent text clicked and zoomed in", async () => {
    useReaderStore.setState({ zoomLevel: 2 });
    await renderZoomControl();
    await userEvent.click(screen.getByText("200%"));
    expect(useReaderStore.getState().zoomLevel).toBe(1);
  });

  it("does not reset when clicking percent at 100%", async () => {
    await renderZoomControl();
    await userEvent.click(screen.getByText("100%"));
    expect(useReaderStore.getState().zoomLevel).toBe(1);
  });

  it("disables + button at max zoom", async () => {
    useReaderStore.setState({ zoomLevel: 5 });
    await renderZoomControl();
    expect(screen.getByTitle("放大")).toBeDisabled();
  });

  it("disables - button at min zoom", async () => {
    useReaderStore.setState({ zoomLevel: 0.25 });
    await renderZoomControl();
    expect(screen.getByTitle("缩小")).toBeDisabled();
  });

  it("updates display when store zoomLevel changes", async () => {
    const ZoomControl = (await import("../components/ZoomControl")).default;
    const { rerender } = render(<ZoomControl />);
    expect(screen.getByText("100%")).toBeInTheDocument();

    useReaderStore.setState({ zoomLevel: 2 });
    rerender(<ZoomControl />);
    expect(screen.getByText("200%")).toBeInTheDocument();
  });
});
