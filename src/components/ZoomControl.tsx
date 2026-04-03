import { useReaderStore } from "../stores/readerStore";
import "./ZoomControl.css";

export default function ZoomControl() {
  const zoomLevel = useReaderStore((s) => s.zoomLevel);
  const zoomIn = useReaderStore((s) => s.zoomIn);
  const zoomOut = useReaderStore((s) => s.zoomOut);
  const resetZoom = useReaderStore((s) => s.resetZoom);

  const percent = Math.round(zoomLevel * 100);

  return (
    <div className="zoom-control">
      <button
        className="zoom-control__btn"
        onClick={zoomOut}
        disabled={zoomLevel <= 0.25}
        title="缩小"
      >
        −
      </button>
      <button
        className="zoom-control__percent"
        onClick={() => { if (zoomLevel !== 1) resetZoom(); }}
        title="重置缩放"
      >
        {percent}%
      </button>
      <button
        className="zoom-control__btn"
        onClick={zoomIn}
        disabled={zoomLevel >= 5}
        title="放大"
      >
        +
      </button>
    </div>
  );
}
