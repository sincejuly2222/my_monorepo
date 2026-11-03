<script setup lang="ts">
import { Promotion, Sunny, VideoPause } from "@element-plus/icons-vue";
import type { ModelOption } from "../../types";

defineOptions({ name: "ChatComposer" });

defineProps<{
  value: string;
  models: ModelOption[];
  modelId: string;
  deepThinking: boolean;
  generating: boolean;
}>();

const emit = defineEmits<{
  "update:value": [value: string];
  "model-change": [modelId: string];
  "toggle-thinking": [];
  send: [];
  stop: [];
}>();

function handleInput(event: Event): void {
  emit("update:value", (event.target as HTMLTextAreaElement).value);
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
    return;
  }

  event.preventDefault();
  emit("send");
}

function handleModelChange(value: unknown): void {
  if (typeof value === "string") {
    emit("model-change", value);
  }
}
</script>

<template>
  <section :class="$style.composer" aria-label="消息输入器">
    <label :class="$style.visuallyHidden" for="assistant-prompt">消息内容</label>
    <textarea
      id="assistant-prompt"
      :class="$style.input"
      :value="value"
      :disabled="generating"
      rows="2"
      maxlength="8000"
      placeholder="输入你的问题或任务要求"
      aria-describedby="assistant-input-note"
      @input="handleInput"
      @keydown="handleKeydown"
    />

    <div :class="$style.composerFooter">
      <div :class="$style.tools">
        <el-select
          :model-value="modelId"
          :class="$style.modelSelect"
          :disabled="generating"
          aria-label="选择模拟模型"
          @change="handleModelChange"
        >
          <el-option
            v-for="model in models"
            :key="model.id"
            :label="model.label"
            :value="model.id"
          />
        </el-select>

        <button
          :class="$style.thinkingButton"
          type="button"
          :disabled="generating"
          :aria-pressed="deepThinking"
          aria-label="深度思考"
          @click="$emit('toggle-thinking')"
        >
          <Sunny aria-hidden="true" />
          <span>深度思考</span>
        </button>
      </div>

      <button
        :class="$style.sendButton"
        type="button"
        :data-generating="generating"
        :disabled="!generating && value.trim() === ''"
        :aria-label="generating ? '停止生成' : '发送消息'"
        @click="generating ? $emit('stop') : $emit('send')"
      >
        <VideoPause v-if="generating" aria-hidden="true" />
        <Promotion v-else aria-hidden="true" />
      </button>
    </div>

    <p id="assistant-input-note" :class="$style.note">
      Enter 发送 · Shift + Enter 换行 · 数据仅保存在当前页面
    </p>
  </section>
</template>

<style module>
.composer {
  position: relative;
  width: min(calc(100% - 64px), 820px);
  margin: 0 auto 24px;
  padding: 14px 14px 11px;
  border: 1px solid #cfdad5;
  border-radius: 18px;
  background: rgb(255 255 255 / 97%);
  box-shadow: var(--shadow-floating);
  transition:
    border-color var(--motion-fast) ease,
    box-shadow var(--motion-fast) ease;
}

.composer:focus-within {
  border-color: #7faf9c;
  box-shadow:
    0 0 0 3px rgb(13 121 84 / 9%),
    var(--shadow-floating);
}

.input {
  display: block;
  width: 100%;
  min-height: 58px;
  max-height: 150px;
  padding: 4px 5px 8px;
  resize: vertical;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.65;
}

.input::placeholder {
  color: #7b8b83;
}

.input:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.composerFooter {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.tools {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.modelSelect {
  width: 124px;
}

.modelSelect :global(.el-select__wrapper) {
  min-height: 40px;
  border-radius: 10px;
  background: var(--color-surface-subtle);
  box-shadow: none;
}

.thinkingButton {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  padding: 0 12px;
  gap: 7px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--color-surface-subtle);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 620;
  transition:
    background var(--motion-fast) ease,
    color var(--motion-fast) ease,
    border-color var(--motion-fast) ease;
}

.thinkingButton:hover:not(:disabled) {
  color: var(--color-primary-hover);
}

.thinkingButton[aria-pressed="true"] {
  border-color: #add0c2;
  background: var(--color-primary-soft);
  color: var(--color-primary-hover);
}

.thinkingButton svg {
  width: 16px;
  height: 16px;
}

.sendButton {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 14px;
  background: var(--color-primary);
  color: #fff;
  transition:
    background var(--motion-fast) ease,
    opacity var(--motion-fast) ease;
}

.sendButton:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.sendButton:disabled {
  background: #b7c7c0;
  color: #f8faf9;
}

.sendButton[data-generating="true"] {
  background: #344b41;
}

.sendButton svg {
  width: 19px;
  height: 19px;
}

.note {
  margin: 8px 5px 0;
  color: var(--color-text-tertiary);
  font-size: 11px;
  line-height: 1.45;
}

.visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .composer {
    width: calc(100% - 24px);
    margin-bottom: max(12px, env(safe-area-inset-bottom));
    border-radius: 16px;
  }

  .note {
    display: none;
  }
}

@media (max-width: 479px) {
  .thinkingButton span {
    display: none;
  }

  .thinkingButton {
    width: 40px;
    justify-content: center;
    padding: 0;
  }

  .modelSelect {
    width: 116px;
  }
}
</style>
