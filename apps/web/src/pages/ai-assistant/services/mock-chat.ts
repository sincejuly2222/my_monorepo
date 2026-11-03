import type { ModelOption } from "../types";

const defaultReply =
  "我已经收到你的任务。建议先明确目标和可用信息，再按影响范围确定优先级，最后把结论整理为可以直接执行的步骤。";

/** 根据输入生成本地演示回复，不发起任何网络请求。 */
export function createMockReply(prompt: string, model: ModelOption, deepThinking: boolean): string {
  if (prompt.trim() === "/error") {
    throw new Error("模拟回复生成失败");
  }

  let reply = defaultReply;

  if (prompt.includes("用户") || prompt.includes("运营")) {
    reply =
      "建议先核对本周新增、活跃和流失用户的变化，再按影响范围推进以下三项工作：完善新用户引导、召回沉默用户、集中治理高频问题。每项工作都应设置负责人和可量化的完成标准。";
  } else if (prompt.includes("权限") || prompt.includes("角色")) {
    reply =
      "可以先列出角色、资源和操作三类信息，再检查是否存在重复授权、越权或无人负责的权限。建议从高风险写操作开始梳理，并为每项调整保留审批和回滚记录。";
  } else if (prompt.includes("导入") || prompt.includes("Excel")) {
    reply =
      "建议把导入流程拆成模板下载、文件校验、结果预览和正式写入四个阶段。错误信息应定位到具体行与字段，任何一行失败时都不要写入部分数据。";
  }

  const thinkingNote = deepThinking
    ? "\n\n深度思考已开启：我会同时关注执行成本、潜在风险和结果验证方式。"
    : "";

  return `${reply}${thinkingNote}\n\n当前使用：${model.label}。`;
}
