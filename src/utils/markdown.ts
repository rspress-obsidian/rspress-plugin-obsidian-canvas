import { marked } from 'marked';
import { sanitizeHtml } from './sanitize';

marked.setOptions({
  gfm: true,
  breaks: true,
});

const WIKI_LINK_REGEX = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
const WIKI_LINK_SIMPLE_REGEX = /\[\[([^\]]+)\]\]/g;
const WIKI_DELIM_START = '\u{2400}';
const WIKI_DELIM_END = '\u{2401}';

function preprocessWikiLinks(text: string): string {
  return text
    .replace(WIKI_LINK_REGEX, `${WIKI_DELIM_START}WIKILINK:$2:/$1${WIKI_DELIM_END}`)
    .replace(WIKI_LINK_SIMPLE_REGEX, `${WIKI_DELIM_START}WIKILINK:$1:/$1${WIKI_DELIM_END}`);
}

function postprocessWikiLinks(html: string): string {
  const pattern = new RegExp(
    `${WIKI_DELIM_START}WIKILINK:([^:]+):([^${WIKI_DELIM_END}]+)${WIKI_DELIM_END}`,
    'g',
  );
  return html.replace(pattern, '<a href="$2" class="wiki-link">$1</a>');
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
  return sanitizeHtml(postprocessWikiLinks(html));
}
