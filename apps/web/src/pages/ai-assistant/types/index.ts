export type MessageRole = "assistant" | "user";
export type MessageStatus = "complete" | "streaming" | "error";
export type ConversationGroup = "today" | "yesterday";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
}

export interface Conversation {
  id: string;
  title: string;
  group: ConversationGroup;
  messages: ChatMessage[];
}

export interface ModelOption {
  id: string;
  label: string;
}
