export type MessageRoleValue = "USER" | "ASSISTANT" | "SYSTEM";

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: MessageRoleValue;
  content: string;
  createdAt: Date;
};

export type ChatSession = {
  id: string;
  userId: string;
  title: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  messages?: ChatMessage[];
};

export type ChatSessionGroup = {
  label: string;
  sessions: ChatSession[];
};
