export type MessageRole = "assistant" | "user";
export type MessageStatus = "complete" | "streaming" | "error";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ModelOption {
  id: string;
  label: string;
}

export interface ConversationGroup {
  id: "today" | "yesterday" | "earlier";
  label: string;
  conversations: Conversation[];
}
