"use server";
import "server-only";

import { nanoid } from "nanoid";
import { db } from "../common/mysql";

export const FindAllChats = async (chatThreadID: string) => {  
  
  const type = "CHAT_MESSAGE";
  const threadID = chatThreadID;
  const isDeleted = false;

  try {
    let result = await db.query('SELECT * FROM chats WHERE type = ? AND threadId = ? AND isDeleted = ?', [type, threadID, isDeleted])
    const data: ChatMessageModel[] = result[0] as ChatMessageModel[];
    return data
  } catch (err) {
    console.log("Error");
    console.log(err);
    return []
  }
};

export const UpsertChat = async (chatModel: ChatMessageModel) => {
  const modelToSave: ChatMessageModel = {
    ...chatModel,
    id: nanoid(),
    createdAt: new Date(),
    type: MESSAGE_ATTRIBUTE,
    isDeleted: false,
  };

  try {
    let result = await db.query('INSERT INTO chats (id, createdAt, type, isDeleted, content, role, threadId, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [modelToSave. id, modelToSave.createdAt.toISOString(), modelToSave.type, modelToSave.isDeleted? 1:0, modelToSave.content, modelToSave.role,modelToSave.threadId, modelToSave.userId]
    )
    const data: ChatMessageModel[] = result[0] as ChatMessageModel[];
    return data
  } catch (err) {
    console.log("Error");
    console.log(err);
    return []
  }
};

export const inertPromptAndResponse = async (
  threadID: string,
  userQuestion: string,
  assistantResponse: string
) => {
  await UpsertChat({
    ...newChatModel(),
    content: userQuestion,
    threadId: threadID,
    role: "user",
  });
  await UpsertChat({
    ...newChatModel(),
    content: assistantResponse,
    threadId: threadID,
    role: "assistant",
  });
};

export const newChatModel = (): ChatMessageModel => {
  return {
    content: "",
    threadId: "",
    role: "user",
    userId: "",
    id: nanoid(),
    createdAt: new Date(),
    type: MESSAGE_ATTRIBUTE,
    isDeleted: false,
  };
};

export interface ChatMessageModel {
  id: string;
  createdAt: Date;
  isDeleted: boolean;
  threadId: string;
  userId: string;
  content: string;
  role: chatRole;
  type: "CHAT_MESSAGE";
}

export type chatRole = "system" | "user" | "assistant" | "function";

const MESSAGE_ATTRIBUTE = "CHAT_MESSAGE";
