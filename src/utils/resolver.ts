const MD_EXTENSIONS = new Set(['.md', '.mdx', '.markdown']);

export function resolveFileRoute(filePath: string, prefix?: string): string {
  const ext = filePath.match(/\.\w+$/)?.[0] || '';
  const isMarkdown = MD_EXTENSIONS.has(ext.toLowerCase());

  if (!isMarkdown) {
    return filePath.startsWith('/') ? filePath : `/${filePath}`;
  }

  const clean = filePath.replace(/\.\w+$/i, '').replace(/\s+/g, '-').toLowerCase();
  if (prefix) {
    return `${prefix}/${clean}`;
  }
  return `/${clean}`;
}
