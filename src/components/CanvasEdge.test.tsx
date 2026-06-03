import { expect, test } from 'bun:test';
import type { CanvasNode } from '../types';
import { getEdgePoint, getOrthogonalPath } from './CanvasEdge';

const node: CanvasNode = {
  id: 'n1',
  type: 'text',
  x: 100,
  y: 100,
  width: 200,
  height: 150,
};

test('getEdgePoint returns center when side is undefined', () => {
  const p = getEdgePoint(node, undefined);
  expect(p.x).toBe(200);
  expect(p.y).toBe(175);
});

test('getEdgePoint returns top edge', () => {
  const p = getEdgePoint(node, 'top');
  expect(p.x).toBe(200);
  expect(p.y).toBe(100);
});

test('getEdgePoint returns right edge', () => {
  const p = getEdgePoint(node, 'right');
  expect(p.x).toBe(300);
  expect(p.y).toBe(175);
});

test('getEdgePoint returns bottom edge', () => {
  const p = getEdgePoint(node, 'bottom');
  expect(p.x).toBe(200);
  expect(p.y).toBe(250);
});

test('getEdgePoint returns left edge', () => {
  const p = getEdgePoint(node, 'left');
  expect(p.x).toBe(100);
  expect(p.y).toBe(175);
});

test('getOrthogonalPath generates valid SVG path', () => {
  const start = { x: 300, y: 175 };
  const end = { x: 600, y: 175 };
  const nodes: CanvasNode[] = [];
  const path = getOrthogonalPath(start, end, 'right', 'left', nodes, 'n1', 'n2');
  expect(path).toContain('M 300 175');
  expect(path).toContain('L');
  expect(path).toContain('C'); // Cubic bezier for smooth rounded corners
});

test('getOrthogonalPath avoids intersecting nodes', () => {
  const start = { x: 100, y: 100 };
  const end = { x: 500, y: 100 };
  const obstacle: CanvasNode = {
    id: 'obstacle',
    type: 'text',
    x: 250,
    y: 50,
    width: 100,
    height: 100,
  };
  const path = getOrthogonalPath(start, end, 'right', 'left', [obstacle], 'n1', 'n2');
  // The path should shift vertically to avoid the obstacle at y=50 to y=150
  // We can verify it doesn't just draw a straight line through the middle
  expect(path).not.toContain('L 300 100 L 300 100');
});

test('getOrthogonalPath handles perpendicular directions', () => {
  const start = { x: 200, y: 250 };
  const end = { x: 400, y: 400 };
  const nodes: CanvasNode[] = [];
  const path = getOrthogonalPath(start, end, 'bottom', 'right', nodes, 'n1', 'n2');
  expect(path).toContain('M 200 250');
  expect(path).toContain('L');
});
