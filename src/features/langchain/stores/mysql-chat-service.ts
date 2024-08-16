import {
  ChatMessageModel,
  FindAllChats,
  UpsertChat,
} from "@/features/chat/chat-service";
import { StoredMessage } from "@langchain/core/messages";

export const getChatMessages = async (
  sessionId: string
): Promise<StoredMessage[]> => {
  const items = await FindAllChats(sessionId);
  const ms: StoredMessage[] = [];
  items.forEach((item) => {
    ms.push({
      type: "CHAT_MESSAGE",
      data: {
        content: item.content,
        role: item.role === "user" ? "human" : "ai",
        name: item.userId,
        tool_call_id: undefined
      },
    });
  });

  return ms;
};

export const addChatMessage = async (modelToSave: ChatMessageModel) => {
  return await UpsertChat(modelToSave);
};
