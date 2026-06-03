import { useEffect, useState } from 'react';
import type { CanvasData } from '../types';
import { CanvasRenderer } from './CanvasRenderer';

interface CanvasEmbedProps {
  src: string;
  fileRoutePrefix?: string;
  linkPreview?: boolean;
}

export default function CanvasEmbed({ src, fileRoutePrefix, linkPreview }: CanvasEmbedProps) {
  const [data, setData] = useState<CanvasData | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'loaded'>('loading');

  useEffect(() => {
    let cancelled = false;

    const loadCanvas = async () => {
      setStatus('loading');
      const jsonPath = src.replace(/\.canvas$/i, '').replace(/\.json$/i, '');
      const url = `/__canvases__/${jsonPath}.json`;

      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Canvas not found: ${src} (${res.status})`);
        }
        const json: CanvasData = await res.json();
        if (!cancelled) {
          setData(json);
          setStatus('loaded');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          console.error('[CanvasEmbed] Failed to load canvas:', err);
        }
      }
    };

    loadCanvas();

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (status === 'loading') {
    return (
      <div className="canvas-embed-loading">
        <div className="canvas-embed-spinner" />
        <span>Loading canvas…</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="canvas-embed-error">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label="Error">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          Could not load canvas: <code>{src}</code>
        </span>
      </div>
    );
  }

  if (!data) return null;

  return <CanvasRenderer data={data} fileRoutePrefix={fileRoutePrefix} linkPreview={linkPreview} />;
}
