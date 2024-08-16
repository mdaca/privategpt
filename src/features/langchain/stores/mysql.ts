import { ChatMessageModel } from "@/features/chat/chat-service";
import {
  AIMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { nanoid } from "nanoid";
import {
  addChatMessage,
  getChatMessages,
} from "./mysql-chat-service";
import { mapStoredMessagesToChatMessages } from "./utils";
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";


export interface MySQLChatMessageHistoryFields {
  sessionId: string;
  userId: string;
}

export class MySQLChatMessageHistory extends BaseListChatMessageHistory {
  lc_namespace = ["langchain", "stores", "message", "mysql"];


  private sessionId: string;
  private userId: string;

  constructor({ sessionId, userId }: MySQLChatMessageHistoryFields) {
    super();
    this.sessionId = sessionId;
    this.userId = userId;
  }

  async clear(): Promise<void> {
    
  }

  async getMessages(): Promise<BaseMessage[]> {
    const resources = await getChatMessages(this.sessionId);
    return mapStoredMessagesToChatMessages(resources);
  }

  public async addMessage(message: BaseMessage) {
    const modelToSave: ChatMessageModel = {
      id: nanoid(),
      createdAt: new Date(),
      type: "CHAT_MESSAGE",
      isDeleted: false,
      content: message.content.toString(),
      role: message instanceof AIMessage ? "assistant" : "user",
      threadId: this.sessionId,
      userId: this.userId,
    };

    await addChatMessage(modelToSave);
  }
}
