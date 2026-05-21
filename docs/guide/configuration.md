---
title: Configuration
description: All plugin options and how to configure vault scanning, routes, and previews.
---

# Configuration

Customize how the plugin discovers canvas files and generates routes.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vaultRoot` | `string` | `process.cwd()` | Root directory to scan for `.canvas` files |
| `routePrefix` | `string` | `/canvas` | URL prefix for generated canvas pages |
| `include` | `string[]` | `['**/*.canvas']` | Glob patterns for finding canvas files |
| `exclude` | `string[]` | `[]` | Glob patterns to exclude from scanning |
| `fileRoutePrefix` | `string` | `undefined` | Prefix for file node links to Rspress routes |
| `linkPreview` | `boolean` | `false` | Render link nodes as embedded iframes |

## vaultRoot

Point to your Obsidian vault directory:

```ts
pluginObsidianCanvas({
  vaultRoot: './my-vault',
})
```

Canvas files are discovered relative to this path.

## routePrefix

Control the URL structure for canvas pages:

```ts
pluginObsidianCanvas({
  routePrefix: '/vault/canvas',
})
```

A file named `Architecture.canvas` becomes available at `/vault/canvas/architecture`.

## include / exclude

Filter which canvas files to process:

```ts
pluginObsidianCanvas({
  include: ['**/diagrams/*.canvas'],
  exclude: ['**/drafts/*.canvas'],
})
```

Uses [fast-glob](https://github.com/mrmlnc/fast-glob) pattern matching.

## fileRoutePrefix

Map file nodes to your Rspress documentation routes. When a file node references `Welcome.md`, this option determines the link destination:

```ts
pluginObsidianCanvas({
  fileRoutePrefix: '/docs',
})
```

| File Node Value | Resolved Link |
|-----------------|---------------|
| `Welcome.md` | `/docs/welcome` |
| `Notes/Setup.md` | `/docs/notes/setup` |
| `Guide.md#section` | `/docs/guide#section` |

Without this option, file nodes link to `/<filename>` directly.

## linkPreview

Enable iframe previews for link nodes:

```ts
pluginObsidianCanvas({
  linkPreview: true,
})
```

When enabled, link nodes render an embedded iframe of the target URL instead of just displaying the URL text. The iframe uses `sandbox="allow-scripts allow-same-origin allow-popups"` for security.
