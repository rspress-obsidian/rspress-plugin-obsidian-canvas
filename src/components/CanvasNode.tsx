import { useMemo } from 'react';
import type { CanvasNode } from '../types';
import { renderMarkdown } from '../utils/markdown';
import { resolveFileRoute } from '../utils/resolver';

interface CanvasNodeProps {
  node: CanvasNode;
  isHovered?: boolean;
  isSelected?: boolean;
  fileRoutePrefix?: string;
  linkPreview?: boolean;
  onHover?: (nodeId: string | null) => void;
  onClick?: (nodeId: string) => void;
}

function resolveColor(color: string | undefined): string {
  if (!color) return 'var(--canvas-node-border)';
  if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('var')) return color;
  const presetColors: Record<string, string> = {
    '1': 'var(--canvas-color-1)',
    '2': 'var(--canvas-color-2)',
    '3': 'var(--canvas-color-3)',
    '4': 'var(--canvas-color-4)',
    '5': 'var(--canvas-color-5)',
    '6': 'var(--canvas-color-6)',
  };
  return presetColors[color] || color;
}

function resolveBgColor(color: string | undefined, type: string): string | undefined {
  if (type === 'group') {
    if (!color) return 'var(--canvas-group-bg)';
    const presetBgs: Record<string, string> = {
      '1': 'rgba(239, 68, 68, 0.03)',
      '2': 'rgba(249, 115, 22, 0.03)',
      '3': 'rgba(234, 179, 8, 0.03)',
      '4': 'rgba(34, 197, 94, 0.03)',
      '5': 'rgba(6, 182, 212, 0.03)',
      '6': 'rgba(168, 85, 247, 0.03)',
    };
    return presetBgs[color] || 'var(--canvas-group-bg)';
  } else {
    if (!color) return 'var(--canvas-node-bg)';
    const presetBgs: Record<string, string> = {
      '1': 'var(--canvas-bg-color-1-tint)',
      '2': 'var(--canvas-bg-color-2-tint)',
      '3': 'var(--canvas-bg-color-3-tint)',
      '4': 'var(--canvas-bg-color-4-tint)',
      '5': 'var(--canvas-bg-color-5-tint)',
      '6': 'var(--canvas-bg-color-6-tint)',
    };
    return presetBgs[color] || 'var(--canvas-node-bg)';
  }
}

export function CanvasNodeComponent({
  node,
  isHovered,
  isSelected,
  fileRoutePrefix,
  linkPreview,
  onHover,
  onClick,
}: CanvasNodeProps) {
  const borderColor = resolveColor(node.color);
  const zIndex = node.type === 'group' ? 0 : 10;

  return (
    <div
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: zIndex + (isHovered ? 100 : 0) + (isSelected ? 120 : 0),
        borderLeftColor: node.type === 'group' ? undefined : borderColor,
        borderColor: node.color && node.type !== 'group' ? borderColor : undefined,
        backgroundColor: resolveBgColor(node.color, node.type),
        overflow: node.type === 'group' ? 'visible' : 'hidden', // Allow group badges to overflow beautifully
      }}
      className={`canvas-node canvas-node-${node.type} ${isHovered ? 'canvas-node-hovered' : ''} ${
        isSelected ? 'canvas-node-selected' : ''
      }`}
      role={node.type === 'group' ? 'group' : 'article'}
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
        // Prevent viewport pan/drag from starting when interacting with nodes
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(node.id);
      }}>
      <NodeContent
        node={node}
        isHovered={isHovered}
        fileRoutePrefix={fileRoutePrefix}
        linkPreview={linkPreview}
      />
    </div>
  );
}

function NodeContent({
  node,
  isHovered,
  fileRoutePrefix,
  linkPreview,
}: {
  node: CanvasNode;
  isHovered?: boolean;
  fileRoutePrefix?: string;
  linkPreview?: boolean;
}) {
  const borderColor = resolveColor(node.color);

  const renderedMarkdown = useMemo(
    () => (node.type === 'text' ? renderMarkdown(node.text || '') : ''),
    [node.type, node.text],
  );

  switch (node.type) {
    case 'text':
      return (
        <div className="canvas-node-content canvas-text">
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
                style={{ color: node.color ? '#ffffff' : undefined }}>
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
                style={{ color: node.color ? '#ffffff' : undefined }}>
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

      // Render markdown text content inline if enriched with file content
      if ('fileContent' in node && node.fileContent !== undefined) {
        const fileMarkdown = renderMarkdown(node.fileContent);
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
                style={{ color: node.color ? '#ffffff' : undefined }}>
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
                  style={{ color: node.color ? '#ffffff' : undefined }}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
            <div className="canvas-node-file-body">
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
            strokeWidth="1.5">
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
                style={{ color: node.color ? '#ffffff' : undefined }}>
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
                sandbox="allow-scripts allow-same-origin allow-popups"
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
