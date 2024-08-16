"use client";

import ChatInput from "@/components/chat/chat-input";
import ChatLoading from "@/components/chat/chat-loading";
import ChatRow from "@/components/chat/chat-row";
import { useChatScrollAnchor } from "@/components/hooks/use-chat-scroll-anchor";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useChat } from "ai/react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { FC, FormEvent, useRef, useState, useEffect } from "react";
import { PromptGPTBody } from "./chat-api-helpers";
import { transformMySQLToAIModel } from "./chat-helpers";
import { ChatMessageModel } from "./chat-service";

interface Prop {
  chats: Array<ChatMessageModel>;
  model: string;
  colls: any[];
  collectionName: string;
}

export const ChatUI: FC<Prop> = (props) => {
  const { id }: any = useParams();
  const { data: session } = useSession();
  const [chatBody, setBody] = useState<PromptGPTBody>({
    id: id,
    model: "GPT-3.5",
    collectionName: props.collectionName
  });
  
  const { toast } = useToast();
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    reload,
    isLoading,
  } = useChat({
    onError,
    id,
    body: chatBody,
    initialMessages: transformMySQLToAIModel(props.chats),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useChatScrollAnchor(messages, scrollRef);

  function onError(error: Error) {
    toast({
      variant: "destructive",
      description: error.message,
      action: (
        <ToastAction
          altText="Try again"
          onClick={() => {
            reload();
          }}
        >
          Try again
        </ToastAction>
      ),
    });
  }
  
  const handleCollectionChange = (value: string) => {
    setBody((e) => ({ ...e, collectionName: value }));
  };
  

  const onValueChange = (value: string) => {
    setBody((e) => ({ ...e, model: value }));
  };
  
  const onHandleSubmit = (e: FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
  };

  return (
    <Card className="h-full relative">
      <div className="h-full rounded-md overflow-y-auto" ref={scrollRef}>
        <div className=" pb-[80px] ">
          {messages.map((message, index) => (
            <ChatRow
              date={message.createdAt && message.createdAt.toISOString ? message.createdAt.toISOString() : message.createdAt}
              name={
                message.role === "user" ? session?.user?.name! : "MDACA PrivateGPT"
              }
              profilePicture={
                message.role === "user" ? session?.user?.image! : "/logo.png"
              }
              message={message.content.replace('data: [DONE]', '')}
              type={message.role}
              key={index}
            />
          ))}
          {isLoading && <ChatLoading />}
        </div>
      </div>
      <ChatInput
        colls={props.colls}
        isLoading={isLoading}
        value={input}
        collectionName={props.collectionName}
        handleInputChange={handleInputChange}
        handleSubmit={onHandleSubmit}
        handleCollectionChange={handleCollectionChange}
      />
    </Card>
  );
};
