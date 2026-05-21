# rspress-plugin-obsidian-canvas

Render Obsidian vault `.canvas` files as beautiful, interactive pages in your Rspress site.

## What it does

This Rspress plugin discovers `.canvas` files in your Obsidian vault and generates an interactive page for each one. The canvas renderer supports:

- **Pan and zoom** via mouse drag and scroll
- **Bezier curve edges** that route naturally between node sides
- **Edge highlighting** when hovering nodes
- **Markdown rendering** in text nodes (headers, bold, italic, lists, code, blockquotes, links)
- **Clickable file nodes** that link to the corresponding Rspress page
- **Group nodes** rendered behind their contents with visual containment
- **Link nodes** with optional iframe preview

## Install

```bash
bun add rspress-plugin-obsidian-canvas
```

Peer dependencies:

```bash
bun add @rspress/core react react-dom
```

## Usage

### 1. Add the plugin

```ts
// rspress.config.ts
import { defineConfig } from '@rspress/core';
import { pluginObsidianCanvas } from 'rspress-plugin-obsidian-canvas';

export default defineConfig({
  plugins: [
    pluginObsidianCanvas({
      vaultRoot: './Obsidian Vault',
      routePrefix: '/canvas',
      fileRoutePrefix: '/docs',
    }),
  ],
});
```

### 2. Import styles

```ts
import 'rspress-plugin-obsidian-canvas/style.css';
```

### 3. Build

```bash
bun run build
```

Each `.canvas` file becomes a page at `/canvas/<filename>`.

## Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vaultRoot` | `string` | `process.cwd()` | Root directory to scan for `.canvas` files |
| `routePrefix` | `string` | `/canvas` | URL prefix for canvas pages |
| `include` | `string[]` | `['**/*.canvas']` | Glob patterns for finding canvas files |
| `exclude` | `string[]` | `[]` | Glob patterns to exclude |
| `fileRoutePrefix` | `string` | `undefined` | Prefix for file node links (e.g. `/docs`) |
| `linkPreview` | `boolean` | `false` | Render link nodes as embedded iframes |

## Features

### Pan and Zoom

- **Drag** the canvas to pan
- **Scroll** to zoom in and out
- Middle-click drag also works for panning

### Node Types

| Type | Rendering |
|------|-----------|
| **text** | Renders Markdown: headers, bold, italic, lists, code blocks, blockquotes, links |
| **file** | Clickable card linking to the referenced page. Resolves `.md` to Rspress routes |
| **link** | External URL card. Enable `linkPreview` for embedded iframe |
| **group** | Visual container rendered behind other nodes with dashed border and label |

### Edge Rendering

Edges are rendered as smooth **cubic bezier curves** with natural routing based on which side of each node they connect to. Hover a node and its connected edges glow brighter.

### File Node Routing

File nodes reference notes by path. Use `fileRoutePrefix` to map them to your Rspress routes:

```ts
pluginObsidianCanvas({
  fileRoutePrefix: '/docs',
})
```

A file node with `file: "Welcome.md"` will link to `/docs/welcome`.

Subpaths are appended directly: `file: "Notes.md", subpath: "#section"` becomes `/docs/notes#section`.

## Styling

Import the provided CSS or override these classes:

- `.canvas-viewport` — Canvas container
- `.canvas-node` — All nodes
- `.canvas-node-hovered` — Node being hovered
- `.canvas-node-text` — Text nodes
- `.canvas-node-file` — File nodes
- `.canvas-node-link` — Link nodes
- `.canvas-node-group` — Group nodes
- `.canvas-edge-highlighted` — Highlighted edges
- `.canvas-markdown` — Markdown content wrapper

## How it works

1. **Build time**: The plugin scans your vault for `.canvas` files
2. Each file is parsed, validated, and embedded as JSON in a generated MDX page
3. **Runtime**: The `CanvasViewer` component parses the JSON and renders an interactive React canvas
4. Nodes are positioned absolutely on a pannable/zoomable viewport
5. Edges are rendered as SVG bezier curves between node connection points

## Canvas Format

Implements [JSON Canvas 1.0](https://jsoncanvas.org/spec/1.0/), the open standard created for Obsidian.

## Development

```bash
bun install
```

## License

MIT
