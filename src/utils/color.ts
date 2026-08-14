const CANVAS_PRESET_COLORS: Record<string, string> = {
  '1': 'var(--canvas-color-1)',
  '2': 'var(--canvas-color-2)',
  '3': 'var(--canvas-color-3)',
  '4': 'var(--canvas-color-4)',
  '5': 'var(--canvas-color-5)',
  '6': 'var(--canvas-color-6)',
};

/**
 * Resolve a JSON Canvas `canvasColor` value to a CSS color.
 * Hex, `rgb()`/`hsl()`, and CSS variable values pass through unchanged;
 * preset keys (`"1"`–`"6"`) map to theme variables.
 */
export function resolveColor(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('var')) return color;
  return CANVAS_PRESET_COLORS[color] || color;
}

const GROUP_PRESET_BGS: Record<string, string> = {
  '1': 'rgba(239, 68, 68, 0.03)',
  '2': 'rgba(249, 115, 22, 0.03)',
  '3': 'rgba(234, 179, 8, 0.03)',
  '4': 'rgba(34, 197, 94, 0.03)',
  '5': 'rgba(6, 182, 212, 0.03)',
  '6': 'rgba(168, 85, 247, 0.03)',
};

const NODE_PRESET_BGS: Record<string, string> = {
  '1': 'var(--canvas-bg-color-1-tint)',
  '2': 'var(--canvas-bg-color-2-tint)',
  '3': 'var(--canvas-bg-color-3-tint)',
  '4': 'var(--canvas-bg-color-4-tint)',
  '5': 'var(--canvas-bg-color-5-tint)',
  '6': 'var(--canvas-bg-color-6-tint)',
};

/**
 * Resolve a node background color from a `canvasColor` preset.
 * Group nodes use a fixed translucent tint; other nodes use theme variables.
 * Hex/`rgb()`/`var()` values are handled by the caller via `resolveColor`.
 */
export function resolveBgColor(
  color: string | undefined,
  type: 'group' | 'other',
): string | undefined {
  if (type === 'group') {
    if (!color) return 'var(--canvas-group-bg)';
    return GROUP_PRESET_BGS[color] || 'var(--canvas-group-bg)';
  }
  if (!color) return 'var(--canvas-node-bg)';
  return NODE_PRESET_BGS[color] || 'var(--canvas-node-bg)';
}
