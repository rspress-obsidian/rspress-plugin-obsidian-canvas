import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

const WIKI_LINK_REGEX = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
const WIKI_LINK_SIMPLE_REGEX = /\[\[([^\]]+)\]\]/g;

function preprocessWikiLinks(text: string): string {
  return text
    .replace(WIKI_LINK_REGEX, '\x00WIKILINK:$2:/$1\x01')
    .replace(WIKI_LINK_SIMPLE_REGEX, '\x00WIKILINK:$1:/$1\x01');
}

function postprocessWikiLinks(html: string): string {
  return html.replace(
    /\x00WIKILINK:([^:]+):([^\x01]+)\x01/g,
    '<a href="$2" class="wiki-link">$1</a>',
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeInput(text: string): string {
  const lines = text.split('\n');
  return lines
    .map((line) => {
      if (line.startsWith('```')) return line;
      if (line.match(/^\s*[-*]\s+\[[ x]\]/)) return line;
      if (line.match(/^\s*[-*]\s+/)) return line;
      if (line.match(/^\s*\d+\.\s+/)) return line;
      if (line.match(/^#{1,6}\s+/)) return line;
      if (line.startsWith('>')) return line;
      if (line.match(/^\|/)) return line;
      if (line.startsWith('---') || line.startsWith('***') || line.startsWith('___')) return line;
      return escapeHtml(line);
    })
    .join('\n');
}

export function renderMarkdown(text: string): string {
  if (!text) return '';

  const preprocessed = preprocessWikiLinks(text);
  const sanitized = sanitizeInput(preprocessed);
  const html = marked.parse(sanitized, { async: false }) as string;
  return postprocessWikiLinks(html);
}
