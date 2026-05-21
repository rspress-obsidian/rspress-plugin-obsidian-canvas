import type { CanvasEdgeData, CanvasNode } from '../types';

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

export function getControlPoints(
  start: Point,
  end: Point,
  fromSide: string | undefined,
  toSide: string | undefined,
): [Point, Point] {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const tension = Math.min(dist * 0.5, 120);

  const cp1: Point = { x: start.x, y: start.y };
  const cp2: Point = { x: end.x, y: end.y };

  switch (fromSide) {
    case 'top':
      cp1.y -= tension;
      break;
    case 'right':
      cp1.x += tension;
      break;
    case 'bottom':
      cp1.y += tension;
      break;
    case 'left':
      cp1.x -= tension;
      break;
    default:
      cp1.x += end.x > start.x ? tension : -tension;
  }

  switch (toSide) {
    case 'top':
      cp2.y -= tension;
      break;
    case 'right':
      cp2.x += tension;
      break;
    case 'bottom':
      cp2.y += tension;
      break;
    case 'left':
      cp2.x -= tension;
      break;
    default:
      cp2.x += end.x > start.x ? -tension : tension;
  }

  return [cp1, cp2];
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

interface CanvasEdgeProps {
  edge: CanvasEdgeData;
  nodeMap: Map<string, CanvasNode>;
  isHighlighted?: boolean;
}

export function CanvasEdge({ edge, nodeMap, isHighlighted }: CanvasEdgeProps) {
  const fromNode = nodeMap.get(edge.fromNode);
  const toNode = nodeMap.get(edge.toNode);

  if (!fromNode || !toNode) return null;

  const start = getEdgePoint(fromNode, edge.fromSide);
  const end = getEdgePoint(toNode, edge.toSide);
  const [cp1, cp2] = getControlPoints(start, end, edge.fromSide, edge.toSide);

  const color = resolveColor(edge.color);
  const hasArrow = edge.toEnd !== 'none';
  const hasStartArrow = edge.fromEnd === 'arrow';
  const strokeWidth = isHighlighted ? 3 : 2;
  const strokeOpacity = isHighlighted ? 1 : 0.6;

  const pathD = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;

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
            x={(start.x + end.x) / 2 - (edge.label.length * 3.6) - 6}
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
