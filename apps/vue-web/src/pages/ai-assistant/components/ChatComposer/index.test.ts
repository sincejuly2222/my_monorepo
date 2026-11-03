import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ChatComposer from "./index.vue";

const defaultProps = {
  value: "测试消息",
  models: [{ id: "general", label: "通用模型" }],
  modelId: "general",
  deepThinking: false,
  generating: false,
};

function mountComposer(overrides: Partial<typeof defaultProps> = {}) {
  return mount(ChatComposer, {
    props: { ...defaultProps, ...overrides },
    global: {
      stubs: {
        ElOption: true,
        ElSelect: true,
      },
    },
  });
}

describe("消息输入器", () => {
  it("按 Enter 发送，Shift + Enter 保留换行", async () => {
    const wrapper = mountComposer();
    const textarea = wrapper.get("textarea");

    await textarea.trigger("keydown", { key: "Enter", shiftKey: true });
    expect(wrapper.emitted("send")).toBeUndefined();

    await textarea.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("send")).toHaveLength(1);
  });

  it("中文输入法组合态不会误发送", async () => {
    const wrapper = mountComposer();
    const textarea = wrapper.get("textarea");

    await textarea.trigger("keydown", { key: "Enter", isComposing: true });
    expect(wrapper.emitted("send")).toBeUndefined();
  });

  it("空文本时禁用发送按钮", () => {
    const wrapper = mountComposer({ value: "   " });
    const button = wrapper.get('button[aria-label="发送消息"]');

    expect(button.attributes("disabled")).toBeDefined();
  });

  it("生成期间点击主按钮触发停止", async () => {
    const wrapper = mountComposer({ generating: true });
    const button = wrapper.get('button[aria-label="停止生成"]');

    await button.trigger("click");
    expect(wrapper.emitted("stop")).toHaveLength(1);
  });
});
