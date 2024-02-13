"use server";
import "server-only";

import { userHashedId, userSession } from "@/features/auth/helpers";
import { ChatMessageModel, FindAllChats } from "@/features/chat/chat-service";
import { nanoid } from "nanoid";
import { db } from "../common/mysql";
import moment from 'moment';

export const CalculateCategories = async (cats: any, items: any) => {
  
    const sessionUser: any = await userSession();
    let initCats: any = {Default: []};
    
    if(sessionUser.isAdmin || sessionUser.imageGen) {
      initCats = {  'Image Generation': [], Default: [] };
    }

    items.forEach((item) => {

      let cat = item.category;
      if (cat == null || cat.length == 0) {
        cat = 'Default';
      }
      if(cats && cats[cat]) {
        item.expanded = cats[cat][0].expanded;
      }

      if(typeof item.expanded == 'undefined') {
        item.expanded = true;
      }

      if (initCats[cat]) {
        initCats[cat].push(item);
      } else {
        initCats[cat] = [item];
      }

    });
    return initCats;
};

export const FindAllChatThreadForCurrentUser = async () => {

  const type = 'CHAT_THREAD';
  const hashedUserId = await userHashedId();
  const isDeleted = false;

  try {
    let result = await db.query('SELECT * FROM threads WHERE type = ? AND userId = ? AND isDeleted = ?', [type, hashedUserId, isDeleted])
    const data: ChatThreadModel[] = result[0] as ChatThreadModel[];
    return data
  } catch (err) {
    console.log("Error");
    console.log(err);
    return []
  }
};

export const FindChatThreadByID = async (id: string) => {

  const type = 'CHAT_THREAD';
  const hashedUserId = await userHashedId();
  const isDeleted = false;

  try {
    let result = await db.query('SELECT * FROM threads WHERE type = ? AND userId = ? AND id = ? AND isDeleted = ?', [type, hashedUserId, id, isDeleted])
    const data: ChatThreadModel[] = result[0] as ChatThreadModel[];
    return data
  } catch (err) {
    console.log("Error");
    console.log(err);
    return []
  }
};

export const SoftDeleteChatThreadByID = async (chatThreadID: string) => {
  //const container = await memoryContainer();

  const threads = await FindChatThreadByID(chatThreadID);

  if (threads.length !== 0) {
    const chats = await FindAllChats(chatThreadID);

    chats.forEach(async (chat) => {
      const itemToUpdate = {
        ...chat,
      };
      itemToUpdate.isDeleted = true;
      //await container.items.upsert(itemToUpdate);
    });

    threads.forEach(async (thread) => {
      const itemToUpdate = {
        ...thread,
      };
      itemToUpdate.isDeleted = true;
      await db.query('UPDATE threads SET isDeleted = ? WHERE type = ? AND userId = ? AND id = ?', [itemToUpdate.isDeleted? 1:0, itemToUpdate.type, itemToUpdate.userId,itemToUpdate.id])
    });
  }
};

export const EnsureChatThreadIsForCurrentUser = async ( chatThreadID: string ) => {
  const modelToSave = await FindChatThreadByID(chatThreadID);
  if (modelToSave.length === 0) {
    throw new Error("Chat thread not found");
  }

  return modelToSave[0];
};

export const UpsertChatThread = async (chatThread: ChatThreadModel) => {
  return await db.query('UPDATE threads SET name = ?, collectionName = ? WHERE type = ? AND userId = ? AND id = ?', [chatThread.name, chatThread.collectionName, chatThread.type, chatThread.userId,chatThread.id])
};

export const updateChatThreadTitle = async (
  chatThread: ChatThreadModel,
  messages: ChatMessageModel[],
  modelName: string,
  userMessage: string
) => {
  if (messages.length === 0) {
    await UpsertChatThread({
      ...chatThread,
      model: modelName,
      name: userMessage.substring(0, 30),
    });
  }
};

export const CreateChatThread = async (category: string, collectionName: string) => {
  const modelToSave: ChatThreadModel = {
    name: "new chat",
    useName: (await userSession())!.name,
    userId: await userHashedId(),
    model: "GPT-3.5",
    isDeleted: false,
    id: nanoid(),
    createdAt: (moment(new Date())).format('YYYY-MM-DD HH:mm:ss'),
    type: "CHAT_THREAD",
    collectionName: collectionName,
    category: category,
    expanded: false
  };

  //const container = await memoryContainer();
  const result = await db.query(
    'INSERT INTO threads (name, useName, UserId, model, id, createdAt, isDeleted, type, collectionName, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [modelToSave. name, modelToSave.useName, modelToSave.userId, modelToSave.model, modelToSave.id, modelToSave.createdAt,modelToSave.isDeleted? 1:0, modelToSave.type, modelToSave.collectionName, modelToSave.category]
  );
  return modelToSave;
};

export interface ChatThreadModel {
  expanded: boolean;
  id: string;
  name: string;
  model: string;
  createdAt: string;
  userId: string;
  useName: string;
  isDeleted: boolean;
  collectionName: string;
  type: "CHAT_THREAD";
  category: string;
}
