import { useMemo } from 'react';
import { parseCanvas } from '../parser';
import { CanvasRenderer } from './CanvasRenderer';

interface CanvasViewerProps {
  canvasJson: string;
  fileRoutePrefix?: string;
  linkPreview?: boolean;
  iframeSandbox?: string;
}

export default function CanvasViewer({
  canvasJson,
  fileRoutePrefix,
  linkPreview,
  iframeSandbox,
}: CanvasViewerProps) {
  const data = useMemo(() => {
    try {
      return parseCanvas(canvasJson);
    } catch (e) {
      console.error('Failed to parse canvas:', e);
      return null;
    }
  }, [canvasJson]);

  if (!data) {
    return <div className="canvas-error">Failed to load canvas. Check console for details.</div>;
  }

  return (
    <CanvasRenderer
      data={data}
      fileRoutePrefix={fileRoutePrefix}
      linkPreview={linkPreview}
      iframeSandbox={iframeSandbox}
    />
  );
}
