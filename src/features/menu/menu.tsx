import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { BarChartHorizontalBig, BookMarked, TextCursorInput } from "lucide-react";
import Link from "next/link";
import { UserProfile } from "../user-profile";

export const MainMenu = () => {
  return (
    <div className="flex gap-3 flex-col justify-between menu">
      <div>
        <Link  style={{marginTop: '4px'}}
          href="/"
          className="w-10 h-10 p-2 items-center justify-center flex border rounded-full menu-item bg-background"
          title="Chat UI"
        >
          <TextCursorInput />
        </Link>
        <Link  style={{marginTop: '4px'}}
          href="/reporting"
          className="w-10 h-10 p-2 items-center justify-center flex border rounded-full menu-item bg-background"
          title="Reporting"
        >
          <BarChartHorizontalBig />
        </Link>
        <Link style={{marginTop: '4px'}}
          href="/vectorstore"
          className="w-10 h-10 p-2 items-center justify-center flex border rounded-full menu-item bg-background"
          title="Knowledge Stores"
        >
          <BookMarked />
        </Link>
      </div>
      <UserProfile />
    </div>
  );
};
