import { userHashedId } from "@/features/auth/helpers";
import { initAndGuardChatSession } from "@/features/chat/chat-api-helpers";
import { PGPTBufferWindowMemory } from "@/features/langchain/stores/PGPTBufferWindowMemory";
import { MySQLChatMessageHistory } from "@/features/langchain/stores/mysql";
import { StreamingTextResponse } from "ai";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const token = await getToken({ req: req });

  const { lastHumanMessage, id } = await initAndGuardChatSession({id: body.id, messages: body.messages, model: '', collectionName: ''});

  let priv = false;

  if(token != null && (token['isAdmin'] == true || token['imageGen'] == true)) {
    priv = true;
  }

  if(priv == false) {
    throw new Error('Forbidden');
  }

  // The prompt to generate images from
  const prompt = lastHumanMessage.content;

  // The number of images to generate
  const n = 1;
  
  
  const memory = new PGPTBufferWindowMemory({
    k: 12,
     returnMessages: true,
     memoryKey: "chat_history",
     inputKey: "question",
     outputKey: "text",
     chatHistory: new MySQLChatMessageHistory({
       sessionId: id,
       userId: await userHashedId(),
     }),
   });

   memory.chatHistory.addUserMessage(prompt);

  let res = await fetch(process.env.DALLE_AZURE_OPENAI_ENDPOINT ? process.env.DALLE_AZURE_OPENAI_ENDPOINT.toString() : '', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.DALLE_AZURE_OPENAI_API_KEY ? process.env.DALLE_AZURE_OPENAI_API_KEY.toString() : ''
    },
    body: JSON.stringify({
      "prompt": prompt,
      "size": body.size, 
      "n": 1,
      "quality": body.quality,
      "style": body.style
    }),
  });

  const data = await res.json();

  let rprompt = data.data[0].revised_prompt;
  let url = data.data[0].url;
    
  // const { Readable } = require('stream');
  // const { finished } = require('stream/promises');

  // const resD = await fetch(url);
  // function streamToString (stream) {
  //   const chunks: any[] = [];
  //   return new Promise((resolve, reject) => {
  //     stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  //     stream.on('error', (err) => reject(err));
  //     stream.on('end', () => {
        
  //       var result = Buffer.concat(chunks);
  //       console.log('final result:', result.length);
  //       resolve(result.toString('base64'));

  //     });
  //   });
  // }
  
  // const result = await streamToString(Readable.fromWeb(resD.body));
  // console.log(result);

  let aiRes = rprompt + " \r\n \r\n " + url;

   memory.chatHistory.addAIChatMessage(aiRes);

  var Readable = require('stream').Readable;

  var s = new Readable();
  s.push(aiRes);    // the string you want
  s.push(null);
  return new StreamingTextResponse(s);
  //return NextResponse.send(rprompt + " <img href='" + url + "' ></img>");
}
