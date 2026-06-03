/**
 * Shared color resolution utility for canvas nodes, edges, and groups.
 *
 * Handles Obsidian's 6 preset colors, raw CSS values (#hex, rgb, var()),
 * and falls back to a provided default when the color is empty/undefined.
 */

const PRESET_COLORS: Record<string, string> = {
  '1': 'var(--canvas-color-1)',
  '2': 'var(--canvas-color-2)',
  '3': 'var(--canvas-color-3)',
  '4': 'var(--canvas-color-4)',
  '5': 'var(--canvas-color-5)',
  '6': 'var(--canvas-color-6)',
};

const PRESET_BG_COLORS: Record<string, string> = {
  '1': 'rgba(239, 68, 68, 0.03)',
  '2': 'rgba(249, 115, 22, 0.03)',
  '3': 'rgba(234, 179, 8, 0.03)',
  '4': 'rgba(34, 197, 94, 0.03)',
  '5': 'rgba(6, 182, 212, 0.03)',
  '6': 'rgba(168, 85, 247, 0.03)',
};

const PRESET_TINT_COLORS: Record<string, string> = {
  '1': 'var(--canvas-bg-color-1-tint)',
  '2': 'var(--canvas-bg-color-2-tint)',
  '3': 'var(--canvas-bg-color-3-tint)',
  '4': 'var(--canvas-bg-color-4-tint)',
  '5': 'var(--canvas-bg-color-5-tint)',
  '6': 'var(--canvas-bg-color-6-tint)',
};

/**
 * Returns true if the value looks like a raw CSS color (hex, rgb, var, etc.)
 */
function isRawColor(value: string): boolean {
  return value.startsWith('#') || value.startsWith('rgb') || value.startsWith('var');
}

/**
 * Resolve a node/edge color to a CSS value.
 *
 * @param color  - The raw color string from the canvas JSON (may be undefined)
 * @param preset - Map from preset number ('1'–'6') to CSS value
 * @param fallback - Default when color is empty/unrecognized
 * @returns A valid CSS color string
 */
export function resolveColor(
  color: string | undefined,
  preset: Record<string, string> = PRESET_COLORS,
  fallback: string = 'var(--canvas-node-border)',
): string {
  if (!color) return fallback;
  if (isRawColor(color)) return color;
  return preset[color] ?? fallback;
}

/**
 * Resolve the background color for a node based on its type and preset color.
 */
export function resolveNodeBgColor(color: string | undefined, type: string): string | undefined {
  if (type === 'group') {
    if (!color) return 'var(--canvas-group-bg)';
    return PRESET_BG_COLORS[color] ?? 'var(--canvas-group-bg)';
  }
  if (!color) return 'var(--canvas-node-bg)';
  return PRESET_TINT_COLORS[color] ?? 'var(--canvas-node-bg)';
}
