import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App/index.vue";
import router from "./router";
import "./index.css";
import "highlight.js/styles/github.css";

createApp(App).use(createPinia()).use(router).mount("#app");
