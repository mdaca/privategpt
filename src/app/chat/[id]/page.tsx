import { FindAllChats } from "@/features/chat/chat-service";
import { FindChatThreadByID } from "@/features/chat/chat-thread-service";
import { ChatUI } from "@/features/chat/chat-ui";
import { ChatUIImage } from "@/features/chat/chat-ui-image";
import { GetMyStores } from "@/features/vectorstore/vectorstore-service";
import { notFound } from "next/navigation";

export default async function Home({ params }: { params: { id: string } }) {
  const items = await FindAllChats(params.id);
  const thread = await FindChatThreadByID(params.id);

  if (thread.length === 0) {
    notFound();
  }

  if(thread[0].category == 'Image Generation') {
    return <ChatUIImage chats={items} />;
  } else {
    const colls = await GetMyStores();
    return <ChatUI chats={items} model={thread[0].model} colls={colls} collectionName={thread[0].collectionName} />;
  }
}
