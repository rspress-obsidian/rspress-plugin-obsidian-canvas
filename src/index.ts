import type { RspressPlugin } from '@rspress/core';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import type { CanvasPluginOptions } from './types';

export type { CanvasPluginOptions } from './types';

export function pluginObsidianCanvas(
  options?: CanvasPluginOptions
): RspressPlugin {
  const resolvedOptions = {
    vaultRoot: options?.vaultRoot || process.cwd(),
    routePrefix: options?.routePrefix || '/canvas',
    include: options?.include || ['**/*.canvas'],
    exclude: options?.exclude || [],
    fileRoutePrefix: options?.fileRoutePrefix,
    linkPreview: options?.linkPreview || false,
  };

  const componentPath = path.join(
    import.meta.dirname || __dirname,
    'components',
    'CanvasViewer.tsx'
  );

  return {
    name: 'rspress-plugin-obsidian-canvas',

    async addPages(_config, _isProd) {
      const { default: glob } = await import('fast-glob');

      const canvasFiles = await glob(resolvedOptions.include, {
        ignore: resolvedOptions.exclude,
        absolute: true,
        cwd: resolvedOptions.vaultRoot,
      });

      const pages = await Promise.all(
        canvasFiles.map(async (filePath) => {
          const canvasJson = await readFile(filePath, 'utf-8');
          const routePath = path.posix.join(
            resolvedOptions.routePrefix,
            path.basename(filePath, '.canvas').toLowerCase()
          );

          return {
            routePath,
            content: `<CanvasViewer canvasJson={${JSON.stringify(canvasJson)}} fileRoutePrefix={${JSON.stringify(resolvedOptions.fileRoutePrefix)}} linkPreview={${JSON.stringify(resolvedOptions.linkPreview)}} />`,
          };
        })
      );

      return pages;
    },

    markdown: {
      globalComponents: [componentPath],
    },
  };
}
