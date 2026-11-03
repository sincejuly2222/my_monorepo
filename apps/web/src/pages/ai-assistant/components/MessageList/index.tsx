import { CopyOutlined, ReloadOutlined, RobotOutlined, WarningOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";
import styles from "./index.module.css";
import utilityStyles from "../../../../styles/utilities.module.css";

interface MessageListProps {
  messages: ChatMessage[];
  onCopy: (content: string) => void;
  onRegenerate: (messageId: string) => void;
  onRetry: (messageId: string) => void;
}

export function MessageList({ messages, onCopy, onRegenerate, onRetry }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const generating = messages.some((message) => message.status === "streaming");

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div className={styles.messageScroll} aria-label="对话消息">
      {generating ? (
        <span className={utilityStyles.visuallyHidden} role="status">
          AI 助手正在生成回复
        </span>
      ) : null}
      <div className={styles.messageList}>
        {messages.map((message) => (
          <article
            className={`${styles.message} ${message.role === "user" ? styles.messageUser : ""}`}
            key={message.id}
            aria-label={message.role === "assistant" ? "AI 助手消息" : "用户消息"}
          >
            {message.role === "assistant" ? (
              <div className={styles.messageAvatar} aria-hidden="true">
                <RobotOutlined />
              </div>
            ) : null}
            <div className={styles.messageBody}>
              <span className={styles.messageAuthor}>
                {message.role === "assistant" ? "AI 助手" : "你"}
              </span>

              {message.status === "error" ? (
                <div className={styles.messageError} role="alert">
                  <WarningOutlined className={styles.errorIcon} aria-hidden="true" />
                  <div>
                    <strong>回复生成失败</strong>
                    <p>这是本地模拟的错误状态，请重新尝试。</p>
                  </div>
                </div>
              ) : (
                <p data-streaming={message.status === "streaming"}>
                  {message.content || "正在思考…"}
                </p>
              )}

              {message.role === "assistant" && message.status !== "streaming" ? (
                <div className={styles.messageActions}>
                  {message.status === "error" ? (
                    <Button
                      className={styles.actionButton}
                      type="text"
                      icon={<ReloadOutlined />}
                      onClick={() => onRetry(message.id)}
                    >
                      重试
                    </Button>
                  ) : (
                    <>
                      <Button
                        className={styles.actionButton}
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => onCopy(message.content)}
                      >
                        复制
                      </Button>
                      <Button
                        className={styles.actionButton}
                        type="text"
                        icon={<ReloadOutlined />}
                        onClick={() => onRegenerate(message.id)}
                      >
                        重新生成
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </article>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
