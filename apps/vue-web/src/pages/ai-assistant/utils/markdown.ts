import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import MarkdownIt, { type RendererRule } from "markdown-it";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: false,
  highlight(code, language): string {
    if (language && hljs.getLanguage(language)) {
      return `<pre class="hljs"><code>${hljs.highlight(code, { language }).value}</code></pre>`;
    }

    return `<pre class="hljs"><code>${escapeHtml(code)}</code></pre>`;
  },
});

const defaultLinkOpen: RendererRule =
  markdown.renderer.rules.link_open ??
  ((tokens, index, options, _environment, renderer) =>
    renderer.renderToken(tokens, index, options));

const linkOpenRule: RendererRule = (tokens, index, options, environment, renderer) => {
  tokens[index]?.attrSet("target", "_blank");
  tokens[index]?.attrSet("rel", "noopener noreferrer");
  return defaultLinkOpen(tokens, index, options, environment, renderer);
};

markdown.renderer.rules.link_open = linkOpenRule;

/** 将 Markdown 转换为经过清理的 HTML，禁止原始 HTML 和危险属性进入页面。 */
export function renderMarkdown(source: string): string {
  return DOMPurify.sanitize(markdown.render(source), {
    ADD_ATTR: ["target"],
    ALLOWED_ATTR: ["class", "href", "rel", "target"],
    ALLOWED_TAGS: [
      "a",
      "blockquote",
      "br",
      "code",
      "del",
      "em",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      "li",
      "ol",
      "p",
      "pre",
      "span",
      "strong",
      "ul",
    ],
  });
}
