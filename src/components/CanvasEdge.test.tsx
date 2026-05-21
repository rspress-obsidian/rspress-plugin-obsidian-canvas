import { expect, test } from 'bun:test';
import { getEdgePoint, getControlPoints } from './CanvasEdge';
import type { CanvasNode } from '../types';

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

test('getControlPoints with top->bottom', () => {
  const start = { x: 200, y: 100 };
  const end = { x: 200, y: 400 };
  const [cp1, cp2] = getControlPoints(start, end, 'top', 'bottom');
  expect(cp1.y).toBeLessThan(start.y);
  expect(cp2.y).toBeGreaterThan(end.y);
});

test('getControlPoints with right->left', () => {
  const start = { x: 300, y: 175 };
  const end = { x: 100, y: 175 };
  const [cp1, cp2] = getControlPoints(start, end, 'right', 'left');
  expect(cp1.x).toBeGreaterThan(start.x);
  expect(cp2.x).toBeLessThan(end.x);
});

test('getControlPoints tension is capped at 120', () => {
  const start = { x: 0, y: 0 };
  const end = { x: 10000, y: 0 };
  const [cp1, cp2] = getControlPoints(start, end, 'right', 'left');
  expect(Math.abs(cp1.x - start.x)).toBe(120);
  expect(Math.abs(cp2.x - end.x)).toBe(120);
});

test('getControlPoints with default sides', () => {
  const start = { x: 0, y: 0 };
  const end = { x: 100, y: 0 };
  const [cp1, cp2] = getControlPoints(start, end, undefined, undefined);
  expect(cp1.x).toBeGreaterThan(start.x);
  expect(cp2.x).toBeLessThan(end.x);
});
