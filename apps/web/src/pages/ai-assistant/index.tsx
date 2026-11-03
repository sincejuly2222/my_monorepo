import { MenuOutlined, RobotOutlined } from "@ant-design/icons";
import { App, ConfigProvider, Drawer } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { ChatComposer } from "./components/ChatComposer";
import { ConversationSidebar } from "./components/ConversationSidebar";
import { MessageList } from "./components/MessageList";
import { createMockReply } from "./services/mock-chat";
import type { ChatMessage, Conversation, ModelOption } from "./types";
import styles from "./index.module.css";
import themeStyles from "./theme.module.css";
import { assistantLayoutVariables, assistantTheme } from "./theme";

const modelOptions: ModelOption[] = [
  { id: "general", label: "通用模型" },
  { id: "analysis", label: "分析模型" },
  { id: "creative", label: "创意模型" },
];

const initialConversations: Conversation[] = [
  {
    id: "draft",
    title: "新对话",
    group: "today",
    messages: [],
  },
  {
    id: "weekly-operations",
    title: "本周用户运营重点",
    group: "today",
    messages: [
      {
        id: "weekly-user",
        role: "user",
        content: "请帮我整理本周的用户运营重点，并给出三项可执行建议。",
        status: "complete",
      },
      {
        id: "weekly-assistant",
        role: "assistant",
        content:
          "建议先核对本周新增、活跃和流失用户的变化，再优先推进新用户引导、沉默用户召回和高频问题治理。每项工作都应明确负责人、完成时间和可量化标准。",
        status: "complete",
      },
    ],
  },
  {
    id: "onboarding",
    title: "如何优化新用户引导？",
    group: "today",
    messages: [
      {
        id: "onboarding-user",
        role: "user",
        content: "如何优化新用户引导？",
        status: "complete",
      },
      {
        id: "onboarding-assistant",
        role: "assistant",
        content:
          "可以从缩短首次任务路径、提供可跳过的分步提示、记录关键步骤完成率三个方向开始，并通过小范围灰度验证效果。",
        status: "complete",
      },
    ],
  },
  {
    id: "role-permissions",
    title: "角色权限梳理",
    group: "yesterday",
    messages: [],
  },
  {
    id: "import-process",
    title: "人员导入流程说明",
    group: "yesterday",
    messages: [],
  },
];

interface ActiveGeneration {
  timer: ReturnType<typeof setInterval>;
  conversationId: string;
  messageId: string;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createConversation(): Conversation {
  return {
    id: createId("conversation"),
    title: "新对话",
    group: "today",
    messages: [],
  };
}

function createConversationTitle(prompt: string): string {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  return normalized.length > 18 ? `${normalized.slice(0, 18)}…` : normalized;
}

/** 纯前端 AI 对话原型；所有会话和消息仅保存在当前 React 内存中。 */
export function AiAssistantPage() {
  const { message } = App.useApp();
  const reducedMotion = useReducedMotion();
  const theme = useMemo(
    () => ({ ...assistantTheme, token: { ...assistantTheme.token, motion: !reducedMotion } }),
    [reducedMotion],
  );
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState(initialConversations[0]!.id);
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState(modelOptions[0]!.id);
  const [deepThinking, setDeepThinking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const activeGenerationRef = useRef<ActiveGeneration | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0],
    [conversations, selectedId],
  );

  useEffect(
    () => () => {
      if (activeGenerationRef.current) {
        clearInterval(activeGenerationRef.current.timer);
      }
    },
    [],
  );

