import { defineConfig } from 'tsup';
import { minifyCssFile } from './scripts/minify-css';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    outDir: 'dist',
    external: ['react', 'react-dom', '@rspress/core', 'marked'],
    target: 'es2020',
    treeshake: true,
    splitting: true,
  },
  {
    entry: ['src/components/CanvasViewer.tsx'],
    format: ['esm'],
    outDir: 'dist/components',
    external: ['react', 'react-dom', 'mermaid'],
    target: 'es2020',
    dts: false,
    noExternal: ['marked'],
  },
  {
    entry: ['src/styles/canvas.css'],
    format: ['esm'],
    outDir: 'dist',
    target: 'es2020',
    onSuccess: async () => {
      await minifyCssFile('dist/canvas.css');
    },
  },
]);
