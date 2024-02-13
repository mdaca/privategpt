import { Message } from "ai";
import { AIMessage, HumanMessage } from "langchain/schema";
import { ChatMessageModel } from "./chat-service";

export const mostRecentMemory = (
  chats: ChatMessageModel[],
  memorySize: number
) => {
  return transformMySQLToLangchain(chats).slice(memorySize * -1);
};

export const transformMySQLToLangchain = (chats: ChatMessageModel[]) => {
  return chats.map((m) => {
    if (m.role === "assistant") {
      return new AIMessage(m.content);
    }
    return new HumanMessage(m.content);
  });
};

export const transformMySQLToAIModel = (
  chats: Array<ChatMessageModel>
): Array<Message> => {
  return chats.map((chat) => {
    return {
      role: chat.role,
      content: chat.content,
      id: chat.id,
      createdAt: chat.createdAt,
    };
  });
};
