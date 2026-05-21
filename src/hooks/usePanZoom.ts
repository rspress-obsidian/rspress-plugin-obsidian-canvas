import { useState, useCallback, useRef } from 'react';

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export function usePanZoom() {
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const cachedRect = useRef<DOMRect | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!isInside) return;
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? -0.1 : 0.1;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setViewport(prev => {
      const newZoom = Math.max(0.1, Math.min(5, prev.zoom + zoomFactor));
      const scale = newZoom / prev.zoom;
      return {
        x: mouseX - scale * (mouseX - prev.x),
        y: mouseY - scale * (mouseY - prev.y),
        zoom: newZoom,
      };
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.target === e.currentTarget)) {
      isPanning.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setViewport(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;

  const zoomIn = useCallback(() => setViewport(p => ({ ...p, zoom: Math.min(5, +(p.zoom + 0.1).toFixed(1)) })), []);
  const zoomOut = useCallback(() => setViewport(p => ({ ...p, zoom: Math.max(0.1, +(p.zoom - 0.1).toFixed(1)) })), []);
  const resetZoom = useCallback(() => setViewport(p => ({ ...p, zoom: 1, x: 0, y: 0 })), []);

  return {
    viewport,
    transform,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
