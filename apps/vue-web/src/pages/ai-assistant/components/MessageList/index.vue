<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";
import MessageItem from "../MessageItem/index.vue";
import type { ChatMessage } from "../../types";

defineOptions({ name: "MessageList" });

const props = defineProps<{
  messages: ChatMessage[];
}>();

defineEmits<{
  copy: [content: string];
  regenerate: [messageId: string];
  retry: [messageId: string];
}>();

const scrollContainer = ref<HTMLElement | null>(null);
const followOutput = ref(true);
const messageFingerprint = computed(() =>
  props.messages
    .map((message) => `${message.id}:${message.content.length}:${message.status}`)
    .join("|"),
);

function scrollToBottom(behavior: ScrollBehavior = "smooth"): void {
  const container = scrollContainer.value;

  if (!container) {
    return;
  }

  container.scrollTo({ top: container.scrollHeight, behavior });
  followOutput.value = true;
}

function handleScroll(): void {
  const container = scrollContainer.value;

  if (!container) {
    return;
  }

  const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
  followOutput.value = distanceFromBottom < 80;
}

watch(messageFingerprint, async () => {
  if (!followOutput.value) {
    return;
  }

  await nextTick();
  scrollToBottom("auto");
});

onMounted(() => scrollToBottom("auto"));
</script>

<template>
  <section
    ref="scrollContainer"
    :class="$style.messageScroll"
    aria-label="对话消息"
    @scroll.passive="handleScroll"
  >
    <div v-if="messages.length === 0" :class="$style.emptyState">
      <span :class="$style.emptyMark" aria-hidden="true">AI</span>
      <p :class="$style.eyebrow">开始新任务</p>
      <h2>今天想一起解决什么？</h2>
      <p>描述目标、背景和期望结果，回复将在当前浏览器中模拟生成。</p>
      <ul aria-label="示例问题">
        <li>整理本周用户运营重点</li>
        <li>梳理角色和权限风险</li>
        <li>给出一段 TypeScript 示例</li>
      </ul>
    </div>

    <div v-else :class="$style.messageList">
      <MessageItem
        v-for="message in messages"
        :key="message.id"
        :message="message"
        @copy="$emit('copy', $event)"
        @regenerate="$emit('regenerate', $event)"
        @retry="$emit('retry', $event)"
      />
    </div>

    <button
      v-if="!followOutput && messages.length > 0"
      :class="$style.toBottom"
      type="button"
      @click="scrollToBottom()"
    >
      <ArrowDown aria-hidden="true" />
      回到底部
    </button>
  </section>
</template>

<style module>
.messageScroll {
  position: relative;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-padding: 28px 0 24px;
  scrollbar-width: thin;
  scrollbar-color: #c5d0ca transparent;
}

.messageList {
  width: min(100%, 860px);
  min-height: 100%;
  margin: 0 auto;
  padding: 42px 40px 48px;
}

.emptyState {
  display: flex;
  width: min(100%, 720px);
  min-height: 100%;
  flex-direction: column;
  justify-content: center;
  margin: 0 auto;
  padding: 64px 40px 96px;
}

.emptyMark {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  margin-bottom: 24px;
  border-radius: 15px;
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 760;
  letter-spacing: 0.04em;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
}

.emptyState h2 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(30px, 4vw, 44px);
  font-weight: 660;
  line-height: 1.18;
  letter-spacing: -0.04em;
}

.emptyState > p:not(.eyebrow) {
  max-width: 530px;
  margin: 18px 0 28px;
  color: var(--color-text-secondary);
  font-size: 15px;
  line-height: 1.75;
}

.emptyState ul {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
  gap: 8px;
  list-style: none;
}

.emptyState li {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.toBottom {
  position: sticky;
  z-index: 2;
  bottom: 18px;
  display: flex;
  min-height: 42px;
  align-items: center;
  margin: -58px auto 16px;
  padding: 0 14px;
  gap: 7px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 8px 22px rgb(23 39 32 / 12%);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 650;
  backdrop-filter: blur(10px);
}

.toBottom:hover {
  border-color: #9dbbad;
  color: var(--color-primary-hover);
}

.toBottom svg {
  width: 15px;
  height: 15px;
}

@media (max-width: 767px) {
  .messageList {
    padding: 30px 18px 36px;
  }

  .emptyState {
    padding: 52px 22px 72px;
  }

  .emptyState h2 {
    font-size: clamp(28px, 9vw, 38px);
  }

  .emptyState ul {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
