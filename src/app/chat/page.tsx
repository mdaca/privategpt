import { Card } from "@/components/ui/card";
import { NewChat } from "@/features/chat/chat-menu/new-chat";
import { CalculateCategories, FindAllChatThreadForCurrentUser } from "@/features/chat/chat-thread-service";
import { GetMyStores } from "@/features/vectorstore/vectorstore-service";
import { redirect } from "next/navigation";

export default async function Home() {
  const chats = await FindAllChatThreadForCurrentUser();
  if (chats.length > 0) {
    redirect(`/chat/${chats[0].id}`);
  }
  
  const colls = await GetMyStores();

  const cats = await CalculateCategories(null, chats);

  return (
    <Card className="h-full items-center flex justify-center">
      <NewChat cats={cats} colls={colls}></NewChat>
    </Card>
  );
}
