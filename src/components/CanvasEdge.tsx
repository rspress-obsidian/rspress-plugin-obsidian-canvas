import { useMemo } from 'react';
import type { CanvasEdgeData, CanvasNode } from '../types';
import { resolveColor } from '../utils/color';

interface Point {
  x: number;
  y: number;
}

export function getEdgePoint(node: CanvasNode, side: string | undefined): Point {
  switch (side) {
    case 'top':
      return { x: node.x + node.width / 2, y: node.y };
    case 'right':
      return { x: node.x + node.width, y: node.y + node.height / 2 };
    case 'bottom':
      return { x: node.x + node.width / 2, y: node.y + node.height };
    case 'left':
      return { x: node.x, y: node.y + node.height / 2 };
    default:
      return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
  }
}

class MinHeap<T> {
  private data: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}
  push(item: T) {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }
  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    if (this.data.length === 1) return this.data.pop();
    const result = this.data[0];
    this.data[0] = this.data.pop()!;
    this.bubbleDown(0);
    return result;
  }
  get size() {
    return this.data.length;
  }
  private bubbleUp(idx: number) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.compare(this.data[idx], this.data[parent]) < 0) {
        [this.data[idx], this.data[parent]] = [this.data[parent], this.data[idx]];
        idx = parent;
      } else break;
    }
  }
  private bubbleDown(idx: number) {
    const length = this.data.length;
    while (true) {
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      let smallest = idx;
      if (left < length && this.compare(this.data[left], this.data[smallest]) < 0) smallest = left;
      if (right < length && this.compare(this.data[right], this.data[smallest]) < 0)
        smallest = right;
      if (smallest !== idx) {
        [this.data[idx], this.data[smallest]] = [this.data[smallest], this.data[idx]];
        idx = smallest;
      } else break;
    }
  }
}

export function getOrthogonalPath(
  start: Point,
  end: Point,
  _fromSide: string | undefined,
  _toSide: string | undefined,
  nodes: CanvasNode[],
  fromNodeId: string,
  toNodeId: string,
): string {
  const CELL_SIZE = 20;
  const PADDING = 20;

  // 1. Determine tight grid bounds with reasonable margin
  const dist = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
  const margin = Math.min(200, Math.max(100, dist * 0.5));

  let minX = Math.min(start.x, end.x) - margin;
  let maxX = Math.max(start.x, end.x) + margin;
  let minY = Math.min(start.y, end.y) - margin;
  let maxY = Math.max(start.y, end.y) + margin;

  for (const node of nodes) {
    if (node.id === fromNodeId || node.id === toNodeId) continue;
    minX = Math.min(minX, node.x - PADDING);
    maxX = Math.max(maxX, node.x + node.width + PADDING);
    minY = Math.min(minY, node.y - PADDING);
    maxY = Math.max(maxY, node.y + node.height + PADDING);
  }

  const gridMinX = Math.floor(minX / CELL_SIZE) * CELL_SIZE;
  const gridMaxX = Math.ceil(maxX / CELL_SIZE) * CELL_SIZE;
  const gridMinY = Math.floor(minY / CELL_SIZE) * CELL_SIZE;
  const gridMaxY = Math.ceil(maxY / CELL_SIZE) * CELL_SIZE;

  const cols = Math.floor((gridMaxX - gridMinX) / CELL_SIZE) + 1;
  const rows = Math.floor((gridMaxY - gridMinY) / CELL_SIZE) + 1;

  // Safety check for excessively large grids
  if (cols * rows > 50000) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  // 2. Build grid (0 = free, 1 = blocked)
  const grid = new Uint8Array(cols * rows);

  for (const node of nodes) {
    if (node.id === fromNodeId || node.id === toNodeId) continue;
    const startX = Math.floor((node.x - PADDING - gridMinX) / CELL_SIZE);
    const endX = Math.floor((node.x + node.width + PADDING - gridMinX) / CELL_SIZE);
    const startY = Math.floor((node.y - PADDING - gridMinY) / CELL_SIZE);
    const endY = Math.floor((node.y + node.height + PADDING - gridMinY) / CELL_SIZE);

    for (let y = Math.max(0, startY); y <= Math.min(rows - 1, endY); y++) {
      for (let x = Math.max(0, startX); x <= Math.min(cols - 1, endX); x++) {
        grid[y * cols + x] = 1;
      }
    }
  }

  // 3. A* Search Setup
  const startNode = {
    x: Math.max(0, Math.min(cols - 1, Math.round((start.x - gridMinX) / CELL_SIZE))),
    y: Math.max(0, Math.min(rows - 1, Math.round((start.y - gridMinY) / CELL_SIZE))),
  };
  const endNode = {
    x: Math.max(0, Math.min(cols - 1, Math.round((end.x - gridMinX) / CELL_SIZE))),
    y: Math.max(0, Math.min(rows - 1, Math.round((end.y - gridMinY) / CELL_SIZE))),
  };

  grid[startNode.y * cols + startNode.x] = 0;
  grid[endNode.y * cols + endNode.x] = 0;

  const openSet = new MinHeap<{ x: number; y: number; g: number; f: number; key: string }>(
    (a, b) => a.f - b.f,
  );

  const startKey = `${startNode.x},${startNode.y}`;
  openSet.push({ x: startNode.x, y: startNode.y, g: 0, f: 0, key: startKey });

  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  gScore.set(startKey, 0);

  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  let found = false;
  let currentKey = startKey;

  while (openSet.size > 0) {
    const current = openSet.pop()!;
    currentKey = current.key;

    if (current.x === endNode.x && current.y === endNode.y) {
      found = true;
      break;
    }

    for (const dir of dirs) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        const idx = ny * cols + nx;
        if (grid[idx] === 0) {
          const tentativeG = current.g + CELL_SIZE;
          const key = `${nx},${ny}`;

          if (!gScore.has(key) || tentativeG < (gScore.get(key) || Infinity)) {
            cameFrom.set(key, currentKey);
            gScore.set(key, tentativeG);
            const h = Math.abs(nx - endNode.x) + Math.abs(ny - endNode.y);
            openSet.push({ x: nx, y: ny, g: tentativeG, f: tentativeG + h, key });
          }
        }
      }
    }
  }

  // 4. Reconstruct path
  let pathPoints: Point[] = [];
  if (found) {
    let curr = currentKey;
    while (curr) {
      const [cx, cy] = curr.split(',').map(Number);
      pathPoints.push({ x: cx * CELL_SIZE + gridMinX, y: cy * CELL_SIZE + gridMinY });
      curr = cameFrom.get(curr) || '';
    }
    pathPoints.reverse();
  } else {
    pathPoints = [start, end];
  }

  // 5. Simplify path (remove collinear points)
  const simplified: Point[] = [pathPoints[0]];
  for (let i = 1; i < pathPoints.length - 1; i++) {
    const prev = pathPoints[i - 1];
    const curr = pathPoints[i];
    const next = pathPoints[i + 1];
    if ((prev.x === curr.x && curr.x === next.x) || (prev.y === curr.y && curr.y === next.y)) {
      continue;
    }
    simplified.push(curr);
  }
  simplified.push(pathPoints[pathPoints.length - 1]);

  // 6. Generate SVG path with smooth, safe rounded corners
  const baseRadius = 8;

  const getDir = (a: Point, b: Point) => {
    if (Math.abs(a.x - b.x) < 1) return a.y < b.y ? 'S' : 'N';
    return a.x < b.x ? 'E' : 'W';
  };

  let path = `M ${start.x} ${start.y}`;

  for (let i = 1; i < simplified.length; i++) {
    const prev = simplified[i - 1];
    const curr = simplified[i];
    const next = simplified[i + 1];

    if (!next) {
      path += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    const dirIn = getDir(prev, curr);
    const dirOut = getDir(curr, next);

    if (dirIn === dirOut) {
      path += ` L ${curr.x} ${curr.y}`;
    } else {
      const distIn = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
      const distOut = Math.sqrt((next.x - curr.x) ** 2 + (next.y - curr.y) ** 2);
      const safeR = Math.max(2, Math.min(baseRadius, distIn / 2, distOut / 2));

      let stopX = curr.x;
      let stopY = curr.y;
      let endX = curr.x;
      let endY = curr.y;

      if (dirIn === 'E') stopX = curr.x - safeR;
      else if (dirIn === 'W') stopX = curr.x + safeR;
      else if (dirIn === 'S') stopY = curr.y - safeR;
      else if (dirIn === 'N') stopY = curr.y + safeR;

      if (dirOut === 'E') endX = curr.x + safeR;
      else if (dirOut === 'W') endX = curr.x - safeR;
      else if (dirOut === 'S') endY = curr.y + safeR;
      else if (dirOut === 'N') endY = curr.y - safeR;

      path += ` L ${stopX} ${stopY}`;
      path += ` C ${curr.x} ${curr.y}, ${curr.x} ${curr.y}, ${endX} ${endY}`;
    }
  }

  return path;
}

