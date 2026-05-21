import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePanZoom } from '../hooks/usePanZoom';
import type { CanvasData } from '../types';
import { CanvasEdge } from './CanvasEdge';
import { CanvasNodeComponent } from './CanvasNode';

interface CanvasRendererProps {
  data: CanvasData;
  fileRoutePrefix?: string;
  linkPreview?: boolean;
}

function resolveColor(color: string | undefined): string {
  if (!color) return 'var(--canvas-edge-color)';
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

export function CanvasRenderer({ data, fileRoutePrefix, linkPreview }: CanvasRendererProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const {
    viewport,
    setViewport,
    transform,
    setContainerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    zoomIn,
    zoomOut,
    resetZoom,
  } = usePanZoom();

  const nodeMap = useMemo(() => {
    const map = new Map<string, CanvasData['nodes'][number]>();
    for (const node of data.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [data.nodes]);

  const connectedEdgeIds = useMemo(() => {
    const activeNodeId = hoveredNodeId || selectedNodeId;
    if (!activeNodeId) return new Set<string>();
    const ids = new Set<string>();
    for (const edge of data.edges) {
      if (edge.fromNode === activeNodeId || edge.toNode === activeNodeId) {
        ids.add(edge.id);
      }
    }
    return ids;
  }, [hoveredNodeId, selectedNodeId, data.edges]);

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  const sortedNodes = useMemo(
    () =>
      [...data.nodes].sort((a, b) => {
        if (a.type === 'group' && b.type !== 'group') return -1;
        if (b.type === 'group' && a.type !== 'group') return 1;
        return 0;
      }),
    [data.nodes],
  );

  const fitToView = useCallback(() => {
    if (data.nodes.length === 0) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const node of data.nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    }

    const boundingWidth = maxX - minX;
    const boundingHeight = maxY - minY;
    const centerX = minX + boundingWidth / 2;
    const centerY = minY + boundingHeight / 2;

    let viewportWidth = 800;
    let viewportHeight = 500;
    const viewportEl = document.querySelector('.canvas-viewport');
    if (viewportEl) {
      const rect = viewportEl.getBoundingClientRect();
      viewportWidth = rect.width || 800;
      viewportHeight = rect.height || 500;
    }

    const padding = 80;
    const zoomX = (viewportWidth - padding) / boundingWidth;
    const zoomY = (viewportHeight - padding) / boundingHeight;
    const bestZoom = Math.max(0.15, Math.min(1.5, Math.min(zoomX, zoomY)));

    const x = viewportWidth / 2 - centerX * bestZoom;
    const y = viewportHeight / 2 - centerY * bestZoom;

    setViewport({ x, y, zoom: bestZoom });
  }, [data.nodes, setViewport]);

  // Recenter on load
  useEffect(() => {
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        fitToView();
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitToView]);

  const handleViewportClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedNodeId(null);
    }
  }, []);

  const handleViewportDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        fitToView();
      }
    },
    [fitToView],
  );

  return (
    <div className="canvas-container">
      <div
        ref={setContainerRef}
        className="canvas-viewport"
        role="application"
        aria-label="Interactive canvas with nodes and connections"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleViewportClick}
        onDoubleClick={handleViewportDoubleClick}>
        <div className="canvas-world" style={{ transform }}>
          {/* Real Infinite Zooming Background Grid */}
          {showGrid && <div className="canvas-background" aria-hidden="true" />}

          <svg
            className="canvas-edges"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              left: 0,
              top: 0,
              width: 1,
              height: 1,
            }}
            aria-hidden="true">
            <defs>
              {data.edges.map((edge) => {
                const color = resolveColor(edge.color);
                return (
                  <g key={edge.id}>
                    <marker
                      id={`arrowhead-${edge.id}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                    </marker>
                    <marker
                      id={`arrowhead-start-${edge.id}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="1"
                      refY="3.5"
                      orient="auto">
                      <polygon points="10 0, 0 3.5, 10 7" fill={color} />
                    </marker>
                  </g>
                );
              })}
            </defs>
            {data.edges.map((edge) => (
              <CanvasEdge
                key={edge.id}
                edge={edge}
                nodeMap={nodeMap}
                isHighlighted={connectedEdgeIds.has(edge.id)}
              />
            ))}
          </svg>
          {sortedNodes.map((node) => (
            <CanvasNodeComponent
              key={node.id}
              node={node}
              isHovered={node.id === hoveredNodeId}
              isSelected={node.id === selectedNodeId}
              fileRoutePrefix={fileRoutePrefix}
              linkPreview={linkPreview}
              onHover={handleNodeHover}
              onClick={(nodeId) => setSelectedNodeId(nodeId)}
            />
          ))}
        </div>
      </div>

      {/* Floating Vertical Toolbar (upper right) */}
      <div className="canvas-toolbar" role="toolbar" aria-label="Canvas vertical controls">
        <button
          className={`canvas-toolbar-btn ${!showGrid ? 'canvas-btn-inactive' : ''}`}
          onClick={() => setShowGrid((p) => !p)}
          title="Toggle Grid Dots"
          aria-label="Toggle Grid Dots">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        <div className="canvas-toolbar-sep" />
        <button
          className="canvas-toolbar-btn"
          onClick={zoomIn}
          title="Zoom In"
          aria-label="Zoom in">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          className="canvas-toolbar-btn"
          onClick={resetZoom}
          title="Reset Scale (1:1)"
          aria-label="Reset zoom (1:1)">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button
          className="canvas-toolbar-btn"
          onClick={fitToView}
          title="Fit to View"
          aria-label="Fit to View">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6" />
          </svg>
        </button>
        <button
          className="canvas-toolbar-btn"
          onClick={zoomOut}
          title="Zoom Out"
          aria-label="Zoom out">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div className="canvas-toolbar-sep" />
        <button
          className="canvas-toolbar-btn canvas-btn-disabled"
          title="Undo"
          aria-label="Undo"
          disabled>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>
        <button
          className="canvas-toolbar-btn canvas-btn-disabled"
          title="Redo"
          aria-label="Redo"
          disabled>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
          </svg>
        </button>
        <div className="canvas-toolbar-sep" />
        <button
          className={`canvas-toolbar-btn ${showHelp ? 'canvas-btn-active' : ''}`}
          onClick={() => setShowHelp((p) => !p)}
          title="Help & Info"
          aria-label="Help">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
          </svg>
        </button>
      </div>

      {/* Sleek Floating Help Dialog */}
      {showHelp && (
        <div className="canvas-help-modal">
          <div className="canvas-help-header">
            <h3>Canvas Controls</h3>
            <button className="canvas-help-close" onClick={() => setShowHelp(false)}>
              ×
            </button>
          </div>
          <div className="canvas-help-body">
            <div className="canvas-help-row">
              <span className="canvas-help-key">Pan</span>
              <span className="canvas-help-desc">Hold Left / Middle Mouse & Drag</span>
            </div>
            <div className="canvas-help-row">
              <span className="canvas-help-key">Zoom</span>
              <span className="canvas-help-desc">Scroll Mouse Wheel</span>
            </div>
            <div className="canvas-help-row">
              <span className="canvas-help-key">Fit All</span>
              <span className="canvas-help-desc">Double-click background or Fit icon (⛶)</span>
            </div>
            <div className="canvas-help-row">
              <span className="canvas-help-key">Reset scale</span>
              <span className="canvas-help-desc">Click center target icon (1:1)</span>
            </div>
            <div className="canvas-help-row">
              <span className="canvas-help-key">Toggle grid</span>
              <span className="canvas-help-desc">Click settings gear icon</span>
            </div>
            <div className="canvas-help-row">
              <span className="canvas-help-key">Select card</span>
              <span className="canvas-help-desc">Click note. Click space to clear focus</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
