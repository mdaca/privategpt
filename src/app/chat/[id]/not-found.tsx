import Typography from "@/components/typography";
import { Card } from "@/components/ui/card";
import { NewChat } from "@/features/chat/chat-menu/new-chat";
import { CalculateCategories, FindAllChatThreadForCurrentUser } from "@/features/chat/chat-thread-service";
import { GetMyStores } from "@/features/vectorstore/vectorstore-service";

export default async function NotFound() {

  const items = await FindAllChatThreadForCurrentUser();
  const colls = await GetMyStores();
  
  const cats = await CalculateCategories(null, items);

  return (
    <Card className="h-full items-center flex flex-col gap-4 justify-center">
      <div className="text-center">
        <Typography className="" variant="h3">
          Uh-oh! 404
        </Typography>
        <div className="text-muted-foreground text-sm">
          How about we start a new chat?
        </div>
      </div>
      <NewChat  cats={cats} colls={colls} ></NewChat>
    </Card>
  );
}
