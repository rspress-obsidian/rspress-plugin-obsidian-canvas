---
title: Canvas Format
description: Full JSON Canvas 1.0 spec support — node types, edges, colors, and Markdown features.
---

# Canvas Format

This plugin implements the [JSON Canvas 1.0](https://jsoncanvas.org/spec/1.0/) specification. Every field defined by the spec is parsed, validated, and rendered.

## Node Types

### Text Nodes

Store Markdown content. All standard Markdown syntax is supported plus Obsidian-specific extensions.

```json
{
  "id": "n1",
  "type": "text",
  "x": 0,
  "y": 0,
  "width": 300,
  "height": 200,
  "text": "# Title\n\nContent with **bold** and *italic*.",
  "color": "4"
}
```

**Supported Markdown features:**

| Feature | Syntax |
|---------|--------|
| Headings | `# H1` through `###### H6` |
| Bold | `**text**` |
| Italic | `*text*` or `_text_` |
| Bold+Italic | `***text***` |
| Inline code | `` `code` `` |
| Code blocks | ` ```lang ` ... ` ``` ` |
| Links | `[text](url)` |
| Images | `![alt](url)` |
| Blockquotes | `> quote` |
| Unordered lists | `- item` or `* item` |
| Ordered lists | `1. item` |
| Horizontal rules | `---`, `***`, `___` |
| Auto-links | `<https://url>` |
| Wiki-links | `[[Note]]` or `[[Note\|Display]]` |

### File Nodes

Reference files within your vault. These render as clickable cards that link to the corresponding Rspress page.

```json
{
  "id": "n2",
  "type": "file",
  "x": 400,
  "y": 0,
  "width": 200,
  "height": 100,
  "file": "Welcome.md",
  "subpath": "#getting-started",
  "color": "5"
}
```

Markdown files (`.md`, `.mdx`, `.markdown`) are resolved to Rspress routes. Non-Markdown files (images, PDFs) pass through as direct paths.

### Link Nodes

Reference external URLs.

```json
{
  "id": "n3",
  "type": "link",
  "x": 200,
  "y": 200,
  "width": 250,
  "height": 80,
  "url": "https://rspress.dev",
  "color": "2"
}
```

Enable `linkPreview: true` in plugin options to render an embedded iframe.

### Group Nodes

Visual containers for organizing other nodes.

```json
{
  "id": "n4",
  "type": "group",
  "x": -50,
  "y": -50,
  "width": 600,
  "height": 400,
  "label": "Project Overview",
  "background": "bg.png",
  "backgroundStyle": "cover",
  "color": "6"
}
```

Groups render behind their contents with a dashed border. Background images support `cover`, `ratio`, and `repeat` styles.

## Edges

Connect nodes with intelligent, orthogonal, collision-avoiding paths. The routing algorithm automatically calculates paths that avoid overlapping other nodes, ensuring maximum readability.

```json
{
  "id": "e1",
  "fromNode": "n1",
  "fromSide": "right",
  "fromEnd": "arrow",
  "toNode": "n2",
  "toSide": "left",
  "toEnd": "none",
  "color": "3",
  "label": "references"
}
```

| Field | Values | Default |
|-------|--------|---------|
| `fromSide` | `top`, `right`, `bottom`, `left` | center of node |
| `toSide` | `top`, `right`, `bottom`, `left` | center of node |
| `fromEnd` | `none`, `arrow` | `none` |
| `toEnd` | `none`, `arrow` | `arrow` |
| `color` | hex or preset `"1"`–`"6"` | `#999999` |
| `label` | any string | none |

Hovering a node highlights all connected edges.

## Colors

Both nodes and edges support the `canvasColor` type:

- **Hex**: `"#ff0000"`
- **RGB**: `"rgb(255, 0, 0)"`
- **Preset**: `"1"` (red), `"2"` (orange), `"3"` (yellow), `"4"` (green), `"5"` (cyan), `"6"` (purple)
