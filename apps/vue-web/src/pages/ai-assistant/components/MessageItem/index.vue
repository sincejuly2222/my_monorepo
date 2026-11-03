<script setup lang="ts">
/* eslint-disable vue/no-v-html -- 所有内容都由禁用原始 HTML 的 MarkdownIt 解析并经 DOMPurify 清理。 */
import { computed } from "vue";
import { CopyDocument, Cpu, Refresh, WarningFilled } from "@element-plus/icons-vue";
import type { ChatMessage } from "../../types";
import { renderMarkdown } from "../../utils/markdown";

defineOptions({ name: "MessageItem" });

const props = defineProps<{
  message: ChatMessage;
}>();

defineEmits<{
  copy: [content: string];
  regenerate: [messageId: string];
  retry: [messageId: string];
}>();

const renderedContent = computed(() => renderMarkdown(props.message.content));
</script>

<template>
  <article
    :class="[$style.message, message.role === 'user' && $style.messageUser]"
    :aria-label="message.role === 'assistant' ? 'AI 助手消息' : '用户消息'"
  >
    <div v-if="message.role === 'assistant'" :class="$style.avatar" aria-hidden="true">
      <Cpu />
    </div>

    <div :class="$style.messageBody">
      <span :class="$style.author">
        {{ message.role === "assistant" ? "AI 助手" : "你" }}
      </span>

      <div v-if="message.status === 'error'" :class="$style.error" role="alert">
        <WarningFilled aria-hidden="true" />
        <div>
          <strong>回复生成失败</strong>
          <p>这是本地模拟的错误状态，请重新尝试。</p>
        </div>
      </div>

      <template v-else-if="message.role === 'assistant'">
        <div v-if="message.content === ''" :class="$style.thinking" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <!-- 内容已经过 DOMPurify 清理，原始 HTML 在解析阶段也被禁用。 -->
        <div
          v-else
          :class="$style.markdown"
          :data-streaming="message.status === 'streaming'"
          v-html="renderedContent"
        />
      </template>

      <p v-else :class="$style.userContent">{{ message.content }}</p>

      <div
        v-if="message.role === 'assistant' && message.status !== 'streaming'"
        :class="$style.actions"
      >
        <button v-if="message.status === 'error'" type="button" @click="$emit('retry', message.id)">
          <Refresh aria-hidden="true" />
          重试
        </button>
        <template v-else>
          <button type="button" @click="$emit('copy', message.content)">
            <CopyDocument aria-hidden="true" />
            复制
          </button>
          <button type="button" @click="$emit('regenerate', message.id)">
            <Refresh aria-hidden="true" />
            重新生成
          </button>
        </template>
      </div>
    </div>
  </article>
</template>

<style module>
.message {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: flex-start;
  gap: 14px;
  animation: messageIn var(--motion-standard) ease-out both;
}

.message + .message {
  margin-top: 40px;
}

.messageUser {
  grid-template-columns: minmax(0, 1fr);
}

.avatar {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 11px;
  background: var(--color-primary);
  color: #fff;
}

.avatar svg {
  width: 19px;
  height: 19px;
}

.messageBody {
  min-width: 0;
}

.messageUser .messageBody {
  width: 78%;
  max-width: 640px;
  justify-self: end;
}

.author {
  display: block;
  margin: 0 0 9px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 650;
}

.messageUser .author {
  text-align: right;
}

.userContent {
  margin: 0;
  padding: 13px 16px;
  border-radius: 16px 16px 4px;
  background: #e3efea;
  color: var(--color-text);
  line-height: 1.7;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.markdown {
  max-width: 75ch;
  color: #263830;
  font-size: 15px;
  line-height: 1.78;
  overflow-wrap: anywhere;
}

.markdown[data-streaming="true"]::after {
  display: inline-block;
  width: 7px;
  height: 17px;
  margin-left: 3px;
  border-radius: 2px;
  background: var(--color-primary);
  content: "";
  vertical-align: -3px;
  animation: cursorPulse 900ms ease-in-out infinite;
}

.markdown :global(p) {
  margin: 0 0 13px;
}

.markdown :global(p:last-child) {
  margin-bottom: 0;
}

.markdown :global(h1),
.markdown :global(h2),
.markdown :global(h3) {
  margin: 24px 0 10px;
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.45;
}

.markdown :global(ul),
.markdown :global(ol) {
  margin: 10px 0 16px;
  padding-left: 22px;
}

.markdown :global(li + li) {
  margin-top: 5px;
}

.markdown :global(a) {
  color: var(--color-primary-hover);
  font-weight: 600;
  text-underline-offset: 3px;
}

.markdown :global(blockquote) {
  margin: 16px 0;
  padding: 3px 0 3px 15px;
  border-left: 3px solid #8abda9;
  color: var(--color-text-secondary);
}

.markdown :global(pre) {
  max-width: 100%;
  margin: 16px 0;
  padding: 16px;
  border: 1px solid #d5dfda;
  border-radius: 12px;
  background: #f4f7f5;
  font-size: 13px;
  line-height: 1.65;
  overflow-x: auto;
}

.markdown :global(code) {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}

.markdown :global(:not(pre) > code) {
  padding: 2px 6px;
  border-radius: 5px;
  background: #e9efec;
  font-size: 0.9em;
}

.actions {
  display: flex;
  min-height: 44px;
  align-items: center;
  margin-top: 6px;
  gap: 4px;
}

.actions button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  padding: 0 10px;
  gap: 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  transition:
    background var(--motion-fast) ease,
    color var(--motion-fast) ease;
}

.actions button:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary-hover);
}

.actions svg {
  width: 15px;
  height: 15px;
}

.error {
  display: flex;
  max-width: 560px;
  align-items: flex-start;
  padding: 14px 16px;
  gap: 11px;
  border: 1px solid #efc6c2;
  border-radius: 12px;
  background: #fff4f2;
  color: #7a271a;
}

.error > svg {
  width: 19px;
  height: 19px;
  flex: 0 0 auto;
  margin-top: 2px;
}

.error strong {
  font-size: 14px;
}

.error p {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.55;
}

.thinking {
  display: flex;
  height: 28px;
  align-items: center;
  gap: 5px;
}

.thinking span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #75a894;
  animation: thinkingPulse 1.1s ease-in-out infinite;
}

.thinking span:nth-child(2) {
  animation-delay: 130ms;
}

.thinking span:nth-child(3) {
  animation-delay: 260ms;
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cursorPulse {
  50% {
    opacity: 0.25;
  }
}

@keyframes thinkingPulse {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@media (max-width: 767px) {
  .message {
    grid-template-columns: 32px minmax(0, 1fr);
    gap: 10px;
  }

  .messageUser {
    grid-template-columns: minmax(0, 1fr);
  }

  .message + .message {
    margin-top: 32px;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 10px;
  }

  .messageUser .messageBody {
    width: 88%;
    max-width: 620px;
  }

  .markdown {
    font-size: 15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .message {
    animation: none;
  }

  .thinking span,
  .markdown[data-streaming="true"]::after {
    animation: none;
  }
}
</style>
