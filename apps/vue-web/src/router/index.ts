import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/ai-assistant",
    },
    {
      path: "/ai-assistant",
      name: "ai-assistant",
      component: () => import("../pages/ai-assistant/index.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/ai-assistant",
    },
  ],
});

export default router;
