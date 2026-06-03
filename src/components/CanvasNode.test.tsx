import { expect, test } from 'bun:test';
import { render } from '@testing-library/react';
import type { CanvasNode } from '../types';
import { CanvasNodeComponent } from './CanvasNode';

test('renders text node with markdown', () => {
  const node: CanvasNode = {
    id: 'n1',
    type: 'text',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    text: '# Hello\n\nWorld',
  };
  const { container } = render(<CanvasNodeComponent node={node} />);
  expect(container.innerHTML).toContain('<h1>Hello</h1>');
  expect(container.innerHTML).toContain('<p>World</p>');
});

test('renders file node as link card', () => {
  const node: CanvasNode = {
    id: 'n2',
    type: 'file',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    file: 'Note.md',
  };
  const { container } = render(<CanvasNodeComponent node={node} fileRoutePrefix="/docs" />);
  expect(container.innerHTML).toContain('/docs/note');
  expect(container.innerHTML).toContain('Note');
});

test('renders link node with url', () => {
  const node: CanvasNode = {
    id: 'n3',
    type: 'link',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    url: 'https://example.com',
  };
  const { container } = render(<CanvasNodeComponent node={node} />);
  expect(container.innerHTML).toContain('https://example.com');
});

test('renders group node with label', () => {
  const node: CanvasNode = {
    id: 'n4',
    type: 'group',
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    label: 'My Group',
  };
  const { container } = render(<CanvasNodeComponent node={node} />);
  expect(container.innerHTML).toContain('My Group');
});

test('renders image file node with base64', () => {
  const node: CanvasNode = {
    id: 'n5',
    type: 'file',
    x: 0,
    y: 0,
    width: 200,
    height: 150,
    file: 'photo.png',
    imageUrl: 'data:image/png;base64,abc123',
    isImage: true,
  };
  const { container } = render(<CanvasNodeComponent node={node} />);
  expect(container.innerHTML).toContain('<img');
  expect(container.innerHTML).toContain('data:image/png;base64,abc123');
});

test('renders video file node', () => {
  const node: CanvasNode = {
    id: 'n6',
    type: 'file',
    x: 0,
    y: 0,
    width: 200,
    height: 150,
    file: 'clip.mp4',
    imageUrl: 'data:video/mp4;base64,abc123',
    isVideo: true,
  };
  const { container } = render(<CanvasNodeComponent node={node} />);
  expect(container.innerHTML).toContain('<video');
  expect(container.innerHTML).toContain('data:video/mp4;base64,abc123');
});

test('renders audio file node', () => {
  const node: CanvasNode = {
    id: 'n7',
    type: 'file',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    file: 'song.mp3',
    imageUrl: 'data:audio/mpeg;base64,abc123',
    isAudio: true,
  };
  const { container } = render(<CanvasNodeComponent node={node} />);
  expect(container.innerHTML).toContain('<audio');
  expect(container.innerHTML).toContain('data:audio/mpeg;base64,abc123');
});

test('renders file node with content and subpath', () => {
  const node: CanvasNode = {
    id: 'n9',
    type: 'file',
    x: 0,
    y: 0,
    width: 200,
    height: 150,
    file: 'Guide.md',
    subpath: '#intro',
    fileContent: '# Intro\n\nWelcome!',
  };
  const { container } = render(<CanvasNodeComponent node={node} fileRoutePrefix="/docs" />);
  expect(container.innerHTML).toContain('<h1>Intro</h1>');
  expect(container.innerHTML).toContain('/docs/guide#intro');
});

test('renders error file node', () => {
  const node: CanvasNode = {
    id: 'n10',
    type: 'file',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    file: 'Missing.md',
    subpath: '#bad',
    fileContent: 'Unable to find "bad" in Missing',
    isError: true,
  };
  const { container } = render(<CanvasNodeComponent node={node} />);
  expect(container.innerHTML).toContain('Unable to find');
});

test('applies hover class when isHovered', () => {
  const node: CanvasNode = {
    id: 'n11',
    type: 'text',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    text: 'hello',
  };
  const { container } = render(<CanvasNodeComponent node={node} isHovered />);
  const el = container.querySelector('.canvas-node');
  expect(el?.classList.contains('canvas-node-hovered')).toBe(true);
});

test('applies selected class when isSelected', () => {
  const node: CanvasNode = {
    id: 'n12',
    type: 'text',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    text: 'hello',
  };
  const { container } = render(<CanvasNodeComponent node={node} isSelected />);
  const el = container.querySelector('.canvas-node');
  expect(el?.classList.contains('canvas-node-selected')).toBe(true);
});

test('link node renders preview header when linkPreview is true', () => {
  const node: CanvasNode = {
    id: 'n13',
    type: 'link',
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    url: 'https://example.com',
  };
  const { container } = render(<CanvasNodeComponent node={node} linkPreview />);
  expect(container.innerHTML).toContain('example.com');
});