interface CanvasEdgeProps {
  edge: CanvasEdgeData;
  nodeMap: Map<string, CanvasNode>;
  isHighlighted?: boolean;
}

export function CanvasEdge({ edge, nodeMap, isHighlighted }: CanvasEdgeProps) {
  const fromNode = nodeMap.get(edge.fromNode);
  const toNode = nodeMap.get(edge.toNode);

  const start = fromNode ? getEdgePoint(fromNode, edge.fromSide) : null;
  const end = toNode ? getEdgePoint(toNode, edge.toSide) : null;

  const pathD = useMemo(() => {
    if (!fromNode || !toNode || !start || !end) return '';
    const allNodes = Array.from(nodeMap.values());
    return getOrthogonalPath(
      start,
      end,
      edge.fromSide,
      edge.toSide,
      allNodes,
      edge.fromNode,
      edge.toNode,
    );
  }, [fromNode, toNode, start, end, edge.fromSide, edge.toSide, nodeMap, edge.fromNode, edge.toNode]);

  if (!fromNode || !toNode || !start || !end || !pathD) return null;

  const color = resolveColor(edge.color);
  const hasArrow = edge.toEnd !== 'none';
  const hasStartArrow = edge.fromEnd === 'arrow';
  const strokeWidth = isHighlighted ? 3 : 2;
  const strokeOpacity = isHighlighted ? 1 : 0.6;

  return (
    <g className={isHighlighted ? 'canvas-edge-highlighted' : 'canvas-edge'}>
      <path
        d={pathD}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
        fill="none"
        markerEnd={hasArrow ? `url(#arrowhead-${edge.id})` : undefined}
        markerStart={hasStartArrow ? `url(#arrowhead-start-${edge.id})` : undefined}
      />
      {edge.label && (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={(start.x + end.x) / 2 - edge.label.length * 3.6 - 6}
            y={(start.y + end.y) / 2 - 20}
            width={edge.label.length * 7.2 + 12}
            height={20}
            rx={4}
            ry={4}
            fill="var(--canvas-edge-label-bg)"
            stroke={isHighlighted ? 'var(--canvas-accent)' : 'var(--canvas-node-border)'}
            strokeWidth={1}
          />
          <text
            x={(start.x + end.x) / 2}
            y={(start.y + end.y) / 2 - 7}
            fill={isHighlighted ? '#333333' : '#666666'}
            fontSize={12}
            fontWeight={isHighlighted ? 500 : 400}
            textAnchor="middle">
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
}
