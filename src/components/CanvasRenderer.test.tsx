import { expect, test } from 'bun:test';
import { fireEvent, render } from '@testing-library/react';
import type { CanvasData } from '../types';
import { CanvasRenderer } from './CanvasRenderer';

const sampleData: CanvasData = {
  nodes: [
    { id: 't1', type: 'text', x: 0, y: 0, width: 100, height: 100, text: 'Hello **world**' },
    { id: 'f1', type: 'file', x: 200, y: 0, width: 100, height: 100, file: 'Note.md' },
    {
      id: 'l1',
      type: 'link',
      x: 400,
      y: 0,
      width: 100,
      height: 100,
      url: 'https://example.com',
    },
    {
      id: 'g1',
      type: 'group',
      x: -50,
      y: -50,
      width: 600,
      height: 200,
      label: 'My Group',
      background: 'bg.png',
      backgroundStyle: 'cover',
    },
  ],
  edges: [
    {
      id: 'e1',
      fromNode: 't1',
      toNode: 'f1',
      fromSide: 'right',
      toSide: 'left',
      label: 'connects',
    },
  ],
};

test('renders all four node types', () => {
  const { container } = render(<CanvasRenderer data={sampleData} />);
  expect(container.querySelector('.canvas-node-text')).toBeTruthy();
  expect(container.querySelector('.canvas-node-file')).toBeTruthy();
  expect(container.querySelector('.canvas-node-link')).toBeTruthy();
  expect(container.querySelector('.canvas-node-group')).toBeTruthy();
});

test('renders edges with correct count', () => {
  const { container } = render(<CanvasRenderer data={sampleData} />);
  const edgeGroups = container.querySelectorAll('g.canvas-edge, g.canvas-edge-highlighted');
  expect(edgeGroups.length).toBe(1);
});

test('renders empty canvas without error', () => {
  const { container } = render(<CanvasRenderer data={{ nodes: [], edges: [] }} />);
  expect(container.querySelector('.canvas-viewport')).toBeTruthy();
});

test('toolbar contains all 7 buttons', () => {
  const { container } = render(<CanvasRenderer data={sampleData} />);
  const toolbar = container.querySelector('.canvas-toolbar');
  expect(toolbar).toBeTruthy();
  const buttons = toolbar?.querySelectorAll('button');
  expect(buttons?.length).toBe(7);
});

test('toolbar buttons have correct titles', () => {
  const { container } = render(<CanvasRenderer data={sampleData} />);
  const buttons = container.querySelectorAll('.canvas-toolbar-btn');
  const titles = Array.from(buttons).map((btn) => btn.getAttribute('title'));
  expect(titles).toContain('Toggle Grid Dots');
  expect(titles).toContain('Zoom In');
  expect(titles).toContain('Reset Scale (1:1)');
  expect(titles).toContain('Fit to View');
  expect(titles).toContain('Zoom Out');
  expect(titles).toContain('Copy Share Link');
  expect(titles).toContain('Help & Info');
});

test('toggles grid visibility', () => {
  const { container } = render(<CanvasRenderer data={sampleData} />);
  expect(container.querySelector('.canvas-background')).toBeTruthy();

  const gridBtn = container.querySelector('button[title="Toggle Grid Dots"]') as HTMLElement;
  fireEvent.click(gridBtn);
  expect(container.querySelector('.canvas-background')).toBeFalsy();

  fireEvent.click(gridBtn);
  expect(container.querySelector('.canvas-background')).toBeTruthy();
});

test('toggles help dialog', () => {
  const { container } = render(<CanvasRenderer data={sampleData} />);
  expect(container.querySelector('.canvas-help-modal')).toBeFalsy();

  const helpBtn = container.querySelector('button[title="Help & Info"]') as HTMLElement;
  fireEvent.click(helpBtn);
  expect(container.querySelector('.canvas-help-modal')).toBeTruthy();

  fireEvent.click(helpBtn);
  expect(container.querySelector('.canvas-help-modal')).toBeFalsy();
});

test('help dialog shows keyboard shortcut rows', () => {
  const { container } = render(<CanvasRenderer data={sampleData} />);
  const helpBtn = container.querySelector('button[title="Help & Info"]') as HTMLElement;
  fireEvent.click(helpBtn);

  const helpModal = container.querySelector('.canvas-help-modal');
  expect(helpModal).toBeTruthy();
  expect(helpModal?.textContent).toContain('Ctrl+0');
  expect(helpModal?.textContent).toContain('Esc');
});

test('node hover applies hovered class', () => {
  const { container } = render(<CanvasRenderer data={sampleData} />);
  const node = container.querySelector('.canvas-node-text') as HTMLElement;

  fireEvent.mouseEnter(node);
  expect(node.classList.contains('canvas-node-hovered')).toBe(true);

  fireEvent.mouseLeave(node);
  expect(node.classList.contains('canvas-node-hovered')).toBe(false);
});

test('clicking node selects it, clicking viewport deselects', () => {
  const { container } = render(<CanvasRenderer data={sampleData} />);
  const node = container.querySelector('.canvas-node-text') as HTMLElement;
  const viewport = container.querySelector('.canvas-viewport') as HTMLElement;

  fireEvent.click(node);
  expect(node.classList.contains('canvas-node-selected')).toBe(true);

  fireEvent.click(viewport);
  expect(node.classList.contains('canvas-node-selected')).toBe(false);
});

test('share link button renders in toolbar', () => {
  const { container } = render(<CanvasRenderer data={sampleData} />);
  const shareBtn = container.querySelector('button[title="Copy Share Link"]');
  expect(shareBtn).toBeTruthy();
});

test('keyboard shortcuts do not throw', () => {
  const { container } = render(<CanvasRenderer data={sampleData} />);
  expect(container.querySelector('.canvas-viewport')).toBeTruthy();

  expect(() => {
    fireEvent.keyDown(window, { key: '0', ctrlKey: true });
    fireEvent.keyDown(window, { key: '=', ctrlKey: true });
    fireEvent.keyDown(window, { key: '-', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'Escape' });
  }).not.toThrow();
});
