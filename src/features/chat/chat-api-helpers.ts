import { Message } from "ai";
import { FindAllChats } from "./chat-service";
import {
  EnsureChatThreadIsForCurrentUser,
  updateChatThreadTitle,
} from "./chat-thread-service";

export interface PromptGPTBody {
  id: string; // thread id
  model: string; // model name
  collectionName: string;
}

export interface PromptGPTImageBody {
  id: string; // thread id
  size: string; // model name
  style: string;
  quality: string;
}

export interface PromptGPTProps extends PromptGPTBody {
  messages: Message[];
}

export interface PromptGPTImageProps extends PromptGPTImageBody {
  messages: Message[];
}

export const initAndGuardChatSession = async (props: PromptGPTProps) => {
  const { messages, id, model } = props;

  //last message
  const lastHumanMessage = messages[messages.length - 1];

  const chatThread = await EnsureChatThreadIsForCurrentUser(id);
  const chats = await FindAllChats(id);

  await updateChatThreadTitle(
    chatThread,
    chats,
    model,
    lastHumanMessage.content
  );

  return {
    id,
    lastHumanMessage,
    chats,
  };
};
