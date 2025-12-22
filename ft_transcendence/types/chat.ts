export type Role = "user" | "assistant";

export type Message = {
  role: Role;
  content: string;
};

export type ChatThread = {
  id: string;
  title: string;
  updatedAt: number; // ms epoch
  messages: Message[];
};
