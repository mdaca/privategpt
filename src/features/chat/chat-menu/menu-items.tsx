"use client";
import { MenuItem } from "@/components/menu";
import { Button } from "@/components/ui/button";
import {
  ChatThreadModel,
  SoftDeleteChatThreadByID,
} from "@/features/chat/chat-thread-service";
import { ChevronDown, ChevronRight, Expand, MessageCircle, Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { FC, useReducer, useState } from "react";

interface Prop {
  categoryMenuItems: any;
}

export const MenuItems: FC<Prop> = (props) => {
  const { id } = useParams();
  const router = useRouter();

  let mi: any = this;
  
function headerClick(event: any): void {
  event.preventDefault();
  let dataCat = event.target.getAttribute('data-category');
  
  if(props.categoryMenuItems[dataCat].length > 0) {
    let expanded = props.categoryMenuItems[dataCat][0].expanded;
    props.categoryMenuItems[dataCat][0].expanded = !expanded;
  }

  forceUpdate();
}

  const sendData = async (threadID: string) => {
    await SoftDeleteChatThreadByID(threadID);
    router.refresh();
    router.replace("/chat");
  };

  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const cats = props.categoryMenuItems;

  return (
    <>
      {renderCats()}
    </>
  );

  function renderCats() {
    
  let subTaskComponents: React.JSX.Element[] = [];

  for(var prop in cats) {

    subTaskComponents.push(<MenuItem
      href={"#"}
      isSelected={false}
      key={prop} 
      className="justify-between group/item" onClick={headerClick}
    >
      {cats[prop].length > 0 && cats[prop][0].expanded && <ChevronDown size={16} style={{fontWeight:'bold', cursor: 'pointer'}}   data-category={prop}  onClick={headerClick}  /> }
      {cats[prop].length > 0 && !cats[prop][0].expanded && <ChevronRight size={16} style={{fontWeight:'bold', cursor: 'pointer'}}   data-category={prop}  onClick={headerClick}   /> }
      <span className="flex gap-2 items-center overflow-hidden flex-1"   style={{cursor: 'pointer'}}
      data-category={prop}  onClick={headerClick} >
        <span style={{fontWeight:'bold', cursor: 'pointer'}}  data-category={prop}  className="overflow-ellipsis truncate" >{prop}</span>
      </span>
    </MenuItem>);

    subTaskComponents =  [...subTaskComponents, ...cats[prop].map((thread) => (
      cats[prop].length > 0 && cats[prop][0].expanded && <MenuItem 
        href={"/chat/" + thread.id}
        isSelected={id === thread.id}
        key={thread.id} 
        className="justify-between group/item ml-2"
      >
        <MessageCircle size={16} />
        <span className="flex gap-2 items-center overflow-hidden flex-1">
          <span className="overflow-ellipsis truncate">{thread.name}</span>
        </span>
        <Button
          className="invisible  group-hover/item:visible"
          size={"sm"}
          variant={"ghost"}
          onClick={async (e) => {
            e.preventDefault();
            const yesDelete = confirm(
              "Are you sure you want to delete this chat?"
            );
            if (yesDelete) {
              await sendData(thread.id);
            }
          }}
        >
          <Trash size={16} />
        </Button>
      </MenuItem>
    ))];

  }
  return subTaskComponents;
  }

};

