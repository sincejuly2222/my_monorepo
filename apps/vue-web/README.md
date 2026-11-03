# Vue AI 工作台

基于 Vue 3、TypeScript、Vite、Pinia 和 Element Plus 的 AI 对话交互原型。当前版本只在浏览器内模拟流式回复，不访问真实模型，也不会持久化会话数据。

## 本地开发

在仓库根目录执行：

```bash
pnpm install
pnpm dev:vue-web
```

开发地址为 `http://localhost:5174/ai-assistant`。根路径和未知路径都会跳转至 AI 对话页。

## 已实现能力

- 新建、切换和删除本地会话
- 模拟流式回复、停止生成、失败重试和重新生成
- 模型选项和深度思考开关
- Markdown、代码高亮和危险 HTML 清理
- 桌面会话侧栏与移动端抽屉
- 键盘发送、中文输入法保护、焦点恢复和状态播报
- 用户向上阅读时暂停自动跟随，并提供“回到底部”操作

输入 `/error` 可以稳定触发模拟错误，用于检查失败和重试状态。刷新页面后所有会话会恢复为初始示例。

## 常用命令

```bash
pnpm --filter vue-web test         # 运行单元与组件测试
pnpm --filter vue-web typecheck    # 检查 Vue 组件和 Vite 配置类型
pnpm --filter vue-web lint         # 运行 ESLint
pnpm --filter vue-web format:check # 检查格式
pnpm build:vue-web                 # 类型检查并构建生产产物
pnpm --filter vue-web preview      # 在 http://localhost:4174 预览构建结果
```

## 目录与约定

```text
src/
├─ App/index.vue                         # 根路由出口
├─ router/index.ts                       # 单页应用路由
├─ pages/ai-assistant/
│  ├─ components/                       # 会话栏、消息、输入器
│  ├─ services/mock-chat.ts              # 本地流式回复模拟
│  ├─ stores/chat.ts                     # Pinia 对话状态机
│  ├─ types/index.ts                     # 对话领域类型
│  ├─ utils/markdown.ts                  # Markdown 安全渲染
│  └─ index.vue                          # AI 工作台页面
├─ test/setup.ts                         # 浏览器环境测试准备
├─ main.ts                               # 应用入口
└─ index.css                             # 全局主题变量与基础样式
```

- 组件继续使用 `<script setup lang="ts">`、Composition API 和 `<style module>`。
- Element Plus 组件按需导入，Vue API 保持显式导入。
- 页面只使用业务模型 ID。未来接入真实模型时，密钥、供应商模型名称、限流和审计必须由独立服务管理，禁止在浏览器环境变量或源码中保存模型密钥。
- 使用 HTML5 History 路由；部署静态产物时，服务器需要把未知前端路径回退到 `index.html`。
