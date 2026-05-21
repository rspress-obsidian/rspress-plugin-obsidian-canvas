# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Build step with `tsup` for ESM/CJS dual output
- GitHub Actions CI for automated testing
- `marked` library for robust Markdown rendering (replaces hand-rolled parser)
- Accessibility improvements: ARIA labels, keyboard navigation, focus indicators
- Memoized SVG markers for better performance on large canvases
- CHANGELOG.md and MIT LICENSE

### Changed
- Package exports now point to compiled output in `dist/`
- `files` field refined to ship only production artifacts

## [0.0.1] - 2026-05-21

### Added
- Initial release
- JSON Canvas 1.0 spec support (text, file, link, group nodes)
- Pan and zoom via mouse drag and scroll
- Bezier curve edges with natural routing
- Edge highlighting on node hover
- Markdown rendering in text nodes
- Clickable file nodes linking to Rspress pages
- Group nodes rendered behind contents
- Link nodes with optional iframe preview
- Customizable plugin options (vaultRoot, routePrefix, fileRoutePrefix, linkPreview)
- Comprehensive test suite (parser, markdown, resolver)
