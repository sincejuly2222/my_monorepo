import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("Markdown 安全渲染", () => {
  it("渲染常用 Markdown 和代码高亮", () => {
    const html = renderMarkdown("## 标题\n\n```ts\nconst value = 1\n```");

    expect(html).toContain("标题");
    expect(html).toContain("hljs");
    expect(html).toContain("hljs-keyword");
  });

  it("不会把原始 HTML 和事件属性解析为可执行节点", () => {
    const html = renderMarkdown(
      '<img src="x" onerror="alert(1)"><script>alert(1)</script> [危险链接](javascript:alert(1))',
    );
    const container = document.createElement("div");
    container.innerHTML = html;

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  });

  it("外部链接使用独立窗口和安全 rel 属性", () => {
    const html = renderMarkdown("[Vue](https://vuejs.org)");
    const container = document.createElement("div");
    container.innerHTML = html;
    const link = container.querySelector("a");

    expect(link?.target).toBe("_blank");
    expect(link?.rel).toContain("noopener");
  });
});
