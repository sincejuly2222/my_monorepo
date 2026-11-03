import { defineComponent } from "vue";
import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ConversationSidebar from "./index.vue";

const PopconfirmStub = defineComponent({
  name: "ElPopconfirm",
  emits: ["confirm"],
  template: "<div><slot name='reference' /></div>",
});

describe("会话侧栏", () => {
  it("只有确认删除后才发出删除事件", () => {
    const wrapper = mount(ConversationSidebar, {
      props: {
        groups: [
          {
            id: "today",
            label: "今天",
            conversations: [
              {
                id: "conversation-1",
                title: "测试会话",
                updatedAt: new Date().toISOString(),
                messages: [],
              },
            ],
          },
        ],
        selectedId: "conversation-1",
        activeConversationId: null,
      },
      global: {
        stubs: { ElPopconfirm: PopconfirmStub },
      },
    });

    expect(wrapper.emitted("delete")).toBeUndefined();
    wrapper.getComponent(PopconfirmStub).vm.$emit("confirm");
    expect(wrapper.emitted("delete")?.[0]).toEqual(["conversation-1"]);
  });
});
