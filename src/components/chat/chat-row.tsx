import { chatRole } from "@/features/chat/chat-service";
import { cn } from "@/lib/utils";
import { FC } from "react";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import Typography from "../typography";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { CodeBlock } from "./code-block";
import { MemoizedReactMarkdown } from "./memoized-react-markdown";
interface ChatRowProps {
  name: string;
  profilePicture: string;
  message: string;
  type: chatRole;
  date: any;
}

const ChatRow: FC<ChatRowProps> = (props) => {

  let subComponents: any = [];

  let displayMessage = props.message;
  let sources: any = [];
  if(props.message.indexOf('`Sources`') >= 0) {
    sources = JSON.parse(props.message.split('`Sources`')[1]);
    displayMessage = props.message.split('`Sources`')[0] + 'Knowledge Store Sources \r\n \r\n';
    for(let i = 0; i < sources.length; i++) {
      displayMessage += ' \r\n';

      if(sources[i] && sources[i].file) {
        displayMessage += sources[i].file + ', Page ' + sources[i].page + ', Uploaded ' + sources[i].uploaded + '\r\n';
      } else if(sources[i] && sources[i].url) {
        displayMessage += sources[i].url + ' , Chunk ' + sources[i].chunk + ', Captured ' + sources[i].captured  + '\r\n';
      } else if(sources[i] && sources[i].title) {
        displayMessage += sources[i].title + ' , Chunk ' + sources[i].chunk + ', Entered ' + sources[i].entered  + '\r\n';
      }
    }

  }

  return (
    <div
      className={cn(
        "border-b ",
        props.type === "assistant" ? "bg-primary/50" : ""
      )}
    >
      <div className="container mx-auto max-w-4xl py-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 items-center chat-row-top">
            <Avatar>
              <AvatarImage src={props.profilePicture} />
              <AvatarFallback >{props.name && props.name.length > 0 ? props.name[0].toUpperCase() : ''}</AvatarFallback>
            </Avatar>
            <Typography variant="h5" className="capitalize">
              {props.name}
            </Typography>
            <span className="chat-row-date">{props.date}</span>
          </div>
        </div>
        <div className="py-6">
          <MemoizedReactMarkdown
            className="prose prose-slate dark:prose-invert break-words prose-p:leading-relaxed prose-pre:p-0 max-w-none"
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>;
              },
              code({ node, inline, className, children, ...props }) {
                if (children.length) {
                  if (children[0] == "▍") {
                    return (
                      <span className="mt-1 animate-pulse cursor-default">
                        ▍
                      </span>
                    );
                  }

                  children[0] = (children[0] as string).replace("`▍`", "▍");
                }

                const match = /language-(\w+)/.exec(className || "");

                if (inline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <CodeBlock
                    key={Math.random()}
                    language={(match && match[1]) || ""}
                    value={String(children).replace(/\n$/, "")}
                    {...props}
                  />
                );
              },
            }}
          >
            {displayMessage}
          </MemoizedReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatRow;
