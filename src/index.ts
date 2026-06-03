import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RspressPlugin } from '@rspress/core';
import type { CanvasPluginOptions } from './types';

export type { CanvasPluginOptions } from './types';

/**
 * Read a canvas file and enrich its nodes with vault file content
 * (markdown, images, video, audio, PDF) built into the JSON.
 */
async function enrichCanvasFile(
  filePath: string,
  vaultRoot: string,
  publicAssetsDir?: string,
): Promise<string> {
  const canvasJson = await readFile(filePath, 'utf-8');
  let enrichedCanvasJson = canvasJson;

  try {
    const canvasData = JSON.parse(canvasJson);
    if (canvasData && Array.isArray(canvasData.nodes)) {
      for (const node of canvasData.nodes) {
        if (node.type === 'file' && typeof node.file === 'string') {
          const fileAbsPath = path.join(vaultRoot, node.file);
          try {
            const ext = path.extname(node.file).toLowerCase();
            const isMedia = [
              '.png',
              '.jpg',
              '.jpeg',
              '.gif',
              '.svg',
              '.webp',
              '.mp4',
              '.webm',
              '.mov',
              '.mkv',
              '.mp3',
              '.wav',
              '.ogg',
              '.m4a',
              '.flac',
              '.pdf',
            ].includes(ext);

            if (isMedia) {
              if (publicAssetsDir) {
                const relPath = path.relative(vaultRoot, fileAbsPath).replace(/\\/g, '/');
                const destPath = path.join(publicAssetsDir, relPath);
                await mkdir(path.dirname(destPath), { recursive: true });
                await copyFile(fileAbsPath, destPath);
                node.imageUrl = `/__canvas_assets__/${relPath}`;
              } else {
                const fileBuf = await readFile(fileAbsPath);
                const extName = ext.substring(1);
                let mimeType = '';
                if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
                  mimeType =
                    extName === 'svg'
                      ? 'image/svg+xml'
                      : `image/${extName === 'jpg' ? 'jpeg' : extName}`;
                } else if (['.mp4', '.webm', '.mov', '.mkv'].includes(ext)) {
                  mimeType = `video/${extName === 'mov' ? 'quicktime' : extName}`;
                } else if (['.mp3', '.wav', '.ogg', '.m4a', '.flac'].includes(ext)) {
                  mimeType = `audio/${extName === 'm4a' ? 'mp4' : extName}`;
                } else if (ext === '.pdf') {
                  mimeType = 'application/pdf';
                }
                node.imageUrl = `data:${mimeType};base64,${fileBuf.toString('base64')}`;
              }

              node.isImage = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext);
              node.isVideo = ['.mp4', '.webm', '.mov', '.mkv'].includes(ext);
              node.isAudio = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'].includes(ext);
              node.isPdf = ext === '.pdf';
            } else if (['.md', '.mdx', '.markdown'].includes(ext)) {
              const content = await readFile(fileAbsPath, 'utf-8');
              let parsedContent = content.trim();
              if (parsedContent.startsWith('---')) {
                const endIdx = parsedContent.indexOf('---', 3);
                if (endIdx !== -1) {
                  parsedContent = parsedContent.substring(endIdx + 3).trim();
                }
              }

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
                  // More robust regex that allows trailing spaces and captures the heading text properly
                  const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
                  if (match?.[1] && match[2]) {
                    const level = match[1].length;
                    // Strip basic markdown syntax from heading text for accurate comparison
                    const text = match[2]
                      .replace(/\*\*(.*?)\*\*/g, '$1')
                      .replace(/\*(.*?)\*/g, '$1')
                      .replace(/`(.*?)`/g, '$1')
                      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                      .toLowerCase()
                      .replace(/[-_]/g, ' ')
                      .trim();
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
                    const match = line.trim().match(/^(#{1,6})\s+(.+?)\s*$/);
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
              } else if (node.subpath?.startsWith('^')) {
                const blockId = node.subpath.substring(1).trim();
                const lines = parsedContent.split('\n');
                let blockLineIdx = -1;
                // Escape blockId for safe regex matching
                const escapedBlockId = blockId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const blockRegex = new RegExp(`\\^${escapedBlockId}\\s*$`);

                for (let i = 0; i < lines.length; i++) {
                  const line = lines[i]?.trim();
                  if (line && blockRegex.test(line)) {
                    blockLineIdx = i;
                    break;
                  }
                }

                if (blockLineIdx !== -1) {
                  let blockContent = lines[blockLineIdx] || '';
                  if (blockRegex.test(blockContent)) {
                    blockContent = blockContent.replace(blockRegex, '').trim();
                  }
                  parsedContent = blockContent;
                } else {
                  const fileNameOnly = path.basename(node.file, ext);
                  parsedContent = `Unable to find block "^${blockId}" in ${fileNameOnly}`;
                  node.isError = true;
                }
              }
              node.fileContent = parsedContent;
            }
          } catch (_fileErr) {
            console.warn(
              `[rspress-plugin-obsidian-canvas] Could not load vault file: ${node.file}`,
            );
            node.isError = true;
            node.fileContent = 'Failed to load file.';
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

  return enrichedCanvasJson;
}

export function pluginObsidianCanvas(options?: CanvasPluginOptions): RspressPlugin {
  const resolvedOptions = {
    vaultRoot: options?.vaultRoot || process.cwd(),
    routePrefix: options?.routePrefix || '/canvas',
    include: options?.include || ['**/*.canvas'],
    exclude: options?.exclude || [],
    fileRoutePrefix: options?.fileRoutePrefix,
    linkPreview: options?.linkPreview || false,
    iframeSandbox: options?.iframeSandbox || 'allow-scripts allow-same-origin allow-popups',
  };

  const dir = import.meta.dirname || __dirname;

  const componentPath = path.join(dir, 'components', 'CanvasViewer.tsx');
  const embedComponentPath = path.join(dir, 'components', 'CanvasEmbed.tsx');

  let stylePath = path.join(dir, 'canvas.css');
  if (!existsSync(stylePath)) {
    stylePath = path.join(dir, 'styles', 'canvas.css');
  }

  return {
    name: 'rspress-plugin-obsidian-canvas',
    globalStyles: stylePath,

    async addPages(config, _isProd) {
      const { default: glob } = await import('fast-glob');

      const canvasFiles = await glob(resolvedOptions.include, {
        ignore: resolvedOptions.exclude,
        absolute: true,
        cwd: resolvedOptions.vaultRoot,
      });

      const rootDir =
        config && typeof config === 'object' && 'root' in config
          ? String((config as Record<string, unknown>).root)
          : path.join(process.cwd(), 'docs');
      const publicAssetsDir = path.join(rootDir, 'public', '__canvas_assets__');
      const publicCanvasesDir = path.join(rootDir, 'public', '__canvases__');

      const enrichedFiles = await Promise.all(
        canvasFiles.map(async (filePath) => {
          return {
            filePath,
            enrichedJson: await enrichCanvasFile(
              filePath,
              resolvedOptions.vaultRoot,
              publicAssetsDir,
            ),
          };
        }),
      );

      const pages = enrichedFiles.map(({ filePath, enrichedJson }) => {
        const relPath = path.relative(resolvedOptions.vaultRoot, filePath);
        const routePath = path.posix.join(
          resolvedOptions.routePrefix,
          relPath
            .replace(/\.canvas$/i, '')
            .toLowerCase()
            .replace(/\\/g, '/'),
        );

        return {
          routePath,
          content: `<CanvasViewer canvasJson={${JSON.stringify(enrichedJson)}} fileRoutePrefix={${JSON.stringify(resolvedOptions.fileRoutePrefix)}} linkPreview={${JSON.stringify(resolvedOptions.linkPreview)}} iframeSandbox={${JSON.stringify(resolvedOptions.iframeSandbox)}} />`,
        };
      });

      for (const { filePath, enrichedJson } of enrichedFiles) {
        const relPath = path.relative(resolvedOptions.vaultRoot, filePath);
        const jsonName = relPath.replace(/\.canvas$/i, '.json');
        const outFilePath = path.join(publicCanvasesDir, jsonName);

        try {
          await mkdir(path.dirname(outFilePath), { recursive: true });
          await writeFile(outFilePath, enrichedJson, 'utf-8');
        } catch (writeErr) {
          console.error(
            `[rspress-plugin-obsidian-canvas] Failed to write embed JSON: ${outFilePath}`,
            writeErr,
          );
        }
      }

      return pages;
    },

    markdown: {
      globalComponents: [componentPath, embedComponentPath],
    },
  };
}
