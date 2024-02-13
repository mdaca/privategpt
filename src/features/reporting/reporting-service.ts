import { ChatMessageModel } from "../chat/chat-service";
import { ChatThreadModel } from "../chat/chat-thread-service";
import { userHashedId } from "@/features/auth/helpers";
import { db } from "../common/mysql";


export const FindAllChatThreadsForReporting = async (
  pageSize = 10,
  pageNumber = 0
) => {

  const type = 'CHAT_THREAD';
  const hashedUserId = await userHashedId();

  try {
    let result = await db.query(`SELECT * FROM threads WHERE type = ? AND userId = ? ORDER BY createdAt DESC LIMIT ${
      pageNumber * pageSize
    }, ${pageSize}`, [type, hashedUserId])
    const data: ChatThreadModel[] = result[0] as ChatThreadModel[];
    return data
  } catch (err) {
    console.log("Error");
    console.log(err);
    return []
  }
};

export const FindChatThreadByID = async (chatThreadID: string) => {

  const type = 'CHAT_THREAD';

  try {
    let result = await db.query('SELECT * FROM threads WHERE type = ? AND id = ?', [type, chatThreadID])
    const data: ChatThreadModel[] = result[0] as ChatThreadModel[];
    return data
  } catch (err) {
    console.log("Error");
    console.log(err);
    return []
  }

};

export const FindAllChatsInThread = async (chatThreadID: string) => {

  const type = "CHAT_MESSAGE";
  const threadID = chatThreadID;
  const isDeleted = false;

  try {
    let result = await db.query('SELECT * FROM chats WHERE type = ? AND threadId = ?', [type, threadID])
    const data: ChatMessageModel[] = result[0] as ChatMessageModel[];
    return data
  } catch (err) {
    console.log("Error");
    console.log(err);
    return []
  }
};
