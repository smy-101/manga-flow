import { useState, useEffect, useRef } from "react";
import "./PageSlider.css";

interface PageSliderProps {
  currentIndex: number;
  totalPages: number;
  onChange: (newIndex: number) => void;
}

export default function PageSlider({
  currentIndex,
  totalPages,
  onChange,
}: PageSliderProps) {
  const [dragValue, setDragValue] = useState(currentIndex + 1);
  const draggingRef = useRef(false);

  // Sync from external currentIndex changes (e.g. keyboard nav) when not dragging
  useEffect(() => {
    if (!draggingRef.current) {
      setDragValue(currentIndex + 1);
    }
  }, [currentIndex]);

  if (totalPages <= 1) return null;

  return (
    <div className="page-slider">
      <input
        type="range"
        className="page-slider__input"
        aria-label="页码"
        min={1}
        max={totalPages}
        value={dragValue}
        onChange={(e) => {
          setDragValue(Number(e.target.value));
        }}
        onPointerDown={(e) => {
          draggingRef.current = true;
          (e.target as HTMLInputElement).setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          draggingRef.current = false;
          onChange(Number((e.target as HTMLInputElement).value) - 1);
        }}
      />
      <span className="page-slider__info">
        {dragValue} / {totalPages}
      </span>
    </div>
  );
}
