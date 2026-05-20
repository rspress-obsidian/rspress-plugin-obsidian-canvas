import type { CanvasNode } from '../types';
import { renderMarkdown } from '../utils/markdown';
import { resolveFileRoute } from '../utils/resolver';

interface CanvasNodeProps {
  node: CanvasNode;
  isHovered?: boolean;
  fileRoutePrefix?: string;
  linkPreview?: boolean;
  onHover?: (nodeId: string | null) => void;
}

function resolveColor(color: string | undefined): string {
  if (!color) return '#e0e0e0';
  if (color.startsWith('#') || color.startsWith('rgb')) return color;
  const presetColors: Record<string, string> = {
    '1': '#e54d4d',
    '2': '#e58c4d',
    '3': '#e5c84d',
    '4': '#4de54d',
    '5': '#4dcee5',
    '6': '#9b4de5',
  };
  return presetColors[color] || color;
}

export function CanvasNodeComponent({ node, isHovered, fileRoutePrefix, linkPreview, onHover }: CanvasNodeProps) {
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
        zIndex: zIndex + (isHovered ? 100 : 0),
        borderLeftColor: node.type === 'group' ? undefined : borderColor,
      }}
      className={`canvas-node canvas-node-${node.type} ${isHovered ? 'canvas-node-hovered' : ''}`}
      onMouseEnter={() => onHover?.(node.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <NodeContent node={node} isHovered={isHovered} fileRoutePrefix={fileRoutePrefix} linkPreview={linkPreview} />
    </div>
  );
}

function NodeContent({ node, isHovered, fileRoutePrefix, linkPreview }: { node: CanvasNode; isHovered?: boolean; fileRoutePrefix?: string; linkPreview?: boolean }) {
  switch (node.type) {
    case 'text':
      return (
        <div className="canvas-node-content canvas-text">
          <div
            className="canvas-markdown"
            style={{
              padding: '12px',
              fontSize: '14px',
              lineHeight: 1.5,
              color: '#333333',
              height: '100%',
              overflow: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(node.text || '') }}
          />
        </div>
      );
    case 'file': {
      const route = resolveFileRoute(node.file, fileRoutePrefix);
      const fileName = node.file.replace(/\.\w+$/, '');
      return (
        <a
          href={route + (node.subpath || '')}
          className="canvas-node-content canvas-file-link"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="canvas-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
          <div className="canvas-file-name">{fileName}</div>
          {node.subpath && (
            <div className="canvas-file-subpath">{node.subpath}</div>
          )}
        </a>
      );
    }
    case 'link':
      if (linkPreview) {
        return (
          <div className="canvas-node-content canvas-link-preview">
            <iframe
              src={node.url}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '6px',
              }}
              title={node.url}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        );
      }
      return (
        <div className="canvas-node-content canvas-link">
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {node.url}
          </a>
        </div>
      );
    case 'group':
      return (
        <div
          className="canvas-node-content canvas-group"
          style={{
            backgroundImage: node.background
              ? `url(${node.background})`
              : undefined,
            backgroundSize:
              node.backgroundStyle === 'cover'
                ? 'cover'
                : node.backgroundStyle === 'ratio'
                  ? 'contain'
                  : node.backgroundStyle === 'repeat'
                    ? 'auto'
                    : 'cover',
            backgroundRepeat:
              node.backgroundStyle === 'repeat' ? 'repeat' : 'no-repeat',
            backgroundPosition: 'center',
          }}
        >
          {node.label && (
            <div className="canvas-group-label">{node.label}</div>
          )}
        </div>
      );
    default:
      return null;
  }
}
