import { useState, useCallback, useMemo } from 'react';
import { usePanZoom } from '../hooks/usePanZoom';
import { CanvasNodeComponent } from './CanvasNode';
import { CanvasEdge } from './CanvasEdge';
import type { CanvasData } from '../types';

interface CanvasRendererProps {
  data: CanvasData;
  fileRoutePrefix?: string;
  linkPreview?: boolean;
}

export function CanvasRenderer({ data, fileRoutePrefix, linkPreview }: CanvasRendererProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const {
    viewport,
    transform,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    zoomIn,
    zoomOut,
    resetZoom,
  } = usePanZoom();

  const connectedEdgeIds = new Set<string>();
  if (hoveredNodeId) {
    for (const edge of data.edges) {
      if (edge.fromNode === hoveredNodeId || edge.toNode === hoveredNodeId) {
        connectedEdgeIds.add(edge.id);
      }
    }
  }

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  const sortedNodes = [...data.nodes].sort((a, b) => {
    if (a.type === 'group' && b.type !== 'group') return -1;
    if (b.type === 'group' && a.type !== 'group') return 1;
    return 0;
  });

  const canvasBounds = useMemo(() => {
    if (data.nodes.length === 0) return { x: 0, y: 0, w: 1, h: 1 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of data.nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    }
    const padding = 200;
    return {
      x: minX - padding,
      y: minY - padding,
      w: maxX - minX + padding * 2,
      h: maxY - minY + padding * 2,
    };
  }, [data.nodes]);

  return (
    <div className="canvas-container">
      <div
        className="canvas-viewport"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="canvas-world" style={{ transform }}>
          <svg
            className="canvas-edges"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              left: canvasBounds.x,
              top: canvasBounds.y,
              width: canvasBounds.w,
              height: canvasBounds.h,
            }}
          >
            <defs>
              {data.edges.map((edge) => {
                const color = edge.color && edge.color.startsWith('#') ? edge.color : '#999999';
                return (
                  <g key={edge.id}>
                    <marker
                      id={`arrowhead-${edge.id}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                    </marker>
                    <marker
                      id={`arrowhead-start-${edge.id}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="1"
                      refY="3.5"
                      orient="auto"
                    >
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
                nodes={data.nodes}
                isHighlighted={connectedEdgeIds.has(edge.id)}
              />
            ))}
          </svg>
          {sortedNodes.map((node) => (
            <CanvasNodeComponent
              key={node.id}
              node={node}
              isHovered={node.id === hoveredNodeId}
              fileRoutePrefix={fileRoutePrefix}
              linkPreview={linkPreview}
              onHover={handleNodeHover}
            />
          ))}
        </div>
      </div>
      <div className="canvas-toolbar">
        <button className="canvas-toolbar-btn" onClick={zoomOut} aria-label="Zoom out">−</button>
        <span className="canvas-zoom-level">{Math.round(viewport.zoom * 100)}%</span>
        <button className="canvas-toolbar-btn" onClick={zoomIn} aria-label="Zoom in">+</button>
        <div className="canvas-toolbar-sep" />
        <button className="canvas-toolbar-btn" onClick={resetZoom} aria-label="Reset zoom">1:1</button>
      </div>
    </div>
  );
}
