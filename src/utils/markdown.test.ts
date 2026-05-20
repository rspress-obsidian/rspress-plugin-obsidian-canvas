import { test, expect } from "bun:test";
import { renderMarkdown } from "./markdown";

test("renders plain text as paragraph", () => {
  const html = renderMarkdown("Hello world");
  expect(html).toContain("<p>Hello world</p>");
});

test("renders empty string", () => {
  expect(renderMarkdown("")).toBe("");
});

test("renders headings h1-h6", () => {
  for (let i = 1; i <= 6; i++) {
    const hashes = "#".repeat(i);
    const html = renderMarkdown(`${hashes} Heading ${i}`);
    expect(html).toContain(`<h${i}>Heading ${i}</h${i}>`);
  }
});

test("renders bold text", () => {
  const html = renderMarkdown("**bold text**");
  expect(html).toContain("<strong>bold text</strong>");
});

test("renders italic text", () => {
  const html = renderMarkdown("*italic text*");
  expect(html).toContain("<em>italic text</em>");
});

test("renders bold+italic text", () => {
  const html = renderMarkdown("***bold italic***");
  expect(html).toContain("<strong><em>bold italic</em></strong>");
});

test("renders inline code", () => {
  const html = renderMarkdown("Use `const x = 1`");
  expect(html).toContain("<code>const x = 1</code>");
});

test("renders code blocks with language", () => {
  const html = renderMarkdown("```js\nconst x = 1;\n```");
  expect(html).toContain('<pre><code class="language-js">const x = 1;</code></pre>');
});

test("renders code blocks without language", () => {
  const html = renderMarkdown("```\nsome code\n```");
  expect(html).toContain("<pre><code>some code</code></pre>");
});

test("renders standard links", () => {
  const html = renderMarkdown("[Rspress](https://rspress.dev)");
  expect(html).toContain('<a href="https://rspress.dev"');
  expect(html).toContain(">Rspress</a>");
});

test("renders auto-links", () => {
  const html = renderMarkdown("<https://example.com>");
  expect(html).toContain('<a href="https://example.com"');
});

test("renders images", () => {
  const html = renderMarkdown("![alt text](https://example.com/img.png)");
  expect(html).toContain('<img src="https://example.com/img.png" alt="alt text" />');
});

test("renders wiki-links without display text", () => {
  const html = renderMarkdown("[[My Note]]");
  expect(html).toContain('<a href="/My Note" class="wiki-link">My Note</a>');
});

test("renders wiki-links with display text", () => {
  const html = renderMarkdown("[[My Note|Click Here]]");
  expect(html).toContain('<a href="/My Note" class="wiki-link">Click Here</a>');
});

test("renders horizontal rules", () => {
  expect(renderMarkdown("---")).toContain("<hr />");
  expect(renderMarkdown("***")).toContain("<hr />");
  expect(renderMarkdown("___")).toContain("<hr />");
});

test("renders blockquotes", () => {
  const html = renderMarkdown("> This is a quote");
  expect(html).toContain("<blockquote>This is a quote</blockquote>");
});

test("renders unordered lists as single ul", () => {
  const html = renderMarkdown("- item one\n- item two\n- item three");
  expect(html).toContain("<ul><li>item one</li><li>item two</li><li>item three</li></ul>");
  expect(html).not.toContain("</ul><ul>");
});

test("renders unordered lists with asterisk", () => {
  const html = renderMarkdown("* item one\n* item two");
  expect(html).toContain("<ul><li>item one</li><li>item two</li></ul>");
});

test("renders ordered lists as single ol", () => {
  const html = renderMarkdown("1. first\n2. second\n3. third");
  expect(html).toContain("<ol><li>first</li><li>second</li><li>third</li></ol>");
  expect(html).not.toContain("</ol><ol>");
});

test("consecutive list items merge into one list", () => {
  const html = renderMarkdown("- a\n- b\n- c");
  const ulCount = (html.match(/<ul>/g) || []).length;
  expect(ulCount).toBe(1);
});

test("escapes HTML in text", () => {
  const html = renderMarkdown("<script>alert('xss')</script>");
  expect(html).not.toContain("<script>");
  expect(html).toContain("&lt;script&gt;");
});

test("renders multi-paragraph text", () => {
  const html = renderMarkdown("First paragraph\n\nSecond paragraph");
  expect(html).toContain("<p>First paragraph</p>");
  expect(html).toContain("<p>Second paragraph</p>");
});

test("renders mixed content in order", () => {
  const html = renderMarkdown("# Title\n\nSome text\n\n- item\n\n> quote");
  const h1Idx = html.indexOf("<h1>Title</h1>");
  const pIdx = html.indexOf("<p>Some text</p>");
  const ulIdx = html.indexOf("<ul>");
  const bqIdx = html.indexOf("<blockquote>");
  expect(h1Idx).toBeLessThan(pIdx);
  expect(pIdx).toBeLessThan(ulIdx);
  expect(ulIdx).toBeLessThan(bqIdx);
});

test("renders inline formatting inside headings", () => {
  const html = renderMarkdown("## **Bold** heading");
  expect(html).toContain("<h2><strong>Bold</strong> heading</h2>");
});

test("renders inline formatting inside list items", () => {
  const html = renderMarkdown("- **bold** and *italic*");
  expect(html).toContain("<li><strong>bold</strong> and <em>italic</em></li>");
});

test("renders italic with underscores", () => {
  const html = renderMarkdown("_underscore italic_");
  expect(html).toContain("<em>underscore italic</em>");
});

test("renders complex canvas text node content", () => {
  const text = "# Welcome to Obsidian Canvas\n\nThis text node supports **bold**, *italic*, and `code`.\n\n- List item one\n- List item two\n\n> A blockquote for emphasis";
  const html = renderMarkdown(text);
  expect(html).toContain("<h1>Welcome to Obsidian Canvas</h1>");
  expect(html).toContain("<strong>bold</strong>");
  expect(html).toContain("<em>italic</em>");
  expect(html).toContain("<code>code</code>");
  expect(html).toContain("<ul><li>List item one</li><li>List item two</li></ul>");
  expect(html).toContain("<blockquote>A blockquote for emphasis</blockquote>");
});
