import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReaderStore } from "../stores/readerStore";
import { useZoomEvents } from "../hooks/useZoomEvents";

function fireWheel(deltaY: number, ctrlKey = true) {
  window.dispatchEvent(new WheelEvent("wheel", { deltaY, ctrlKey, bubbles: true }));
}

function fireKeyDown(key: string, ctrlKey = true) {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, ctrlKey, bubbles: true }));
}

describe("useZoomEvents", () => {
  let readerEl: HTMLDivElement;

  beforeEach(() => {
    useReaderStore.setState({ zoomLevel: 1 });
    readerEl = document.createElement("div");
    readerEl.className = "reader";
    document.body.appendChild(readerEl);
  });

  afterEach(() => {
    document.body.removeChild(readerEl);
    vi.restoreAllMocks();
  });

  async function setup() {
    return renderHook(() => useZoomEvents());
  }

  function fireDblClick(target?: HTMLElement) {
    const event = new MouseEvent("dblclick", { bubbles: true });
    (target ?? readerEl).dispatchEvent(event);
  }

  // --- Ctrl+Wheel ---

  it("zooms in on Ctrl+scroll up", async () => {
    await setup();
    fireWheel(-100);
    expect(useReaderStore.getState().zoomLevel).toBe(1.25);
  });

  it("zooms out on Ctrl+scroll down", async () => {
    await setup();
    fireWheel(-100);
    fireWheel(100);
    expect(useReaderStore.getState().zoomLevel).toBe(1);
  });

  it("ignores scroll without Ctrl", async () => {
    await setup();
    fireWheel(-100, false);
    expect(useReaderStore.getState().zoomLevel).toBe(1);
  });

  // --- Ctrl+/-/0 ---

  it("zooms in on Ctrl+=", async () => {
    await setup();
    fireKeyDown("=");
    expect(useReaderStore.getState().zoomLevel).toBe(1.25);
  });

  it("zooms in on Ctrl++", async () => {
    await setup();
    fireKeyDown("+");
    expect(useReaderStore.getState().zoomLevel).toBe(1.25);
  });

  it("zooms out on Ctrl+-", async () => {
    await setup();
    fireKeyDown("=");
    fireKeyDown("-");
    expect(useReaderStore.getState().zoomLevel).toBe(1);
  });

  it("resets zoom on Ctrl+0", async () => {
    await setup();
    fireKeyDown("=");
    expect(useReaderStore.getState().zoomLevel).toBe(1.25);
    fireKeyDown("0");
    expect(useReaderStore.getState().zoomLevel).toBe(1);
  });

  it("ignores keys without Ctrl", async () => {
    await setup();
    fireKeyDown("=", false);
    expect(useReaderStore.getState().zoomLevel).toBe(1);
  });

  // --- Double-click ---

  it("zooms to 200% on double-click at 100%", async () => {
    await setup();
    fireDblClick();
    expect(useReaderStore.getState().zoomLevel).toBe(2);
  });

  it("resets to 100% on double-click when zoomed in", async () => {
    const { result } = await setup();
    act(() => { fireDblClick(); }); // 100% → 200%
    expect(useReaderStore.getState().zoomLevel).toBe(2);
    // Re-render hook so it picks up new zoomLevel
    await setup();
    act(() => { fireDblClick(); }); // 200% → 100%
    expect(useReaderStore.getState().zoomLevel).toBe(1);
  });

  it("resets to 100% on double-click when zoomed out", async () => {
    useReaderStore.setState({ zoomLevel: 0.5 });
    await setup();
    fireDblClick();
    expect(useReaderStore.getState().zoomLevel).toBe(1);
  });

  it("ignores double-click on toolbar elements", async () => {
    await setup();
    const toolbar = document.createElement("div");
    toolbar.className = "reader-topbar";
    document.body.appendChild(toolbar);
    fireDblClick(toolbar);
    expect(useReaderStore.getState().zoomLevel).toBe(1);
    document.body.removeChild(toolbar);
  });

  it("ignores double-click on page slider elements", async () => {
    await setup();
    const slider = document.createElement("div");
    slider.className = "page-slider";
    document.body.appendChild(slider);
    fireDblClick(slider);
    expect(useReaderStore.getState().zoomLevel).toBe(1);
    document.body.removeChild(slider);
  });

  // --- Cleanup ---

  it("removes event listeners on unmount", async () => {
    const { unmount } = await setup();
    unmount();
    fireWheel(-100);
    expect(useReaderStore.getState().zoomLevel).toBe(1);
  });
});
