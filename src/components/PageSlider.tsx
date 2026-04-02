import { useState, useEffect, useRef, useCallback } from "react";
import "./PageSlider.css";

interface PageSliderProps {
  visible: boolean;
  currentIndex: number;
  totalPages: number;
  onChange: (newIndex: number) => void;
}

function calcValue(clientX: number, rect: DOMRect, totalPages: number) {
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return Math.round(ratio * (totalPages - 1)) + 1;
}

export default function PageSlider({
  visible,
  currentIndex,
  totalPages,
  onChange,
}: PageSliderProps) {
  const [dragValue, setDragValue] = useState(currentIndex + 1);
  const pressedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pressedRef.current) {
      setDragValue(currentIndex + 1);
    }
  }, [currentIndex]);

  const updateValue = useCallback(
    (clientX: number) => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDragValue(calcValue(clientX, rect, totalPages));
    },
    [totalPages],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLInputElement>) => {
      e.preventDefault();
      pressedRef.current = true;
      (e.target as Element).setPointerCapture(e.pointerId);
      updateValue(e.clientX);
    },
    [updateValue],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLInputElement>) => {
      if (!pressedRef.current) return;
      updateValue(e.clientX);
    },
    [updateValue],
  );

  const handlePointerUp = useCallback(() => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    // Read latest dragValue from DOM to avoid stale closure
    const value = inputRef.current?.value;
    if (value != null) {
      onChange(Number(value) - 1);
    }
  }, [onChange]);

  if (totalPages <= 1) return null;

  return (
    <div className={`page-slider${visible ? "" : " page-slider--hidden"}`}>
      <input
        ref={inputRef}
        type="range"
        className="page-slider__input"
        aria-label="页码"
        min={1}
        max={totalPages}
        value={dragValue}
        onChange={() => {}}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <span className="page-slider__info">
        {dragValue} / {totalPages}
      </span>
    </div>
  );
}
