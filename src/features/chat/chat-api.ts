import { LangChainStream, StreamingTextResponse } from "ai";
import { ConversationChain, ConversationalRetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BufferMemory, BufferWindowMemory } from "langchain/memory";
import { PGPTBufferWindowMemory } from '../langchain/stores/PGPTBufferWindowMemory'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { userHashedId } from "../auth/helpers";
import { MySQLChatMessageHistory } from "../langchain/stores/mysql";
import { PromptGPTProps, initAndGuardChatSession } from "./chat-api-helpers";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Chroma } from "langchain/vectorstores/chroma";
import { CallbackManager } from "langchain/callbacks";
import { inertPromptAndResponse } from "./chat-service";
import { GetMyStores } from "../vectorstore/vectorstore-service";
import { Mystery_Quest } from "next/font/google";

export const PromptGPT = async (props: PromptGPTProps) => {
  const { lastHumanMessage, id } = await initAndGuardChatSession(props);

  const { stream, handlers } = LangChainStream({
    onCompletion: async (completion: string) => {
      console.log(completion);
      //await inertPromptAndResponse(id, lastHumanMessage.content, completion);
    },
  });

  const userId = await userHashedId();

  const collectionName = props.collectionName;


  if(collectionName && collectionName.length > 0) {

    const myStores = await GetMyStores();

    if(myStores.map(item => {return item.collectionName;}).indexOf(collectionName) == -1) {
      throw new Error('Access to collection denied');
    }

    const memory = new PGPTBufferWindowMemory({
      k: 12,
       returnMessages: true,
       memoryKey: "chat_history",
       inputKey: "question",
       outputKey: "text",
       chatHistory: new MySQLChatMessageHistory({
         sessionId: id,
         userId: userId,
       }),
     });

     

  const CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT_START = `Given the following conversation and a follow up question, return the conversation history excerpt that includes any relevant context to the question if it exists and rephrase the follow up question to be a standalone question.
  Chat History:
  {chat_history}
  Follow Up Input: {question}
  Your answer should follow the following format:
  \`\`\`
  `;
  
  
  let custom = 'Use the following pieces of context to answer the users question.  ';

  const storePrompt = myStores.find((item) => { return item.collectionName == collectionName; })?.collectionPrompt;

  if(storePrompt != null && storePrompt.length > 0) {
    custom = storePrompt;
  }
  
  const CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT_END = 
  `If you don't know the answer, just say that you don't know, don't try to make up an answer.
  ----------------
  <Relevant chat history excerpt as context here>
  Standalone question: <Rephrased question here>
  \`\`\`
  Your answer:`;

  const CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT = 
  `${CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT_START}${custom}${CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT_END}`;

    const vectorStore = await Chroma.fromExistingCollection(
      new OpenAIEmbeddings({azureOpenAIApiDeploymentName: 'text-embedding-ada-002' }  ),
      { collectionName: collectionName,
        url: process.env.CHROMA_URL  }
    );
  
    const streamingModel = new ChatOpenAI({
      streaming: true,
      temperature: 0,
    });
    const nonStreamingModel = new ChatOpenAI({
      temperature: .5,});
    const chain = ConversationalRetrievalQAChain.fromLLM(
      nonStreamingModel,
      vectorStore.asRetriever(8),
      {
        returnSourceDocuments: true,
        memory: memory,
        questionGeneratorChainOptions: {
          template: CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT,
          llm: nonStreamingModel
        },
        verbose: true
      }
    );
    
    const callbacks = CallbackManager.fromHandlers(handlers);
    
    const res: any = await chain.call({question: lastHumanMessage.content}, callbacks).then((result) => {
        console.log('result.sourceDocuments', result.sourceDocuments); // This will log the source documents
        return result;
      })
      .catch(e => { console.log(e);});

      let ret = res.text;

      ret += ' \r\n \r\n `Sources`';

      ret += JSON.stringify(res.sourceDocuments.map((item) => { return item.metadata; }));

      // for(let i = 0; i < res.sourceDocuments.length; i++) {
      //   let doc = res.sourceDocuments[i];
      //   ret += ' \r\n \r\n' + JSON.stringify(doc.metadata);
      // }

      ret += 'data: [DONE]';
      const Readable = require('stream').Readable;
      let s = Readable.from(ret);
      return new StreamingTextResponse(s);
  } else {

    const chat = new ChatOpenAI({
      temperature: 0,
      streaming: true,
    });
    
  const memory = new BufferWindowMemory({
    k: 12,
     returnMessages: true,
     memoryKey: "history",
     chatHistory: new MySQLChatMessageHistory({
       sessionId: id,
       userId: userId,
     }),
   });
  
    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `-You are MDACA PrivateGPT who is a helpful AI Assistant.
        - You will provide clear and concise queries, and you will respond with polite and professional answers.
        - You will answer questions truthfully and accurately.`
      ),
      new MessagesPlaceholder("history"),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
    ]);
    const chain = new ConversationChain({
      llm: chat,
      memory,
      prompt: chatPrompt,
    });
    chain.call({input: lastHumanMessage.content }, [handlers]).catch(e => { console.log(e);});
    return new StreamingTextResponse(stream);
  }

};