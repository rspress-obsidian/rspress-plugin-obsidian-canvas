import { marked } from 'marked';
import { sanitizeHtml } from './sanitize';

marked.setOptions({
  gfm: true,
  breaks: true,
});

const WIKI_DELIM_START = '\u{2400}';
const WIKI_DELIM_END = '\u{2401}';
const HIGHLIGHT_DELIM_START = '\u{2402}';
const HIGHLIGHT_DELIM_END = '\u{2403}';

function slugifyFileName(name: string): string {
  return name
    .replace(/\.\w+$/i, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function preprocessWikiLinks(text: string, fileRoutePrefix?: string): string {
  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_match, target, display) => {
      const slug = slugifyFileName(target);
      const href = fileRoutePrefix ? `${fileRoutePrefix}/${slug}` : `/${slug}`;
      return `${WIKI_DELIM_START}WIKILINK:${display}:${href}${WIKI_DELIM_END}`;
    })
    .replace(/\[\[([^\]]+)\]\]/g, (_match, target) => {
      const slug = slugifyFileName(target);
      const href = fileRoutePrefix ? `${fileRoutePrefix}/${slug}` : `/${slug}`;
      return `${WIKI_DELIM_START}WIKILINK:${target}:${href}${WIKI_DELIM_END}`;
    });
}

function postprocessWikiLinks(html: string): string {
  const pattern = new RegExp(
    `${WIKI_DELIM_START}WIKILINK:([^:]+):([^${WIKI_DELIM_END}]+)${WIKI_DELIM_END}`,
    'g',
  );
  return html.replace(pattern, '<a href="$2" class="wiki-link">$1</a>');
}

function preprocessHighlights(text: string): string {
  return text.replace(/==([^=]+)==/g, `${HIGHLIGHT_DELIM_START}$1${HIGHLIGHT_DELIM_END}`);
}

function postprocessHighlights(html: string): string {
  const pattern = new RegExp(
    `${HIGHLIGHT_DELIM_START}([^${HIGHLIGHT_DELIM_END}]+)${HIGHLIGHT_DELIM_END}`,
    'g',
  );
  return html.replace(pattern, '<mark>$1</mark>');
}

const calloutExtension = {
  name: 'callout',
  level: 'block',
  start(src: string) {
    return src.match(/^>\s*\[![a-zA-Z-]+\]/)?.index;
  },
  tokenizer(src: string) {
    const match = src.match(
      /^>\s*\[!([a-zA-Z-]+)\]([-+])?(?:\s+([^\n]*))?(?:\n((?:>.*(?:\n|$))*))?/,
    );
    if (match) {
      const type = match[1].toLowerCase();
      const modifier = match[2];
      const title = match[3]?.trim() || '';
      const content = match[4]?.replace(/^>\s?/gm, '').trim() || '';

      return {
        type: 'callout',
        raw: match[0],
        calloutType: type,
        modifier,
        title,
        content,
        tokens: content ? this.lexer.blockTokens(content) : [],
      };
    }
  },
  renderer(token: { title?: string; calloutType: string; modifier?: string; tokens?: unknown[] }) {
    const titleHtml = token.title
      ? `<div class="callout-title"><div class="callout-title-inner">${this.parser.parseInline([{ type: 'text', raw: token.title, text: token.title }])}</div></div>`
      : '';
    const contentHtml = token.tokens?.length ? this.parser.parse(token.tokens) : '';

    return `<div class="callout" data-callout="${token.calloutType}" data-callout-fold="${token.modifier || ''}">
      ${titleHtml}
      <div class="callout-content">${contentHtml}</div>
    </div>`;
  },
};

marked.use({ extensions: [calloutExtension] });

export function renderMarkdown(text: string, fileRoutePrefix?: string): string {
  if (!text) return '';

  const preprocessed = preprocessHighlights(preprocessWikiLinks(text, fileRoutePrefix));
  const html = marked.parse(preprocessed, { async: false }) as string;
  const sanitized = sanitizeHtml(postprocessWikiLinks(html));
  return postprocessHighlights(sanitized);
}
