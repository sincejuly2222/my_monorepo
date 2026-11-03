<script setup lang="ts">
import { computed, ref } from "vue";

defineOptions({ name: "CounterPanel" });

interface CounterPanelProps {
  initialValue?: number;
}

const props = withDefaults(defineProps<CounterPanelProps>(), { initialValue: 0 });
const count = ref(props.initialValue);
const doubled = computed(() => count.value * 2);

function increment(): void {
  count.value += 1;
}

function reset(): void {
  count.value = props.initialValue;
}
</script>

<template>
  <section :class="$style.panel" aria-labelledby="counter-title">
    <p :class="$style.label">响应式交互示例</p>
    <h2 id="counter-title">试试组件状态</h2>
    <output :class="$style.value" aria-label="当前计数" aria-live="polite">{{ count }}</output>
    <p :class="$style.detail">计算属性：当前值 × 2 = {{ doubled }}</p>
    <div :class="$style.actions">
      <button :class="$style.primary" type="button" @click="increment">增加一次</button>
      <button
        :class="$style.secondary"
        type="button"
        :disabled="count === props.initialValue"
        @click="reset"
      >
        重置
      </button>
    </div>
  </section>
</template>

<style module>
.panel {
  align-self: center;
  padding: 28px 0 28px 32px;
  border-left: 1px solid #d8e2dc;
}

.label {
  margin: 0 0 8px;
  color: #53675e;
  font-size: 13px;
}

.panel h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.value {
  display: block;
  margin: 24px 0 8px;
  color: #0d7954;
  font-size: 64px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.detail {
  margin: 0;
  color: #53675e;
  font-size: 14px;
  line-height: 1.6;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  margin-top: 28px;
  gap: 12px;
}

.primary,
.secondary {
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.primary {
  background: #0d7954;
  color: #fff;
}

.primary:hover {
  background: #086343;
}

.secondary {
  border-color: #c6d4cc;
  background: transparent;
  color: #354d41;
}

.secondary:hover:not(:disabled) {
  background: #eaf0ec;
}

.secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 767px) {
  .panel {
    padding: 32px 0 0;
    border-top: 1px solid #d8e2dc;
    border-left: 0;
  }
}
</style>
