import { BulbOutlined, SendOutlined, StopOutlined } from "@ant-design/icons";
import { Button, ConfigProvider, Input, Select } from "antd";
import type { KeyboardEvent } from "react";
import styles from "./index.module.css";
import utilityStyles from "../../../../styles/utilities.module.css";
import type { ModelOption } from "../../types";
import { composerTheme } from "../../theme";

interface ChatComposerProps {
  value: string;
  models: ModelOption[];
  modelId: string;
  deepThinking: boolean;
  generating: boolean;
  onChange: (value: string) => void;
  onModelChange: (modelId: string) => void;
  onToggleThinking: () => void;
  onSend: () => void;
  onStop: () => void;
}

export function ChatComposer({
  value,
  models,
  modelId,
  deepThinking,
  generating,
  onChange,
  onModelChange,
  onToggleThinking,
  onSend,
  onStop,
}: ChatComposerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && !generating) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <ConfigProvider theme={composerTheme}>
      <section className={styles.composer} aria-label="消息输入器">
        <label className={utilityStyles.visuallyHidden} htmlFor="assistant-prompt">
          消息内容
        </label>
        <Input.TextArea
          className={styles.input}
          variant="borderless"
          id="assistant-prompt"
          value={value}
          autoSize={{ minRows: 2, maxRows: 5 }}
          placeholder="输入你的问题或任务要求"
          aria-describedby="assistant-prototype-note"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.composerMeta}>
          <span id="assistant-prototype-note">Enter 发送 · Shift + Enter 换行 · 刷新后清空</span>
        </div>
        <div className={styles.composerFooter}>
          <div className={styles.composerTools}>
            <Select
              className={styles.modelSelect}
              value={modelId}
              disabled={generating}
              aria-label="选择模拟模型"
              options={models.map((model) => ({ value: model.id, label: model.label }))}
              onChange={onModelChange}
            />
            <Button
              className={styles.thinkingButton}
              icon={<BulbOutlined />}
              disabled={generating}
              aria-pressed={deepThinking}
              onClick={onToggleThinking}
            >
              深度思考
            </Button>
          </div>
          <Button
            className={styles.sendButton}
            type="primary"
            shape="circle"
            icon={generating ? <StopOutlined /> : <SendOutlined />}
            disabled={!generating && value.trim() === ""}
            aria-label={generating ? "停止生成" : "发送消息"}
            onClick={generating ? onStop : onSend}
          />
        </div>
      </section>
    </ConfigProvider>
  );
}
