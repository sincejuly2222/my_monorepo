import type { ModelOption } from "../types";

interface StreamMockReplyOptions {
  prompt: string;
  model: ModelOption;
  deepThinking: boolean;
  signal: AbortSignal;
  onChunk: (content: string) => void;
  delayMs?: number;
}

const defaultReply = `我已经收到你的任务。建议先明确目标和可用信息，再按影响范围确定优先级，最后把结论整理为可以直接执行的步骤。

### 建议的下一步

1. 确认任务边界与负责人
2. 收集可验证的数据
3. 用小范围试运行验证结果`;

function createMockReply(prompt: string, model: ModelOption, deepThinking: boolean): string {
  let reply = defaultReply;

  if (prompt.includes("用户") || prompt.includes("运营")) {
    reply = `建议先核对本周新增、活跃和流失用户的变化，再推进以下工作：

- 完善新用户引导
- 召回沉默用户
- 集中治理高频问题

每项工作都应设置负责人、完成时间和可量化标准。`;
  } else if (prompt.includes("权限") || prompt.includes("角色")) {
    reply = `可以先列出 **角色、资源、操作** 三类信息，再检查重复授权、越权或无人负责的权限。

建议从高风险写操作开始梳理，并为每项调整保留审批和回滚记录。`;
  } else if (prompt.includes("代码") || prompt.includes("TypeScript")) {
    reply = `可以先把输入和输出收敛成明确类型，再补充运行时校验：

\`\`\`ts
interface TaskResult {
  id: string;
  status: "pending" | "complete";
}
\`\`\`

这样能够同时改善可读性、测试体验和接口稳定性。`;
  }

  const thinkingNote = deepThinking
    ? "\n\n> 深度思考已开启：同时评估执行成本、潜在风险和验证方式。"
    : "";

  return `${reply}${thinkingNote}\n\n当前使用：${model.label}。`;
}

function wait(delayMs: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, delayMs);

    function handleAbort(): void {
      window.clearTimeout(timer);
      reject(new DOMException("生成已停止", "AbortError"));
    }

    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

/** 纯前端流式回复模拟器，不发起网络请求。 */
export async function streamMockReply({
  prompt,
  model,
  deepThinking,
  signal,
  onChunk,
  delayMs = 32,
}: StreamMockReplyOptions): Promise<void> {
  if (prompt.trim() === "/error") {
    await wait(480, signal);
    throw new Error("模拟回复生成失败");
  }

  const characters = Array.from(createMockReply(prompt, model, deepThinking));
  const chunkSize = 2;

  for (let index = chunkSize; index < characters.length + chunkSize; index += chunkSize) {
    await wait(delayMs, signal);
    onChunk(characters.slice(0, Math.min(index, characters.length)).join(""));
  }
}
