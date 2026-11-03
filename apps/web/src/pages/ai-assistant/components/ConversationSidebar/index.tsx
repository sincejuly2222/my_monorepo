import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Popconfirm } from "antd";
import { Link } from "react-router-dom";
import type { Conversation, ConversationGroup } from "../../types";
import styles from "./index.module.css";

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedId: string;
  onNew: () => void;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
  onNavigate?: () => void;
}

const groups: Array<{ id: ConversationGroup; label: string }> = [
  { id: "today", label: "今天" },
  { id: "yesterday", label: "昨天" },
];

export function ConversationSidebar({
  conversations,
  selectedId,
  onNew,
  onSelect,
  onDelete,
  onNavigate,
}: ConversationSidebarProps) {
  return (
    <div className={styles.sidebarContent}>
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">
          A
        </span>
        <span>后台管理系统</span>
      </div>

      <button className={styles.newChat} type="button" onClick={onNew}>
        <PlusOutlined aria-hidden="true" />
        新对话
      </button>

      <nav className={styles.history} aria-label="历史会话">
        {groups.map((group) => {
          const items = conversations.filter((conversation) => conversation.group === group.id);

          if (items.length === 0) {
            return null;
          }

          return (
            <section className={styles.historyGroup} key={group.id}>
              <h2>{group.label}</h2>
              <ul>
                {items.map((conversation) => {
                  const selected = conversation.id === selectedId;

                  return (
                    <li data-selected={selected} key={conversation.id}>
                      <button
                        className={styles.historySelect}
                        type="button"
                        aria-current={selected ? "page" : undefined}
                        onClick={() => onSelect(conversation.id)}
                      >
                        {conversation.title}
                      </button>
                      <Popconfirm
                        title="删除这个会话？"
                        description="本地原型中的消息也会一并移除。"
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => onDelete(conversation.id)}
                      >
                        <button
                          className={styles.historyMore}
                          type="button"
                          aria-label={`删除会话：${conversation.title}`}
                        >
                          {selected ? <EllipsisOutlined /> : <DeleteOutlined />}
                        </button>
                      </Popconfirm>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <Link to="/dashboard" onClick={onNavigate}>
          <ArrowLeftOutlined aria-hidden="true" />
          返回管理后台
        </Link>
        <span>本地交互原型，刷新页面后重置</span>
      </div>
    </div>
  );
}
