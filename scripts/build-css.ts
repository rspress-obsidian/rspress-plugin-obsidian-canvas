import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transform } from 'lightningcss';

const cssPath = resolve(import.meta.dirname, '..', 'dist', 'canvas.css');

const source = readFileSync(cssPath);

const result = transform({
  filename: 'canvas.css',
  code: source,
  minify: true,
});

writeFileSync(cssPath, result.code);

const inKB = (source.length / 1024).toFixed(1);
const outKB = (result.code.length / 1024).toFixed(1);
const saved = ((1 - result.code.length / source.length) * 100).toFixed(0);

console.log(`✓ canvas.css minified: ${inKB}KB → ${outKB}KB (${saved}% smaller)`);
