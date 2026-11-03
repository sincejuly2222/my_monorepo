import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import MessageItem from "./index.vue";
import type { ChatMessage } from "../../types";

function createAssistantMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "assistant-message",
    role: "assistant",
    content: "**可复制的回复**",
    status: "complete",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("AI 消息", () => {
  it("渲染清理后的 Markdown 并触发复制", async () => {
    const wrapper = mount(MessageItem, {
      props: { message: createAssistantMessage() },
    });

    expect(wrapper.get("strong").text()).toBe("可复制的回复");
    const copyButton = wrapper.findAll("button").find((button) => button.text().includes("复制"));
    expect(copyButton).toBeDefined();
    await copyButton?.trigger("click");
    expect(wrapper.emitted("copy")?.[0]).toEqual(["**可复制的回复**"]);
  });

  it("错误消息提供重试操作并使用警告语义", async () => {
    const wrapper = mount(MessageItem, {
      props: { message: createAssistantMessage({ content: "", status: "error" }) },
    });

    expect(wrapper.get('[role="alert"]').text()).toContain("回复生成失败");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("retry")?.[0]).toEqual(["assistant-message"]);
  });
});
