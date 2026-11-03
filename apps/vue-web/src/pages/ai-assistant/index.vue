<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { storeToRefs } from "pinia";
import { ChatLineRound, Menu } from "@element-plus/icons-vue";
import ChatComposer from "./components/ChatComposer/index.vue";
import ConversationSidebar from "./components/ConversationSidebar/index.vue";
import MessageList from "./components/MessageList/index.vue";
import { modelOptions, useChatStore } from "./stores/chat";

defineOptions({ name: "AiAssistantPage" });

const chatStore = useChatStore();
const {
  selectedId,
  modelId,
  deepThinking,
  announcement,
  selectedConversation,
  generating,
  activeConversationId,
  conversationGroups,
} = storeToRefs(chatStore);
const prompt = ref("");
const historyOpen = ref(false);
const menuButton = ref<HTMLButtonElement | null>(null);
const currentTitle = computed(() => selectedConversation.value?.title ?? "新对话");

async function handleSend(): Promise<void> {
  const content = prompt.value.trim();

  if (content === "" || generating.value) {
    return;
  }

  prompt.value = "";
  await chatStore.sendMessage(content);
}

function handleNewConversation(): void {
  chatStore.newConversation();
  historyOpen.value = false;
}

function handleSelectConversation(conversationId: string): void {
  chatStore.selectConversation(conversationId);
  prompt.value = "";
  historyOpen.value = false;
}

function handleDeleteConversation(conversationId: string): void {
  chatStore.deleteConversation(conversationId);
}

async function copyMessage(content: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(content);
    announcement.value = "回复已复制到剪贴板";
  } catch {
    announcement.value = "复制失败，请手动选择文本";
  }
}

async function restoreMenuFocus(): Promise<void> {
  await nextTick();
  menuButton.value?.focus();
}

onBeforeUnmount(() => chatStore.stopGeneration());
</script>

<template>
  <main :class="$style.page">
    <aside :class="$style.desktopSidebar" aria-label="会话导航">
      <ConversationSidebar
        :groups="conversationGroups"
        :selected-id="selectedId"
        :active-conversation-id="activeConversationId"
        @new="handleNewConversation"
        @select="handleSelectConversation"
        @delete="handleDeleteConversation"
      />
    </aside>

    <el-drawer
      v-model="historyOpen"
      direction="ltr"
      size="min(88vw, 340px)"
      :with-header="false"
      :class="$style.mobileDrawer"
      @closed="restoreMenuFocus"
    >
      <ConversationSidebar
        :groups="conversationGroups"
        :selected-id="selectedId"
        :active-conversation-id="activeConversationId"
        closable
        @new="handleNewConversation"
        @select="handleSelectConversation"
        @delete="handleDeleteConversation"
        @close="historyOpen = false"
      />
    </el-drawer>

    <section :class="$style.workspace" aria-labelledby="assistant-title">
      <header :class="$style.header">
        <button
          ref="menuButton"
          :class="$style.menuButton"
          type="button"
          aria-label="打开历史会话"
          :aria-expanded="historyOpen"
          @click="historyOpen = true"
        >
          <Menu aria-hidden="true" />
        </button>

        <div :class="$style.titleBlock">
          <span :class="$style.titleIcon" aria-hidden="true"><ChatLineRound /></span>
          <div>
            <h1 id="assistant-title">{{ currentTitle }}</h1>
            <span>{{ generating ? "正在生成回复" : "本地模拟 · 未连接真实模型" }}</span>
          </div>
        </div>

        <span :class="$style.prototypeBadge">POC</span>
      </header>

      <MessageList
        :messages="selectedConversation?.messages ?? []"
        @copy="copyMessage"
        @regenerate="chatStore.regenerateMessage"
        @retry="chatStore.retryMessage"
      />

      <ChatComposer
        v-model:value="prompt"
        :models="modelOptions"
        :model-id="modelId"
        :deep-thinking="deepThinking"
        :generating="generating"
        @model-change="modelId = $event"
        @toggle-thinking="deepThinking = !deepThinking"
        @send="handleSend"
        @stop="chatStore.stopGeneration"
      />
    </section>

    <span :class="$style.liveStatus" role="status" aria-live="polite" aria-atomic="true">
      {{ announcement }}
    </span>
  </main>
</template>

<style module>
.page {
  display: grid;
  height: 100vh;
  height: 100dvh;
  grid-template-columns: 292px minmax(0, 1fr);
  overflow: hidden;
  background: var(--color-surface-subtle);
}

.desktopSidebar {
  display: flex;
  min-height: 0;
  border-right: 1px solid #d8e1dc;
  background: var(--color-sidebar);
}

.workspace {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: 72px minmax(0, 1fr) auto;
  background:
    linear-gradient(180deg, rgb(242 247 244 / 72%) 0, transparent 180px), var(--color-surface);
}

.header {
  position: relative;
  z-index: 3;
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  gap: 16px;
  border-bottom: 1px solid #e6ece9;
  background: rgb(255 255 255 / 88%);
  backdrop-filter: blur(14px);
}

.titleBlock {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
}

.titleBlock > div {
  min-width: 0;
}

.titleIcon {
  display: none;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 11px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.titleIcon svg {
  width: 19px;
  height: 19px;
}

.header h1 {
  max-width: min(52vw, 620px);
  margin: 0 0 3px;
  overflow: hidden;
  color: var(--color-text);
  font-size: 15px;
  font-weight: 690;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.titleBlock div > span {
  display: block;
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.prototypeBadge {
  flex: 0 0 auto;
  padding: 5px 8px;
  border: 1px solid #b9d5c9;
  border-radius: 7px;
  background: var(--color-primary-soft);
  color: var(--color-primary-hover);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.menuButton {
  display: none;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: var(--color-text-secondary);
}

.menuButton:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.menuButton svg {
  width: 20px;
  height: 20px;
}

.liveStatus {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
  white-space: nowrap;
}

.mobileDrawer :global(.el-drawer__body) {
  display: flex;
  padding: 0;
  background: var(--color-sidebar);
}

@media (max-width: 767px) {
  .page {
    grid-template-columns: minmax(0, 1fr);
  }

  .desktopSidebar {
    display: none;
  }

  .workspace {
    grid-template-rows: 64px minmax(0, 1fr) auto;
  }

  .header {
    padding: 0 14px;
    gap: 10px;
  }

  .menuButton {
    display: grid;
  }

  .titleIcon {
    display: grid;
  }

  .header h1 {
    max-width: 42vw;
  }
}

@media (max-width: 479px) {
  .titleIcon {
    display: none;
  }

  .prototypeBadge {
    display: none;
  }

  .header h1 {
    max-width: 58vw;
  }
}
</style>
