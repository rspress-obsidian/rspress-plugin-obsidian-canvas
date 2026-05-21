import { defineConfig } from 'tsup';

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
    external: ['react', 'react-dom'],
    target: 'es2020',
    dts: false,
    noExternal: ['marked'],
  },
  {
    entry: ['src/styles/canvas.css'],
    format: ['esm'],
    outDir: 'dist',
    target: 'es2020',
  },
]);
