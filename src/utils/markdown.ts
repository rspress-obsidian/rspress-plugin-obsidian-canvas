export function renderMarkdown(text: string): string {
  if (!text) return '';

  const escaped = escapeHtml(text);
  const lines = escaped.split('\n');
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    const codeFenceMatch = line.match(/^```(\w*)/);
    if (codeFenceMatch) {
      const lang = codeFenceMatch[1] || '';
      let code = '';
      i++;
      while (i < lines.length && !lines[i]!.startsWith('```')) {
        code += (code ? '\n' : '') + lines[i]!;
        i++;
      }
      i++;
      const langAttr = lang ? ` class="language-${lang}"` : '';
      blocks.push(`<pre><code${langAttr}>${code}</code></pre>`);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1]!.length;
      blocks.push(`<h${level}>${applyInline(headingMatch[2]!)}</h${level}>`);
      i++;
      continue;
    }

    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push('<hr />');
      i++;
      continue;
    }

    if (line.match(/^&gt;\s?(.*)/)) {
      let quoteContent = '';
      while (i < lines.length && lines[i]!.match(/^&gt;\s?(.*)/)) {
        const content = lines[i]!.replace(/^&gt;\s?/, '');
        quoteContent += (quoteContent ? '\n' : '') + content;
        i++;
      }
      blocks.push(`<blockquote>${applyInline(quoteContent)}</blockquote>`);
      continue;
    }

    if (line.match(/^[\*\-]\s+(.+)/)) {
      let items = '';
      while (i < lines.length && lines[i]!.match(/^[\*\-]\s+(.+)/)) {
        const content = lines[i]!.replace(/^[\*\-]\s+/, '');
        items += `<li>${applyInline(content)}</li>`;
        i++;
      }
      blocks.push(`<ul>${items}</ul>`);
      continue;
    }

    if (line.match(/^\d+\.\s+(.+)/)) {
      let items = '';
      while (i < lines.length && lines[i]!.match(/^\d+\.\s+(.+)/)) {
        const content = lines[i]!.replace(/^\d+\.\s+/, '');
        items += `<li>${applyInline(content)}</li>`;
        i++;
      }
      blocks.push(`<ol>${items}</ol>`);
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    let paraLines: string[] = [];
    while (i < lines.length && lines[i]!.trim() !== '') {
      const current = lines[i]!;
      if (
        current.match(/^#{1,6}\s+/) ||
        current.startsWith('```') ||
        current.match(/^&gt;\s?/) ||
        current.match(/^[\*\-]\s+/) ||
        current.match(/^\d+\.\s+/) ||
        /^(\-{3,}|\*{3,}|_{3,})$/.test(current.trim())
      ) {
        break;
      }
      paraLines.push(current);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push(`<p>${applyInline(paraLines.join('<br />'))}</p>`);
    }
  }

  return blocks.join('\n');
}

function applyInline(text: string): string {
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  text = text.replace(
    /\[\[([^\]|]+)\|([^\]]+)\]\]/g,
    '<a href="/$1" class="wiki-link">$2</a>'
  );
  text = text.replace(
    /\[\[([^\]]+)\]\]/g,
    '<a href="/$1" class="wiki-link">$1</a>'
  );
  text = text.replace(
    /&lt;(https?:\/\/[^&gt;]+)&gt;/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return text;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
