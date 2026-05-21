import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { RspressPlugin } from '@rspress/core';
import type { CanvasPluginOptions } from './types';

export type { CanvasPluginOptions } from './types';

export function pluginObsidianCanvas(options?: CanvasPluginOptions): RspressPlugin {
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
    'CanvasViewer.tsx',
  );

  let stylePath = path.join(import.meta.dirname || __dirname, 'canvas.css');
  if (!existsSync(stylePath)) {
    stylePath = path.join(import.meta.dirname || __dirname, 'styles', 'canvas.css');
  }

  return {
    name: 'rspress-plugin-obsidian-canvas',
    globalStyles: stylePath,

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

          // Enrich canvas data with build-time file contents and images from vault
          let enrichedCanvasJson = canvasJson;
          try {
            const canvasData = JSON.parse(canvasJson);
            if (canvasData && Array.isArray(canvasData.nodes)) {
              for (const node of canvasData.nodes) {
                if (node.type === 'file' && typeof node.file === 'string') {
                  const fileAbsPath = path.join(resolvedOptions.vaultRoot, node.file);
                  try {
                    const ext = path.extname(node.file).toLowerCase();
                    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
                      const imgBuf = await readFile(fileAbsPath);
                      const extName = ext.substring(1);
                      const mimeType =
                        extName === 'svg'
                          ? 'image/svg+xml'
                          : `image/${extName === 'jpg' ? 'jpeg' : extName}`;
                      node.imageUrl = `data:${mimeType};base64,${imgBuf.toString('base64')}`;
                      node.isImage = true;
                    } else if (['.mp4', '.webm', '.mov', '.mkv'].includes(ext)) {
                      const mediaBuf = await readFile(fileAbsPath);
                      const extName = ext.substring(1);
                      const mimeType = `video/${extName === 'mov' ? 'quicktime' : extName}`;
                      node.imageUrl = `data:${mimeType};base64,${mediaBuf.toString('base64')}`;
                      node.isVideo = true;
                    } else if (['.mp3', '.wav', '.ogg', '.m4a', '.flac'].includes(ext)) {
                      const mediaBuf = await readFile(fileAbsPath);
                      const extName = ext.substring(1);
                      const mimeType = `audio/${extName === 'm4a' ? 'mp4' : extName}`;
                      node.imageUrl = `data:${mimeType};base64,${mediaBuf.toString('base64')}`;
                      node.isAudio = true;
                    } else if (ext === '.pdf') {
                      const pdfBuf = await readFile(fileAbsPath);
                      node.imageUrl = `data:application/pdf;base64,${pdfBuf.toString('base64')}`;
                      node.isPdf = true;
                    } else if (['.md', '.mdx', '.markdown'].includes(ext)) {
                      const content = await readFile(fileAbsPath, 'utf-8');
                      let parsedContent = content.trim();
                      if (parsedContent.startsWith('---')) {
                        const endIdx = parsedContent.indexOf('---', 3);
                        if (endIdx !== -1) {
                          parsedContent = parsedContent.substring(endIdx + 3).trim();
                        }
                      }

                      // Heading/subpath section resolution
                      if (node.subpath?.startsWith('#')) {
                        const headingName = node.subpath
                          .substring(1)
                          .toLowerCase()
                          .replace(/[-_]/g, ' ')
                          .trim();
                        const lines = parsedContent.split('\n');
                        let headingLineIdx = -1;
                        let headingLevel = 0;

                        for (let i = 0; i < lines.length; i++) {
                          const line = lines[i]?.trim();
                          if (!line) continue;
                          const match = line.match(/^(#{1,6})\s+(.+)$/);
                          if (match?.[1] && match[2]) {
                            const level = match[1].length;
                            const text = match[2].toLowerCase().replace(/[-_]/g, ' ').trim();
                            if (text === headingName) {
                              headingLineIdx = i;
                              headingLevel = level;
                              break;
                            }
                          }
                        }

                        if (headingLineIdx !== -1) {
                          const sectionLines = [];
                          for (let i = headingLineIdx + 1; i < lines.length; i++) {
                            const line = lines[i];
                            if (line === undefined) continue;
                            const match = line.trim().match(/^(#{1,6})\s+(.+)$/);
                            if (match?.[1]) {
                              const level = match[1].length;
                              if (level <= headingLevel) {
                                break;
                              }
                            }
                            sectionLines.push(line);
                          }
                          parsedContent = sectionLines.join('\n').trim();
                        } else {
                          const fileNameOnly = path.basename(node.file, ext);
                          parsedContent = `Unable to find "${node.subpath.substring(1)}" in ${fileNameOnly}`;
                          node.isError = true;
                        }
                      }
                      node.fileContent = parsedContent;
                    }
                  } catch (_fileErr) {
                    console.warn(
                      `[rspress-plugin-obsidian-canvas] Could not load vault file: ${node.file}`,
                    );
                  }
                }
              }
              enrichedCanvasJson = JSON.stringify(canvasData);
            }
          } catch (jsonErr) {
            console.error(
              `[rspress-plugin-obsidian-canvas] Failed to parse canvas file: ${filePath}`,
              jsonErr,
            );
          }

          const routePath = path.posix.join(
            resolvedOptions.routePrefix,
            path.basename(filePath, '.canvas').toLowerCase(),
          );

          return {
            routePath,
            content: `<CanvasViewer canvasJson={${JSON.stringify(enrichedCanvasJson)}} fileRoutePrefix={${JSON.stringify(resolvedOptions.fileRoutePrefix)}} linkPreview={${JSON.stringify(resolvedOptions.linkPreview)}} />`,
          };
        }),
      );

      return pages;
    },

    markdown: {
      globalComponents: [componentPath],
    },
  };
}
