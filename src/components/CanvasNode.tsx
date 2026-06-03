import { useMemo } from 'react';
import type { CanvasNode } from '../types';
import { resolveColor, resolveNodeBgColor } from '../utils/color';
import { renderMarkdown } from '../utils/markdown';
import { resolveFileRoute } from '../utils/resolver';

interface CanvasNodeProps {
  node: CanvasNode;
  isHovered?: boolean;
  isSelected?: boolean;
  fileRoutePrefix?: string;
  linkPreview?: boolean;
  iframeSandbox?: string;
  onHover?: (nodeId: string | null) => void;
  onClick?: (nodeId: string) => void;
  onKeyDown?: (e: React.KeyboardEvent, nodeId: string) => void;
  onNodeDrag?: (nodeId: string, x: number, y: number) => void;
  onNodeResize?: (nodeId: string, width: number, height: number) => void;
}

export function CanvasNodeComponent({
  node,
  isHovered,
  isSelected,
  fileRoutePrefix,
  linkPreview,
  iframeSandbox,
  onHover,
  onClick,
  onKeyDown,
  onNodeDrag,
  onNodeResize,
}: CanvasNodeProps) {
  const borderColor = resolveColor(node.color);
  const zIndex = node.type === 'group' ? 0 : 10;

  const handleDragStart = (e: React.PointerEvent) => {
    if (node.type === 'group') return;
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startNodeX = node.x;
    const startNodeY = node.y;

    const viewport = document.querySelector('.canvas-viewport') as HTMLElement | null;
    const zoom = viewport
      ? Number.parseFloat(
          getComputedStyle(document.querySelector('.canvas-world') as HTMLElement).scale || '1',
        )
      : 1;

    const onMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      const newX = Math.round(startNodeX + dx);
      const newY = Math.round(startNodeY + dy);
      onNodeDrag?.(node.id, newX, newY);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleResizeStart =
    (corner: 'nw' | 'ne' | 'sw' | 'se') => (e: React.PointerEvent) => {
      if (node.type === 'group') return;
      e.stopPropagation();
      e.preventDefault();

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = node.width;
      const startH = node.height;
      const startNodeX = node.x;
      const startNodeY = node.y;

      const viewport = document.querySelector('.canvas-viewport') as HTMLElement | null;
      const zoom = viewport
        ? Number.parseFloat(
            getComputedStyle(document.querySelector('.canvas-world') as HTMLElement).scale || '1',
          )
        : 1;

      const MIN_SIZE = 80;

      const onMove = (moveEvent: PointerEvent) => {
        const dx = (moveEvent.clientX - startX) / zoom;
        const dy = (moveEvent.clientY - startY) / zoom;

        let newW = startW;
        let newH = startH;
        let newX = startNodeX;
        let newY = startNodeY;

        if (corner.includes('e')) {
          newW = Math.max(MIN_SIZE, Math.round(startW + dx));
        }
        if (corner.includes('w')) {
          const rawW = startW - dx;
          newW = Math.max(MIN_SIZE, Math.round(rawW));
          newX = Math.round(startNodeX + (startW - newW));
        }
        if (corner.includes('s')) {
          newH = Math.max(MIN_SIZE, Math.round(startH + dy));
        }
        if (corner.includes('n')) {
          const rawH = startH - dy;
          newH = Math.max(MIN_SIZE, Math.round(rawH));
          newY = Math.round(startNodeY + (startH - newH));
        }

        onNodeResize?.(node.id, newW, newH);
        if (corner.includes('w') || corner.includes('n')) {
          onNodeDrag?.(node.id, newX, newY);
        }
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

  const canInteract = node.type !== 'group';
  const showResizeHandles = isSelected && canInteract;

  return (
    <div
      data-node-id={node.id}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: zIndex + (isHovered ? 100 : 0) + (isSelected ? 120 : 0),
        borderLeftColor: node.type === 'group' ? undefined : borderColor,
        borderColor: node.color && node.type !== 'group' ? borderColor : undefined,
        backgroundColor: resolveNodeBgColor(node.color, node.type),
        overflow: node.type === 'group' ? 'visible' : 'hidden',
        cursor: canInteract ? 'grab' : 'default',
      }}
      className={`canvas-node canvas-node-${node.type} ${isHovered ? 'canvas-node-hovered' : ''} ${
        isSelected ? 'canvas-node-selected' : ''
      }`}
      role="button"
      aria-label={
        node.type === 'text'
          ? 'Text node'
          : node.type === 'file'
            ? `File: ${node.file}`
            : node.type === 'link'
              ? `Link: ${node.url}`
              : node.type === 'group'
                ? node.label || 'Group'
                : 'Canvas node'
      }
      onMouseEnter={() => onHover?.(node.id)}
      onMouseLeave={() => onHover?.(null)}
      onPointerDown={(e) => {
        if (canInteract) {
          handleDragStart(e);
        } else {
          e.stopPropagation();
        }
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onClick?.(node.id);
        } else {
          onKeyDown?.(e, node.id);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(node.id);
      }}>
      <NodeContent
        node={node}
        fileRoutePrefix={fileRoutePrefix}
        linkPreview={linkPreview}
        iframeSandbox={iframeSandbox}
      />
      {showResizeHandles && (
        <>
          <div
            className="canvas-resize-handle canvas-resize-nw"
            onPointerDown={handleResizeStart('nw')}
          />
          <div
            className="canvas-resize-handle canvas-resize-ne"
            onPointerDown={handleResizeStart('ne')}
          />
          <div
            className="canvas-resize-handle canvas-resize-sw"
            onPointerDown={handleResizeStart('sw')}
          />
          <div
            className="canvas-resize-handle canvas-resize-se"
            onPointerDown={handleResizeStart('se')}
          />
        </>
      )}
    </div>
  );
}

function NodeContent({
  node,
  fileRoutePrefix,
  linkPreview,
  iframeSandbox,
}: {
  node: CanvasNode;
  fileRoutePrefix?: string;
  linkPreview?: boolean;
  iframeSandbox?: string;
}) {
  const borderColor = resolveColor(node.color);

  const renderedMarkdown = useMemo(
    () => (node.type === 'text' ? renderMarkdown(node.text || '', fileRoutePrefix) : ''),
    [node.type, node.text, fileRoutePrefix],
  );

  switch (node.type) {
    case 'text':
      return (
        <div className="canvas-node-content canvas-text">
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized via sanitizeHtml() */}
          <div className="canvas-markdown" dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
        </div>
      );
    case 'file': {
      const route = resolveFileRoute(node.file, fileRoutePrefix);
      const fileName = node.file.replace(/\.\w+$/, '');
      const titleText = node.subpath ? `${fileName} > ${node.subpath.substring(1)}` : fileName;

      // Render image inline if enriched as image
      if ('isImage' in node && node.isImage && 'imageUrl' in node && node.imageUrl) {
        return (
          <div className="canvas-node-content">
            <div
              className="canvas-node-file-header"
              style={{
                backgroundColor: node.color ? borderColor : undefined,
                color: node.color ? '#ffffff' : undefined,
              }}>
              <svg
                className="canvas-node-file-header-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: node.color ? '#ffffff' : undefined }}
                role="img"
                aria-label="Image">
                <title>Image</title>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="canvas-node-file-header-title">{node.file}</span>
            </div>
            <div className="canvas-node-file-body">
              <div className="canvas-file-image-container">
                <img className="canvas-file-image" src={node.imageUrl} alt={node.file} />
              </div>
            </div>
          </div>
        );
      }

      // Render file error fallback if subpath failed to resolve
      if ('isError' in node && node.isError) {
        return (
          <div className="canvas-node-content">
            <div
              className="canvas-node-file-header"
              style={{
                backgroundColor: node.color ? borderColor : undefined,
                color: node.color ? '#ffffff' : undefined,
              }}>
              <svg
                className="canvas-node-file-header-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: node.color ? '#ffffff' : undefined }}
                role="img"
                aria-label="Error">
                <title>Error</title>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              </svg>
              <span className="canvas-node-file-header-title">{titleText}</span>
            </div>
            <div className="canvas-node-file-body canvas-file-error-body">
              <div className="canvas-file-error-text">{node.fileContent}</div>
            </div>
          </div>
        );
      }

      if ('isVideo' in node && node.isVideo && 'imageUrl' in node && node.imageUrl) {
        return (
          <div className="canvas-node-content">
            <div
              className="canvas-node-file-header"
              style={{
                backgroundColor: node.color ? borderColor : undefined,
                color: node.color ? '#ffffff' : undefined,
              }}>
              <svg
                className="canvas-node-file-header-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: node.color ? '#ffffff' : undefined }}
                role="img"
                aria-label="File">
                <title>File</title>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              </svg>
              <span className="canvas-node-file-header-title">{node.file}</span>
            </div>
            <div className="canvas-node-file-body">
              <video className="canvas-file-video" src={node.imageUrl} controls></video>
            </div>
          </div>
        );
      }

      if ('isAudio' in node && node.isAudio && 'imageUrl' in node && node.imageUrl) {
        return (
          <div className="canvas-node-content">
            <div
              className="canvas-node-file-header"
              style={{
                backgroundColor: node.color ? borderColor : undefined,
                color: node.color ? '#ffffff' : undefined,
              }}>
              <svg
                className="canvas-node-file-header-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: node.color ? '#ffffff' : undefined }}
                role="img"
                aria-label="Audio">
                <title>Audio</title>
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <span className="canvas-node-file-header-title">{node.file}</span>
            </div>
            <div className="canvas-node-file-body canvas-file-audio-body">
              <audio className="canvas-file-audio" src={node.imageUrl} controls></audio>
            </div>
          </div>
        );
      }

      if ('isPdf' in node && node.isPdf && 'imageUrl' in node && node.imageUrl) {
        return (
          <div className="canvas-node-content">
            <div
              className="canvas-node-file-header"
              style={{
                backgroundColor: node.color ? borderColor : undefined,
                color: node.color ? '#ffffff' : undefined,
              }}>
              <svg
                className="canvas-node-file-header-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: node.color ? '#ffffff' : undefined }}
                role="img"
                aria-label="PDF">
                <title>PDF</title>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="canvas-node-file-header-title">{node.file}</span>
            </div>
            <div className="canvas-node-file-body">
              <iframe
                className="canvas-file-pdf"
                src={node.imageUrl}
                title={node.file}
                sandbox={iframeSandbox}
              />
            </div>
          </div>
        );
      }

      // Render markdown text content inline if enriched with file content
      if ('fileContent' in node && node.fileContent !== undefined) {
        const fileMarkdown = renderMarkdown(node.fileContent, fileRoutePrefix);
        return (
          <div className="canvas-node-content">
            <div
              className="canvas-node-file-header"
              style={{
                backgroundColor: node.color ? borderColor : undefined,
                color: node.color ? '#ffffff' : undefined,
              }}>
              <svg
                className="canvas-node-file-header-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: node.color ? '#ffffff' : undefined }}
                role="img"
                aria-label="Note">
                <title>Note</title>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              </svg>
              <span className="canvas-node-file-header-title">{titleText}</span>
              <a
                href={route + (node.subpath || '')}
                className="canvas-node-file-header-link"
                title="Open note page"
                onClick={(e) => e.stopPropagation()}>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: node.color ? '#ffffff' : undefined }}
                  role="img"
                  aria-label="Open">
                  <title>Open</title>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
            <div className="canvas-node-file-body">
              {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized via sanitizeHtml() */}
              <div className="canvas-markdown" dangerouslySetInnerHTML={{ __html: fileMarkdown }} />
            </div>
          </div>
        );
      }

      // Fallback simple link card
      return (
        <a
          href={route + (node.subpath || '')}
          className="canvas-node-content canvas-file-fallback"
          onClick={(e) => e.stopPropagation()}>
          <svg
            className="canvas-file-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            role="img"
            aria-label="File">
            <title>File</title>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          </svg>
          <div className="canvas-file-name">{fileName}</div>
          {node.subpath && <div className="canvas-file-subpath">{node.subpath}</div>}
        </a>
      );
    }
    case 'link':
      if (linkPreview) {
        const titleText = node.url.replace(/^https?:\/\//, '');
        return (
          <div className="canvas-node-content">
            <div
              className="canvas-node-file-header"
              style={{
                backgroundColor: node.color ? borderColor : undefined,
                color: node.color ? '#ffffff' : undefined,
              }}>
              <svg
                className="canvas-node-file-header-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: node.color ? '#ffffff' : undefined }}
                role="img"
                aria-label="Link">
                <title>Link</title>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="canvas-node-file-header-title">{titleText}</span>
            </div>
            <div className="canvas-node-file-body">
              <iframe
                src={node.url}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                title={node.url}
                sandbox={iframeSandbox}
              />
            </div>
          </div>
        );
      }
      return (
        <div className="canvas-node-content canvas-link">
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}>
            {node.url}
          </a>
        </div>
      );
    case 'group':
      return (
        <div
          className="canvas-node-content canvas-group"
          style={{
            backgroundImage: node.background ? `url(${node.background})` : undefined,
            backgroundSize:
              node.backgroundStyle === 'cover'
                ? 'cover'
                : node.backgroundStyle === 'ratio'
                  ? 'contain'
                  : node.backgroundStyle === 'repeat'
                    ? 'auto'
                    : 'cover',
            backgroundRepeat: node.backgroundStyle === 'repeat' ? 'repeat' : 'no-repeat',
            backgroundPosition: 'center',
          }}>
          {node.label && (
            <div
              className="canvas-group-label"
              style={{
                backgroundColor: node.color ? borderColor : undefined,
              }}>
              {node.label}
            </div>
          )}
        </div>
      );
    default:
      return null;
  }
}
