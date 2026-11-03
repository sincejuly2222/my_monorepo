<script setup lang="ts">
import { ChatDotRound, Close, Delete, MoreFilled, Plus } from "@element-plus/icons-vue";
import type { ConversationGroup } from "../../types";

defineOptions({ name: "ConversationSidebar" });

defineProps<{
  groups: ConversationGroup[];
  selectedId: string;
  activeConversationId: string | null;
  closable?: boolean;
}>();

defineEmits<{
  new: [];
  select: [conversationId: string];
  delete: [conversationId: string];
  close: [];
}>();
</script>

<template>
  <div :class="$style.sidebarContent">
    <div :class="$style.brand">
      <span :class="$style.brandMark" aria-hidden="true">
        <ChatDotRound />
      </span>
      <span>
        <strong>AI 工作台</strong>
        <small>Vue 技术验证</small>
      </span>
      <button
        v-if="closable"
        :class="$style.closeButton"
        type="button"
        aria-label="关闭历史会话"
        @click="$emit('close')"
      >
        <Close aria-hidden="true" />
      </button>
    </div>

    <button :class="$style.newChat" type="button" @click="$emit('new')">
      <Plus aria-hidden="true" />
      新对话
    </button>

    <nav :class="$style.history" aria-label="历史会话">
      <section v-for="group in groups" :key="group.id" :class="$style.historyGroup">
        <h2>{{ group.label }}</h2>
        <ul>
          <li
            v-for="conversation in group.conversations"
            :key="conversation.id"
            :class="$style.historyItem"
            :data-selected="conversation.id === selectedId"
          >
            <button
              :class="$style.historySelect"
              type="button"
              :aria-current="conversation.id === selectedId ? 'page' : undefined"
              @click="$emit('select', conversation.id)"
            >
              <span>{{ conversation.title }}</span>
              <small v-if="conversation.id === activeConversationId">生成中</small>
            </button>

            <el-popconfirm
              title="删除这个会话？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              confirm-button-type="danger"
              width="210"
              @confirm="$emit('delete', conversation.id)"
            >
              <template #reference>
                <button
                  :class="$style.historyAction"
                  type="button"
                  :aria-label="`删除会话：${conversation.title}`"
                >
                  <MoreFilled v-if="conversation.id === selectedId" aria-hidden="true" />
                  <Delete v-else aria-hidden="true" />
                </button>
              </template>
            </el-popconfirm>
          </li>
        </ul>
      </section>
    </nav>

    <div :class="$style.sidebarFooter">
      <span :class="$style.statusDot" aria-hidden="true" />
      <div>
        <strong>本地交互原型</strong>
        <span>刷新页面后会重置全部数据</span>
      </div>
    </div>
  </div>
</template>

<style module>
.sidebarContent {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 28px 20px 20px;
  color: var(--color-text);
}

.brand {
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 12px;
}

.brand > span:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.closeButton {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  margin-left: auto;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: var(--color-text-secondary);
  transition:
    background var(--motion-fast) ease,
    color var(--motion-fast) ease;
}

.closeButton:hover {
  background: rgb(255 255 255 / 76%);
  color: var(--color-primary);
}

.closeButton svg {
  width: 19px;
  height: 19px;
}

.brand strong {
  font-size: 16px;
  font-weight: 720;
  letter-spacing: -0.01em;
}

.brand small {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.brandMark {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  background: var(--color-primary);
  color: #fff;
}

.brandMark svg {
  width: 21px;
  height: 21px;
}

.newChat {
  display: flex;
  width: 100%;
  min-height: 46px;
  align-items: center;
  margin: 28px 0 26px;
  padding: 0 15px;
  gap: 10px;
  border: 1px solid #c8d9d1;
  border-radius: 12px;
  background: rgb(255 255 255 / 70%);
  color: var(--color-text);
  font-weight: 650;
  text-align: left;
  transition:
    border-color var(--motion-fast) ease,
    background var(--motion-fast) ease;
}

.newChat:hover {
  border-color: #8bb8a6;
  background: #fff;
}

.newChat svg {
  width: 18px;
  height: 18px;
}

.history {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #bdcbc4 transparent;
}

.historyGroup + .historyGroup {
  margin-top: 24px;
}

.historyGroup h2 {
  margin: 0 0 8px;
  padding: 0 9px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 650;
}

.historyGroup ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.historyItem {
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  border-radius: 10px;
  transition: background var(--motion-fast) ease;
}

.historyItem:hover,
.historyItem[data-selected="true"] {
  background: rgb(255 255 255 / 76%);
}

.historySelect {
  display: flex;
  min-width: 0;
  min-height: 46px;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  padding: 8px 42px 8px 10px;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  text-align: left;
}

.historyItem[data-selected="true"] .historySelect {
  color: var(--color-text);
  font-weight: 650;
}

.historySelect span,
.historySelect small {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.historySelect small {
  margin-top: 2px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 600;
}

.historyAction {
  position: absolute;
  right: 3px;
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--color-text-tertiary);
  opacity: 0;
  transition:
    opacity var(--motion-fast) ease,
    background var(--motion-fast) ease,
    color var(--motion-fast) ease;
}

.historyItem:hover .historyAction,
.historyItem:focus-within .historyAction,
.historyItem[data-selected="true"] .historyAction {
  opacity: 1;
}

.historyAction:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.historyAction svg {
  width: 17px;
  height: 17px;
}

.sidebarFooter {
  display: flex;
  align-items: flex-start;
  margin-top: 18px;
  padding: 17px 8px 2px;
  gap: 10px;
  border-top: 1px solid #d6e0db;
}

.sidebarFooter div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sidebarFooter strong {
  font-size: 12px;
  font-weight: 650;
}

.sidebarFooter span:not(.statusDot) {
  color: var(--color-text-secondary);
  font-size: 11px;
  line-height: 1.45;
}

.statusDot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 0 4px rgb(13 121 84 / 10%);
}
</style>
