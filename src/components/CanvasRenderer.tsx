import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePanZoom } from '../hooks/usePanZoom';
import type { CanvasData, CanvasNode } from '../types';
import { resolveColor } from '../utils/color';
import { CanvasEdge } from './CanvasEdge';
import { CanvasNodeComponent } from './CanvasNode';

interface CanvasRendererProps {
  data: CanvasData;
  fileRoutePrefix?: string;
  linkPreview?: boolean;
  iframeSandbox?: string;
}

interface NodeOverride {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export function CanvasRenderer({
  data,
  fileRoutePrefix,
  linkPreview,
  iframeSandbox,
}: CanvasRendererProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [nodeOverrides, setNodeOverrides] = useState<Map<string, NodeOverride>>(new Map());

  const {
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

  const mergedNodes = useMemo(() => {
    if (nodeOverrides.size === 0) return data.nodes;
    return data.nodes.map((node) => {
      const override = nodeOverrides.get(node.id);
      if (!override) return node;
      return {
        ...node,
        x: override.x ?? node.x,
        y: override.y ?? node.y,
        width: override.width ?? node.width,
        height: override.height ?? node.height,
      } as CanvasNode;
    });
  }, [data.nodes, nodeOverrides]);

  const mergedNodeMap = useMemo(() => {
    const map = new Map<string, CanvasNode>();
    for (const node of mergedNodes) {
      map.set(node.id, node);
    }
    return map;
  }, [mergedNodes]);

  const handleNodeDrag = useCallback((nodeId: string, x: number, y: number) => {
    setNodeOverrides((prev) => {
      const next = new Map(prev);
      const existing = next.get(nodeId) ?? {};
      next.set(nodeId, { ...existing, x, y });
      return next;
    });
  }, []);

  const handleNodeResize = useCallback((nodeId: string, width: number, height: number) => {
    setNodeOverrides((prev) => {
      const next = new Map(prev);
      const existing = next.get(nodeId) ?? {};
      next.set(nodeId, { ...existing, width, height });
      return next;
    });
  }, []);

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

  const handleNodeKeyDown = useCallback(
    (e: React.KeyboardEvent, currentNodeId: string) => {
      const currentNode = mergedNodeMap.get(currentNodeId);
      if (!currentNode) return;

      const direction = e.key;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(direction)) return;

      let targetNode: CanvasNode | null = null;
      let minDistance = Infinity;

      for (const node of mergedNodes) {
        if (node.id === currentNodeId) continue;

        const currentCenterX = currentNode.x + currentNode.width / 2;
        const currentCenterY = currentNode.y + currentNode.height / 2;
        const nodeCenterX = node.x + node.width / 2;
        const nodeCenterY = node.y + node.height / 2;

        let isValidDirection = false;
        if (direction === 'ArrowUp' && nodeCenterY < currentCenterY) isValidDirection = true;
        if (direction === 'ArrowDown' && nodeCenterY > currentCenterY) isValidDirection = true;
        if (direction === 'ArrowLeft' && nodeCenterX < currentCenterX) isValidDirection = true;
        if (direction === 'ArrowRight' && nodeCenterX > currentCenterX) isValidDirection = true;

        if (isValidDirection) {
          const dx = Math.abs(nodeCenterX - currentCenterX);
          const dy = Math.abs(nodeCenterY - currentCenterY);

          const directionalDistance =
            direction === 'ArrowUp' || direction === 'ArrowDown' ? dy + dx * 2 : dx + dy * 2;

          if (directionalDistance < minDistance) {
            minDistance = directionalDistance;
            targetNode = node;
          }
        }
      }

      if (targetNode) {
        e.preventDefault();
        const targetElement = document.querySelector(
          `[data-node-id="${targetNode.id}"]`,
        ) as HTMLElement;
        if (targetElement) {
          targetElement.focus();
          setSelectedNodeId(targetNode.id);
        }
      }
    },
    [mergedNodes, mergedNodeMap],
  );

  const sortedNodes = useMemo(() => {
    const groups: CanvasNode[] = [];
    const others: CanvasNode[] = [];
    for (const node of mergedNodes) {
      if (node.type === 'group') groups.push(node);
      else others.push(node);
    }
    return [...groups, ...others];
  }, [mergedNodes]);

  const fitToView = useCallback(() => {
    if (mergedNodes.length === 0) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const node of mergedNodes) {
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
  }, [mergedNodes, setViewport]);

  // Recenter on load
  useEffect(() => {
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        fitToView();
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitToView]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key === '0') {
        e.preventDefault();
        resetZoom();
      } else if (isMod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn();
      } else if (isMod && e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetZoom, zoomIn, zoomOut]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }, []);

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
                nodeMap={mergedNodeMap}
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
              iframeSandbox={iframeSandbox}
              onHover={handleNodeHover}
              onClick={(nodeId) => setSelectedNodeId(nodeId)}
              onKeyDown={handleNodeKeyDown}
              onNodeDrag={handleNodeDrag}
              onNodeResize={handleNodeResize}
            />
          ))}
        </div>
      </div>

      {/* Floating Vertical Toolbar (upper right) */}
      <div className="canvas-toolbar" role="toolbar" aria-label="Canvas vertical controls">
        <button
          type="button"
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
            strokeLinejoin="round"
            role="img"
            aria-label="Settings">
            <title>Settings</title>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        <div className="canvas-toolbar-sep" />
        <button
          type="button"
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
            strokeLinejoin="round"
            role="img"
            aria-label="Zoom In">
            <title>Zoom In</title>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          type="button"
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
            strokeLinejoin="round"
            role="img"
            aria-label="Reset">
            <title>Reset</title>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button
          type="button"
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
            strokeLinejoin="round"
            role="img"
            aria-label="Fit to View">
            <title>Fit to View</title>
            <path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6" />
          </svg>
        </button>
        <button
          type="button"
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
            strokeLinejoin="round"
            role="img"
            aria-label="Zoom Out">
            <title>Zoom Out</title>
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div className="canvas-toolbar-sep" />
        <button
          type="button"
          className="canvas-toolbar-btn"
          onClick={handleCopyLink}
          title={copied ? 'Copied!' : 'Copy Share Link'}
          aria-label="Copy share link">
          {copied ? (
            <svg
              className="canvas-check-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Copied">
              <title>Copied</title>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              className="canvas-link-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Share Link">
              <title>Share Link</title>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          )}
        </button>
        <button
          type="button"
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
            strokeLinejoin="round"
            role="img"
            aria-label="Help">
            <title>Help</title>
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
            <button type="button" className="canvas-help-close" onClick={() => setShowHelp(false)}>
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
              <span className="canvas-help-desc">Click note. Tap background to clear</span>
            </div>
            <div className="canvas-help-row">
              <span className="canvas-help-key">
                <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>
              </span>
              <span className="canvas-help-desc">Navigate between focused cards</span>
            </div>
            <div className="canvas-help-row">
              <span className="canvas-help-key">
                <kbd>Ctrl+0</kbd> / <kbd>⌘0</kbd>
              </span>
              <span className="canvas-help-desc">Reset scale (1:1)</span>
            </div>
            <div className="canvas-help-row">
              <span className="canvas-help-key">
                <kbd>Ctrl+=</kbd> / <kbd>⌘=</kbd>
              </span>
              <span className="canvas-help-desc">Zoom in</span>
            </div>
            <div className="canvas-help-row">
              <span className="canvas-help-key">
                <kbd>Ctrl+-</kbd> / <kbd>⌘-</kbd>
              </span>
              <span className="canvas-help-desc">Zoom out</span>
            </div>
            <div className="canvas-help-row">
              <span className="canvas-help-key">
                <kbd>Esc</kbd>
              </span>
              <span className="canvas-help-desc">Deselect card</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
