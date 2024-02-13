"use client";

import ChatInputImage from "@/components/chat/chat-input-image";
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
import { PromptGPTBody, PromptGPTImageBody } from "./chat-api-helpers";
import { transformMySQLToAIModel } from "./chat-helpers";
import { ChatMessageModel } from "./chat-service";

interface Prop {
  chats: Array<ChatMessageModel>;
}

export const ChatUIImage: FC<Prop> = (props) => {
  const { id }: any = useParams();
  const { data: session } = useSession();
  
  const [chatBody, setBody] = useState<PromptGPTImageBody>({
    id: id,
    size: "1024x1024",
    quality: "hd",
    style: "vivid"
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
    api: '/api/chat-image',
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
  
  const onValueChange = (value: string) => {
    //setBody((e) => ({ ...e, model: value }));
  };

  
  const onSizeChange = (value: string) => {
    setBody((e) => ({ ...e, size: value }));
  };
  
  const onStyleChange = (value: string) => {
    setBody((e) => ({ ...e, style: value }));
  };
  
  const onQualityChange = (value: string) => {
    setBody((e) => ({ ...e, quality: value }));
  };
  
  const onHandleSubmit = (e: FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
  };

  return (
    <Card className="h-full relative">
      <div className="h-full rounded-md overflow-y-auto" ref={scrollRef}>
        <div className="flex justify-center p-4">
        </div>
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
      <ChatInputImage
        isLoading={isLoading}
        value={input}
        handleInputChange={handleInputChange}
        handleSubmit={onHandleSubmit}
        handleSizeChange={onSizeChange}
        handleQualityChange={onQualityChange}
        handleStyleChange={onStyleChange}
      />
    </Card>
  );
};
