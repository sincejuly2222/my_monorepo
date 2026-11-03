import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useChatStore } from "./chat";

describe("AI 对话状态", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("发送消息后生成标题并完成流式回复", async () => {
    const store = useChatStore();
    const sending = store.sendMessage("请帮我整理用户运营重点");

    expect(store.generating).toBe(true);
    expect(store.selectedConversation?.title).toBe("请帮我整理用户运营重点");
    expect(store.selectedConversation?.messages).toHaveLength(2);

    await vi.runAllTimersAsync();
    await sending;

    const assistantMessage = store.selectedConversation?.messages[1];
    expect(store.generating).toBe(false);
    expect(assistantMessage?.status).toBe("complete");
    expect(assistantMessage?.content).toContain("新用户引导");
  });

  it("停止生成时保留已经生成的内容", async () => {
    const store = useChatStore();
    const sending = store.sendMessage("给出一个完整的执行建议");

    await vi.advanceTimersByTimeAsync(100);
    store.stopGeneration();
    await sending;

    const assistantMessage = store.selectedConversation?.messages[1];
    expect(store.generating).toBe(false);
    expect(assistantMessage?.status).toBe("complete");
    expect(assistantMessage?.content.length).toBeGreaterThan(0);
  });

  it("输入特殊命令时展示可重试的错误状态", async () => {
    const store = useChatStore();
    const sending = store.sendMessage("/error");

    await vi.runAllTimersAsync();
    await sending;

    const assistantMessage = store.selectedConversation?.messages[1];
    expect(assistantMessage?.status).toBe("error");
    expect(store.announcement).toContain("失败");
  });

  it("重新生成时复用上一条用户消息且不重复添加消息", async () => {
    const store = useChatStore();
    const firstGeneration = store.sendMessage("请给我一段 TypeScript 代码");
    await vi.runAllTimersAsync();
    await firstGeneration;

    const assistantMessage = store.selectedConversation?.messages[1];
    expect(assistantMessage).toBeDefined();
    const regeneration = store.regenerateMessage(assistantMessage?.id ?? "");

    expect(store.selectedConversation?.messages).toHaveLength(2);
    await vi.runAllTimersAsync();
    await regeneration;
    expect(assistantMessage?.content).toContain("interface TaskResult");
  });

  it("删除正在生成的会话时终止任务并选择剩余会话", async () => {
    const store = useChatStore();
    const activeId = store.selectedId;
    const sending = store.sendMessage("这是一个较长的生成任务");

    await vi.advanceTimersByTimeAsync(70);
    store.deleteConversation(activeId);
    await sending;

    expect(store.generating).toBe(false);
    expect(store.conversations.some((conversation) => conversation.id === activeId)).toBe(false);
    expect(store.selectedId).not.toBe(activeId);
  });

  it("删除最后一个会话后自动保留一个空会话", () => {
    const store = useChatStore();

    for (const conversation of [...store.conversations]) {
      store.deleteConversation(conversation.id);
    }

    expect(store.conversations).toHaveLength(1);
    expect(store.selectedConversation?.title).toBe("新对话");
  });
});
