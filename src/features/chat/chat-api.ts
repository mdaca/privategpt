import { LangChainStream, StreamingTextResponse } from "ai";
import { ConversationChain, ConversationalRetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { BufferMemory, BufferWindowMemory } from "langchain/memory";
import { PGPTBufferWindowMemory } from '../langchain/stores/PGPTBufferWindowMemory'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { userHashedId } from "../auth/helpers";
import { MySQLChatMessageHistory } from "../langchain/stores/mysql";
import { PromptGPTProps, initAndGuardChatSession } from "./chat-api-helpers";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { CallbackManager } from "@langchain/core/callbacks/manager";
import { inertPromptAndResponse } from "./chat-service";
import { GetMyStores, get_neo4jgraph } from "../vectorstore/vectorstore-service";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { BedrockEmbeddings } from "@langchain/community/embeddings/bedrock";
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { GraphCypherQAChain } from "langchain/chains/graph_qa/cypher";

export const PromptGPT = async (props: PromptGPTProps) => {
  const { lastHumanMessage, id } = await initAndGuardChatSession(props);

  const { stream, handlers } = LangChainStream({
    onCompletion: async (completion: string) => {
      console.log(completion);
      await inertPromptAndResponse(id, lastHumanMessage.content, completion);
    },
  });

  const userId = await userHashedId();

  const collectionName = props.collectionName;

  if(collectionName && collectionName.length > 0) {

    let embeddings: any = null;
    let model: any = null;

    if(process.env.BEDROCK_AWS_REGION) {
      model = new BedrockChat({
        model: process.env.BEDROCK_MODEL!, //"anthropic.claude-3-sonnet-20240229-v1:0",
        region: process.env.BEDROCK_AWS_REGION, //"us-east-1",
        // endpointUrl: "custom.amazonaws.com",
        credentials: {
          accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY!,
        },
        modelKwargs: {
        //   anthropic_version: "bedrock-2023-05-31",
          "temperature": 0.5,
          "max_tokens": 4096
        },
      });

      embeddings = new BedrockEmbeddings({
        region: process.env.BEDROCK_AWS_REGION,
        credentials: {
          accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY!,
        },
        model: process.env.BEDROCK_EMBED_MODEL, // Default value
      });

    } else {
      model = new ChatOpenAI({
        temperature: .5, verbose: true});

        embeddings = new OpenAIEmbeddings({azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBED_MODEL }  );
    }

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

     

  const CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT = `Given the following conversation and a follow up question, return the conversation history excerpt that includes any relevant context to the question if it exists and rephrase the follow up question to be a standalone question.
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
  
  const CHAIN_PROMPT_END = 
  `If you don't know the answer, just say that you don't know, don't try to make up an answer.
  ----------------
  {context}
  Chat History: {chat_history}
  Standalone question: {question}
  \`\`\`
  Your answer:`;

  const CHAIN_PROMPT = 
  `${custom}${CHAIN_PROMPT_END}`;

  const storeType = myStores.find((item) => { return item.collectionName == collectionName; })?.storeType;

  let vectorStore: any = null;

  if(storeType == 'Graph') {

    // const url = process.env.NEO4J_URI!;
    // const username = process.env.NEO4J_USERNAME!;
    // const password = process.env.NEO4J_PASSWORD!;
    
    // vectorStore = await Neo4jVectorStore.fromExistingGraph(embeddings, {
    //   textNodeProperties: ['id'],
    //   nodeLabel: '*',
    //   embeddingNodeProperty: "embedding",
    //   url: url,
    //   username: username,
    //   password: password,
    //   database: collectionName  }
    // );

    const memory = new MySQLChatMessageHistory({
      sessionId: id,
      userId: userId,
    });

    const cypherPrompt: string = `Task:Generate Cypher statement to query a graph database.
                      Instructions:
                      Use only the provided relationship types and properties in the schema.
                      Do not use any other relationship types or properties that are not provided.
                      Schema:
                      {schema}
                      Note: Do not include any explanations or apologies in your responses.
                      Do not respond to any questions that might ask anything else than for you to construct a Cypher statement.
                      Do not include any text except the generated Cypher statement.
                      ALWAYS USE SUBSTRING WHEN SEARCHING FOR STRING VALUES IN THE 'id' PROPERTY.
                      Examples: Here are a few examples of generated Cypher statements for particular questions:
                      # Who has a bachelor's degree?
                      MATCH (p:PERSON)-[:HAS]->(d:EDUCATION)
                      WHERE d.id CONTAINS \"Bachelor\"
                      RETURN p.id AS PersonWithBachelorsDegree

                      The question is:
                      {question}`;

    const chain = GraphCypherQAChain.fromLLM({
      cypherLLM: model,
      qaLLM: model,
      graph: await get_neo4jgraph(collectionName),
      cypherPrompt: new PromptTemplate({ template: cypherPrompt, inputVariables: ["schema", "question"]})
      //qaPrompt: new PromptTemplate()
    });
    const callbacks = CallbackManager.fromHandlers(handlers);
    
    let res: any = null;

    try{
      await memory.addUserMessage(lastHumanMessage.content);
      res = await chain.run(lastHumanMessage.content);
    } catch(e: any){
      res = e.message;

      if(res.indexOf('(offset: 0))\n"') > 0) {
        res = res.split('(offset: 0))\n"')[1];
        res = res.substring(0, res.length - 5);
      }
    }
      let ret = '';

      if(res.response) {
        ret = res.response;
      } else if(res.text) {
        ret = res.text;
      } else {
        ret = res;
      }

      ret += 'data: [DONE]';
      
      await memory.addAIMessage(ret);

      const Readable = require('stream').Readable;
      let s = Readable.from(ret);
      return new StreamingTextResponse(s);
  }
  else if(storeType == 'SmallDocs') {

    const retrieval_query = `
  MATCH (node)-[:HAS_PARENT]->(parent)
  WITH parent, max(score) AS score // deduplicate parents
  RETURN parent.text AS text, score, { file: parent.file, uploaded: parent.uploaded } AS metadata
  `;
  
  const url = process.env.NEO4J_URI!;
  const username = process.env.NEO4J_USERNAME!;
  const password = process.env.NEO4J_PASSWORD!;

  vectorStore = await Neo4jVectorStore.fromExistingIndex(embeddings, {
      indexName: "retrieval",
      nodeLabel: "Child",
      embeddingNodeProperty: "embedding",
      retrievalQuery: retrieval_query,
      url: url,
      username: username,
      password: password,
      database: collectionName  }
    );

  } else {

    vectorStore = await Chroma.fromExistingCollection(
      embeddings,
      { collectionName: collectionName,
        url: process.env.CHROMA_URL  }
    );
  }
  
    const chain = ConversationalRetrievalQAChain.fromLLM(
      model,
      vectorStore.asRetriever(8),
      {
        returnSourceDocuments: true,
        memory: memory,
        questionGeneratorChainOptions: {
          template: CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT,
          llm: model
        },
        qaChainOptions: {
          type: 'stuff',
          prompt: new PromptTemplate({ template: CHAIN_PROMPT, inputVariables: ["context", "question", "chat_history"]})
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

      let ret = '';

      if(res.response) {
        ret = res.response;
      } else {
        ret = res.text;
      }

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

    let model: any = null;

    if(process.env.BEDROCK_AWS_REGION) {
      model = new BedrockChat({
        streaming: true,
        model: process.env.BEDROCK_MODEL!, //"anthropic.claude-3-sonnet-20240229-v1:0",
        region: process.env.BEDROCK_AWS_REGION, //"us-east-1",
        // endpointUrl: "custom.amazonaws.com",
        credentials: {
          accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY!,
        },
        modelKwargs: {
        //   anthropic_version: "bedrock-2023-05-31",
          "temperature": 0.5,
          "max_tokens": 4096
        },
      });

    } else {
      model = new ChatOpenAI({
        verbose: true,
        streaming: true, 
        temperature: .5,});

    }

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
      llm: model,
      memory,
      prompt: chatPrompt,
    });

    const callbacks = CallbackManager.fromHandlers(handlers);

    chain.call({input: lastHumanMessage.content }, [handlers]).catch(e => { console.log(e);});
    return new StreamingTextResponse(stream);
  
  }

};