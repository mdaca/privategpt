import { Menu, MenuContent, MenuFooter, MenuHeader } from "@/components/menu";
import { CalculateCategories, FindAllChatThreadForCurrentUser } from "@/features/chat/chat-thread-service";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { MenuItems } from "./menu-items";
import { NewChat } from "./new-chat";
import { GetMyStores } from "@/features/vectorstore/vectorstore-service";
import { useState } from "react";

export const ChatMenu = async () => {
  const items = await FindAllChatThreadForCurrentUser();
  const colls = await GetMyStores();
  
  const cats = await CalculateCategories(null, items);
  
  return (
    <Menu>
      <MenuHeader className="justify-start p-1">
        <NewChat cats={cats} colls={colls} />
      </MenuHeader>
      <MenuContent>
        <MenuItems categoryMenuItems={cats} />
      </MenuContent>
      <MenuFooter>
        <div className="flex flex-col gap-3">
          <ThemeToggle />
        </div>
      </MenuFooter>
    </Menu>
  );
};
