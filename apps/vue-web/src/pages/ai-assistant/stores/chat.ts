import dayjs from "dayjs";
import { computed, ref, shallowRef } from "vue";
import { defineStore } from "pinia";
import { streamMockReply } from "../services/mock-chat";
import type { ChatMessage, Conversation, ConversationGroup, ModelOption } from "../types";

interface ActiveGeneration {
  controller: AbortController;
  conversationId: string;
  messageId: string;
}

export const modelOptions: ModelOption[] = [
  { id: "general", label: "通用模型" },
  { id: "analysis", label: "分析模型" },
  { id: "creative", label: "创意模型" },
];

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMessage(
  role: ChatMessage["role"],
  content: string,
  status: ChatMessage["status"] = "complete",
): ChatMessage {
  return {
    id: createId(role),
    role,
    content,
    status,
    createdAt: new Date().toISOString(),
  };
}

function createConversation(): Conversation {
  const now = new Date().toISOString();

  return {
    id: createId("conversation"),
    title: "新对话",
    updatedAt: now,
    messages: [],
  };
}

function createConversationTitle(prompt: string): string {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  return normalized.length > 18 ? `${normalized.slice(0, 18)}…` : normalized;
}

function createInitialConversations(): Conversation[] {
  const now = new Date();
  const yesterday = dayjs(now).subtract(1, "day").toDate();
  const weeklyUser = createMessage("user", "请帮我整理本周的用户运营重点，并给出三项建议。");
  const weeklyAssistant = createMessage(
    "assistant",
    "建议先核对本周新增、活跃和流失用户的变化，再推进新用户引导、沉默用户召回和高频问题治理。",
  );

  return [
    createConversation(),
    {
      id: "weekly-operations",
      title: "本周用户运营重点",
      updatedAt: now.toISOString(),
      messages: [weeklyUser, weeklyAssistant],
    },
    {
      id: "role-permissions",
      title: "角色权限梳理",
      updatedAt: yesterday.toISOString(),
      messages: [],
    },
  ];
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export const useChatStore = defineStore("ai-chat", () => {
  const conversations = ref<Conversation[]>(createInitialConversations());
  const selectedId = ref(conversations.value[0]?.id ?? "");
  const modelId = ref(modelOptions[0]?.id ?? "general");
  const deepThinking = ref(false);
  const activeGeneration = shallowRef<ActiveGeneration | null>(null);
  const announcement = ref("AI 对话原型已就绪");

  const selectedConversation = computed(
    () =>
      conversations.value.find((conversation) => conversation.id === selectedId.value) ??
      conversations.value[0],
  );
  const generating = computed(() => activeGeneration.value !== null);
  const activeConversationId = computed(() => activeGeneration.value?.conversationId ?? null);
  const conversationGroups = computed<ConversationGroup[]>(() => {
    const groups: ConversationGroup[] = [
      { id: "today", label: "今天", conversations: [] },
      { id: "yesterday", label: "昨天", conversations: [] },
      { id: "earlier", label: "更早", conversations: [] },
    ];
    const today = dayjs();

    for (const conversation of conversations.value) {
      const updatedAt = dayjs(conversation.updatedAt);
      const group = updatedAt.isSame(today, "day")
        ? groups[0]
        : updatedAt.isSame(today.subtract(1, "day"), "day")
          ? groups[1]
          : groups[2];
      group?.conversations.push(conversation);
    }

    return groups.filter((group) => group.conversations.length > 0);
  });

  function findConversation(conversationId: string): Conversation | undefined {
    return conversations.value.find((conversation) => conversation.id === conversationId);
  }

  function updateMessage(
    conversationId: string,
    messageId: string,
    updater: (message: ChatMessage) => void,
  ): void {
    const conversation = findConversation(conversationId);
    const message = conversation?.messages.find((item) => item.id === messageId);

    if (message && conversation) {
      updater(message);
      conversation.updatedAt = new Date().toISOString();
    }
  }

  async function startGeneration(
    conversationId: string,
    messageId: string,
    prompt: string,
  ): Promise<void> {
    const controller = new AbortController();
    const generation = { controller, conversationId, messageId };
    activeGeneration.value = generation;
    announcement.value = "AI 助手正在生成回复";
    const model = modelOptions.find((option) => option.id === modelId.value) ?? modelOptions[0];

    if (!model) {
      return;
    }

    try {
      await streamMockReply({
        prompt,
        model,
        deepThinking: deepThinking.value,
        signal: controller.signal,
        onChunk(content) {
          updateMessage(conversationId, messageId, (message) => {
            message.content = content;
            message.status = "streaming";
          });
        },
      });
      updateMessage(conversationId, messageId, (message) => {
        message.status = "complete";
      });
      announcement.value = "AI 助手回复生成完成";
    } catch (error) {
      if (!isAbortError(error)) {
        updateMessage(conversationId, messageId, (message) => {
          message.status = "error";
        });
        announcement.value = "回复生成失败，请重试";
      }
    } finally {
      if (activeGeneration.value?.messageId === messageId) {
        activeGeneration.value = null;
      }
    }
  }

  function stopGeneration(): void {
    const generation = activeGeneration.value;

    if (!generation) {
      return;
    }

    generation.controller.abort();
    updateMessage(generation.conversationId, generation.messageId, (message) => {
      message.content ||= "已停止生成。";
      message.status = "complete";
    });
    activeGeneration.value = null;
    announcement.value = "已停止生成";
  }

  async function sendMessage(content: string): Promise<void> {
    const prompt = content.trim();
    const conversation = selectedConversation.value;

    if (!conversation || prompt === "" || generating.value) {
      return;
    }

    const userMessage = createMessage("user", prompt);
    const assistantMessage = createMessage("assistant", "", "streaming");
    conversation.messages.push(userMessage, assistantMessage);
    conversation.updatedAt = new Date().toISOString();

    if (conversation.title === "新对话") {
      conversation.title = createConversationTitle(prompt);
    }

    await startGeneration(conversation.id, assistantMessage.id, prompt);
  }

  function selectConversation(conversationId: string): void {
    if (findConversation(conversationId)) {
      selectedId.value = conversationId;
    }
  }

  function newConversation(): void {
    stopGeneration();
    const current = selectedConversation.value;

    if (current?.title === "新对话" && current.messages.length === 0) {
      return;
    }

    const conversation = createConversation();
    conversations.value.unshift(conversation);
    selectedId.value = conversation.id;
    announcement.value = "已新建对话";
  }

  function deleteConversation(conversationId: string): void {
    if (activeGeneration.value?.conversationId === conversationId) {
      stopGeneration();
    }

    const index = conversations.value.findIndex(
      (conversation) => conversation.id === conversationId,
    );

    if (index < 0) {
      return;
    }

    conversations.value.splice(index, 1);

    if (conversations.value.length === 0) {
      conversations.value.push(createConversation());
    }

    if (selectedId.value === conversationId) {
      selectedId.value =
        conversations.value[Math.min(index, conversations.value.length - 1)]?.id ?? "";
    }

    announcement.value = "会话已删除";
  }

  async function regenerateMessage(messageId: string): Promise<void> {
    const conversation = selectedConversation.value;

    if (!conversation || generating.value) {
      return;
    }

    const messageIndex = conversation.messages.findIndex((message) => message.id === messageId);
    const message = conversation.messages[messageIndex];
    const promptMessage = [...conversation.messages.slice(0, messageIndex)]
      .reverse()
      .find((item) => item.role === "user");

    if (!message || message.role !== "assistant" || !promptMessage) {
      return;
    }

    message.content = "";
    message.status = "streaming";
    await startGeneration(conversation.id, message.id, promptMessage.content);
  }

  return {
    conversations,
    selectedId,
    modelId,
    deepThinking,
    announcement,
    selectedConversation,
    generating,
    activeConversationId,
    conversationGroups,
    sendMessage,
    stopGeneration,
    selectConversation,
    newConversation,
    deleteConversation,
    regenerateMessage,
    retryMessage: regenerateMessage,
  };
});