  function updateMessage(
    conversationId: string,
    messageId: string,
    updater: (current: ChatMessage) => ChatMessage,
  ): void {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: conversation.messages.map((chatMessage) =>
                chatMessage.id === messageId ? updater(chatMessage) : chatMessage,
              ),
            }
          : conversation,
      ),
    );
  }

  function clearGeneration(): void {
    if (activeGenerationRef.current) {
      clearInterval(activeGenerationRef.current.timer);
      activeGenerationRef.current = null;
    }
  }

  function startGeneration(conversationId: string, messageId: string, sourcePrompt: string): void {
    clearGeneration();
    setGenerating(true);

    const model = modelOptions.find((option) => option.id === modelId) ?? modelOptions[0]!;
    let reply: string;

    try {
      reply = createMockReply(sourcePrompt, model, deepThinking);
    } catch {
      const timer = setTimeout(() => {
        updateMessage(conversationId, messageId, (current) => ({
          ...current,
          status: "error",
        }));
        activeGenerationRef.current = null;
        setGenerating(false);
      }, 650);

      activeGenerationRef.current = { timer, conversationId, messageId };
      return;
    }

    let visibleLength = 0;
    const timer = setInterval(() => {
      visibleLength = Math.min(visibleLength + 1, reply.length);
      updateMessage(conversationId, messageId, (current) => ({
        ...current,
        content: reply.slice(0, visibleLength),
        status: visibleLength === reply.length ? "complete" : "streaming",
      }));

      if (visibleLength === reply.length) {
        clearGeneration();
        setGenerating(false);
      }
    }, 32);

    activeGenerationRef.current = { timer, conversationId, messageId };
  }

  function stopGeneration(): void {
    const active = activeGenerationRef.current;

    if (!active) {
      return;
    }

    clearGeneration();
    updateMessage(active.conversationId, active.messageId, (current) => ({
      ...current,
      content: current.content || "已停止生成。",
      status: "complete",
    }));
    setGenerating(false);
  }

  function handleSend(): void {
    const content = prompt.trim();

    if (!selectedConversation || content === "" || generating) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId("user"),
      role: "user",
      content,
      status: "complete",
    };
    const assistantMessage: ChatMessage = {
      id: createId("assistant"),
      role: "assistant",
      content: "",
      status: "streaming",
    };

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              title:
                conversation.title === "新对话"
                  ? createConversationTitle(content)
                  : conversation.title,
              messages: [...conversation.messages, userMessage, assistantMessage],
            }
          : conversation,
      ),
    );
    setPrompt("");
    startGeneration(selectedConversation.id, assistantMessage.id, content);
  }

  function handleNewConversation(): void {
    stopGeneration();

    if (selectedConversation?.title === "新对话" && selectedConversation.messages.length === 0) {
      setPrompt("");
      setHistoryOpen(false);
      return;
    }

    const conversation = createConversation();
    setConversations((current) => [conversation, ...current]);
    setSelectedId(conversation.id);
    setPrompt("");
    setHistoryOpen(false);
  }

  function handleSelectConversation(conversationId: string): void {
    setSelectedId(conversationId);
    setPrompt("");
    setHistoryOpen(false);
  }

  function handleDeleteConversation(conversationId: string): void {
    if (activeGenerationRef.current?.conversationId === conversationId) {
      clearGeneration();
      setGenerating(false);
    }

    const remaining = conversations.filter((conversation) => conversation.id !== conversationId);

    if (remaining.length === 0) {
      const conversation = createConversation();
      setConversations([conversation]);
      setSelectedId(conversation.id);
      return;
    }

    setConversations(remaining);
    if (selectedId === conversationId) {
      setSelectedId(remaining[0]!.id);
    }
  }

  function regenerateMessage(messageId: string): void {
    if (!selectedConversation) {
      return;
    }

    stopGeneration();
    const messageIndex = selectedConversation.messages.findIndex(
      (chatMessage) => chatMessage.id === messageId,
    );
    const sourceMessage = selectedConversation.messages
      .slice(0, messageIndex)
      .reverse()
      .find((chatMessage) => chatMessage.role === "user");

    if (!sourceMessage) {
      return;
    }

    const failedMessage = selectedConversation.messages[messageIndex]?.status === "error";

    updateMessage(selectedConversation.id, messageId, (current) => ({
      ...current,
      content: "",
      status: "streaming",
    }));
    startGeneration(
      selectedConversation.id,
      messageId,
      failedMessage && sourceMessage.content.trim() === "/error"
        ? "请生成一条恢复后的演示回复"
        : sourceMessage.content,
    );
  }

  async function handleCopy(content: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(content);
      message.success("回答已复制");
    } catch {
      message.error("复制失败，请手动选择文本");
    }
  }

  function handleDrawerStateChange(open: boolean): void {
    if (!open) {
      menuButtonRef.current?.focus();
    }
  }

  const sidebar = (
    <ConversationSidebar
      conversations={conversations}
      selectedId={selectedConversation?.id ?? ""}
      onNew={handleNewConversation}
      onSelect={handleSelectConversation}
      onDelete={handleDeleteConversation}
      onNavigate={() => setHistoryOpen(false)}
    />
  );

  return (
    <ConfigProvider theme={theme}>
      <div className={`${themeStyles.scope} ${styles.workspace}`} style={assistantLayoutVariables}>
        <aside className={styles.sidebarDesktop} aria-label="会话导航">
          {sidebar}
        </aside>

        <main className={styles.chatCanvas} aria-label="AI 助手">
          <header className={styles.mobileToolbar}>
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuButton}
              aria-controls="assistant-mobile-history"
              aria-expanded={historyOpen}
              aria-label="打开会话历史"
              onClick={() => setHistoryOpen(true)}
            >
              <MenuOutlined aria-hidden="true" />
            </button>
            <div className={styles.mobileBrand}>
              <span aria-hidden="true">A</span>
              后台管理系统
            </div>
            <span className={styles.prototypeLabel}>本地原型</span>
          </header>

          {selectedConversation && selectedConversation.messages.length > 0 ? (
            <MessageList
              messages={selectedConversation.messages}
              onCopy={(content) => void handleCopy(content)}
              onRegenerate={regenerateMessage}
              onRetry={regenerateMessage}
            />
          ) : (
            <section className={styles.emptyState}>
              <div className={styles.emptyMark} aria-hidden="true">
                <RobotOutlined />
              </div>
              <span>后台智能工作台</span>
              <h1>AI 助手</h1>
              <p>描述需要处理的任务，我会协助你整理思路和下一步行动。</p>
            </section>
          )}

          <div className={styles.composerWrap}>
            <ChatComposer
              value={prompt}
              models={modelOptions}
              modelId={modelId}
              deepThinking={deepThinking}
              generating={generating}
              onChange={setPrompt}
              onModelChange={setModelId}
              onToggleThinking={() => setDeepThinking((current) => !current)}
              onSend={handleSend}
              onStop={stopGeneration}
            />
          </div>
        </main>

        <Drawer
          rootClassName={themeStyles.scope}
          rootStyle={assistantLayoutVariables}
          styles={{
            content: { background: "var(--assistant-sidebar)" },
            body: { padding: 0 },
            wrapper: reducedMotion ? { transition: "none" } : undefined,
            mask: reducedMotion ? { transition: "none" } : undefined,
          }}
          width={280}
          placement="left"
          closable={false}
          keyboard
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          afterOpenChange={handleDrawerStateChange}
        >
          <div id="assistant-mobile-history" className={styles.mobileHistory}>
            {sidebar}
          </div>
        </Drawer>
      </div>
    </ConfigProvider>
  );
}
