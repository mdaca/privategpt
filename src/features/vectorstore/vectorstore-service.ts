import { ChatMessageModel } from "../chat/chat-service";
import { ChatThreadModel } from "../chat/chat-thread-service";
import { userHashedId, userSession } from "@/features/auth/helpers";
import { db } from "../common/mysql";
import { ChromaClient } from "chromadb";
import { IncludeEnum } from "chromadb/dist/main/types";
import { OpenAIEmbeddings }  from "@langchain/openai";
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { nanoid } from "nanoid";
import moment from 'moment';
import { getToken } from "next-auth/jwt";
import { accessSync } from "fs";
import { BedrockEmbeddings } from "@langchain/community/embeddings/bedrock";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";
import { ChatOpenAI } from "@langchain/openai";
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { TokenTextSplitter } from "langchain/text_splitter";
import { LLMGraphTransformer } from "@langchain/community/experimental/graph_transformers/llm";

export const StoreExists = async (collectionName: string) => {

  try {
    let result: any = await db.query('SELECT 1 FROM stores WHERE collectionName = ?', [collectionName]);
    if(result[0].length > 0) {
      return true;
    } else{
       return false;
    }
  } catch (err) {
    console.log("Error");
    console.log(err);
    return false;
  }

}

export const CreateStore = async (model: KnowledgeStoreModel) => {

  async function get_neo4jgraph() {
    const url = process.env.NEO4J_URI!;
    const username = process.env.NEO4J_USERNAME!;
    const password = process.env.NEO4J_PASSWORD!;
    const graph = await Neo4jGraph.initialize({ url, username, password});
    return graph;
  }

  class MyEmbeddingFunction {
    private embedder: any = null;
  
    constructor() {
      
    let embeddings: any = null;

    if(process.env.BEDROCK_AWS_REGION) {
        embeddings = new BedrockEmbeddings({
          region: process.env.BEDROCK_AWS_REGION,
          credentials: {
            accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY!,
          },
          model: process.env.BEDROCK_EMBED_MODEL, // Default value
        });
      } else {
        embeddings = new OpenAIEmbeddings({azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBED_MODEL});
      }

      this.embedder = embeddings;
    }
  
    public async generate(texts: string[]): Promise<number[][]> {
      // do things to turn texts into embeddings with an api_key perhaps
      let ret = await this.embedder?.embedDocuments(texts);
      if(ret) {
        return ret;
      }
      throw new ReferenceError("embeddings undefined");
    }
  }

  if(model.storeType == 'SmallDocs' || model.storeType == 'Graph') {
    let graph = await get_neo4jgraph();

      await graph.query(
        ` create database ` + model.collectionName
    );

  } else {
    console.log('CHROMA_URL: ' + process.env.CHROMA_URL);
    
    await new ChromaClient({
      path: process.env.CHROMA_URL
    }).createCollection({name: model.collectionName ?? "", embeddingFunction: new MyEmbeddingFunction()});
  }

  model.userId = await userHashedId();
  model.useName = (await userSession())!.name;
  model.createdAt = (moment(new Date())).format('YYYY-MM-DD HH:mm:ss');
  model.id = nanoid();
  model.isDeleted = false;
  
  const result = await db.query(
    'INSERT INTO stores (collectionName, useName, UserId, isPrivate, id, createdAt, isDeleted, collectionDesc, storeType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [model.collectionName, model.useName, model.userId, model.isPrivate? 1:0, model.id, model.createdAt,model.isDeleted? 1:0, model.collectionDesc, model.storeType]
  );

  return result;

};

export const GetStorePrompt = async (collectionName: string) => {

  const hashedUserId = await userHashedId();

  try {
    let result = await db.query('SELECT collectionPrompt FROM stores WHERE (isPrivate = 0 OR userId = ?) AND isDeleted = 0 AND collectionName = ?', [hashedUserId, collectionName])
    const data: KnowledgeStoreModel[] = result[0] as KnowledgeStoreModel[];
    return data
  } catch (err) {
    console.log("Error");
    console.log(err);
    return []
  }
};


export const SetStorePrompt = async (model: KnowledgeStoreModel) => {

  const result = await db.query(
    'UPDATE stores SET collectionPrompt = ? WHERE collectionName = ?',
    [model.collectionPrompt, model.collectionName]
  );

  return result;
};

export async function get_neo4jgraph(cn: string) {
  const url = process.env.NEO4J_URI!;
  const username = process.env.NEO4J_USERNAME!;
  const password = process.env.NEO4J_PASSWORD!;
  const graph = await Neo4jGraph.initialize({ url: url, username: username, password: password, database: cn, enhancedSchema: true});
  return graph;
}

export const GetMyStores = async () => {

  const hashedUserId = await userHashedId();

  try {
    let result = await db.query('SELECT * FROM stores WHERE (isPrivate = 0 OR userId = ?) AND isDeleted = 0', [hashedUserId])
    const data: KnowledgeStoreModel[] = result[0] as KnowledgeStoreModel[];
    return data
  } catch (err) {
    console.log("Error");
    console.log(err);
    return []
  }
};

export const GetAllCollections = async () => {
  try {
    const axios = require('axios');
  
    return await axios.get(process.env.CHROMA_URL + '/api/v1/collections')
      .then((response: any) => {
        console.log(response.data);
        return response.data;
      })
      .catch((error: any) => {
        console.log(error);
        return [];
      });
  } catch (err) {
    console.log("Error");
    console.log(err);
    return [];
  }
};



export async function uploadToChroma(pageContent: any, i: number, filename: string, cn: string) {
  let embeddings: any = null;

  if (process.env.BEDROCK_AWS_REGION) {
    embeddings = new BedrockEmbeddings({
      region: process.env.BEDROCK_AWS_REGION,
      credentials: {
        accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY!,
      },
      model: process.env.BEDROCK_EMBED_MODEL, // Default value
    });
  } else {
    embeddings = new OpenAIEmbeddings({ azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBED_MODEL });
  }

  const client = new ChromaClient({
    path: process.env.CHROMA_URL
  });

  const collection = await client.getCollection({
    name: cn
  });

  await collection.delete({
    where: {"file": {"$eq": filename}}
    });

  let uploaded = new Date().toISOString();

  await Chroma.fromTexts(
    [
      pageContent
    ],
    [{ page: i, file: filename, uploaded: uploaded }],
    embeddings,
    {
      collectionName: cn,
      url: process.env.CHROMA_URL
    }
  );
}

async function embedgraph(embeddings, cn: string) {
  const url = process.env.NEO4J_URI!;
  const username = process.env.NEO4J_USERNAME!;
  const password = process.env.NEO4J_PASSWORD!;
  
  return Neo4jVectorStore.fromExistingGraph(
    embeddings,
    {username: username, password: password, url: url, database: cn, indexName: "retrieval", nodeLabel: "Child", textNodeProperties: ["text"], embeddingNodeProperty: "embedding" }
    );
}

export async function uploadToSmallDocsStore(lcDoc: any, cn: string) {
  
  const parent_splitter = new TokenTextSplitter({
    chunkSize: 4000,
    chunkOverlap: 128,
  });
  const child_splitter = new TokenTextSplitter({
    chunkSize: 512,
    chunkOverlap: 64,
  });

  let parent_documents = await parent_splitter.splitDocuments([lcDoc]);

  let graph = await get_neo4jgraph(cn);

  for (var i = 0; i < parent_documents.length; i++) {

    parent_documents[i].metadata.loc = JSON.stringify(parent_documents[i].metadata.loc);

    let child_documents = await child_splitter.splitDocuments([parent_documents[i]]);
    let params = {
      "parent": parent_documents[i].pageContent,
      "uploaded": parent_documents[i].metadata.uploaded,
      "file": parent_documents[i].metadata.file,
      "children": child_documents.map(x => x.pageContent),
    };
    await graph.query(
      `
        CREATE (p:Parent {text: $parent, file: $file, uploaded: $uploaded})
        WITH p 
        UNWIND $children AS child
        CREATE (c:Child {text: child, file: $file, uploaded: $uploaded})
        CREATE (c)-[:HAS_PARENT]->(p)
        `,
      params
    );
  }

  let embeddings: any = null;
  let model: any = null;

  if (process.env.BEDROCK_AWS_REGION) {

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
      temperature: .5,
    });

    embeddings = new OpenAIEmbeddings({ azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBED_MODEL });
  }


  let eg: Neo4jVectorStore = await embedgraph(embeddings, cn);

  await eg.addDocuments(parent_documents);
}


export async function addToGraphStore(lcDoc: any, cn: string, nodes: string, relats: string) {
  
  let graph = await get_neo4jgraph(cn);

  let embeddings: any = null;
  let model: any = null;

  if (process.env.BEDROCK_AWS_REGION) {

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
      temperature: .5,
    });

    embeddings = new OpenAIEmbeddings({ azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBED_MODEL });
  }

  const llmGraphTransformerFiltered = new LLMGraphTransformer({
    llm: model,
    allowedNodes: nodes.length > 0 ? nodes.split(',') : undefined,
    allowedRelationships: relats.length > 0 ? relats.split(',') : undefined,
    strictMode: nodes.length > 0 ? true : false,
  });
  
  const result =
    await llmGraphTransformerFiltered.convertToGraphDocuments([
      lcDoc,
    ]);

    if(result.length > 0) {
      result[0].nodes.forEach(element => {
        element.type = element.type.toUpperCase();
        //element.properties['test'] = 'test2';
      });
  
      await graph.addGraphDocuments(result);

      await graph.query(`MATCH (p) 
                          WITH lower(p.id) AS name, lower(labels(p)[0]) AS type, collect(p) as nodes 
                          CALL apoc.refactor.mergeNodes(nodes, {properties: {\`.*\`: 'discard'}}) YIELD node 
                          RETURN count(node) AS new_node_count 
                          `);
    }
}

export const DeleteStore = async (collectionName: string, request: any) => {

  
  
  const token: any = await getToken({ req: request });

  let access = false;

  if(token.isAdmin == true) {
    access = true;
  }

  if(access == false) {
    let result = await db.query('SELECT userId FROM stores where collectionName = ? and isDeleted = 0 and isPrivate = 1', [collectionName]);
    if(result[0][0].userId == await userHashedId()) {
      access = true;
    }
  }

  if(access == false) {
    return false;
  }

  const client = new ChromaClient({
    path: process.env.CHROMA_URL
  });
  await client.deleteCollection({name: collectionName});
  
  await db.query('UPDATE stores SET isDeleted = 1 WHERE collectionName = ?', [collectionName])

  return true;
};

export const GetStoreContent = async (collectionName: string, take: number, skip: number, filter: string, request: any) => {

  const token: any = await getToken({ req: request });

  let access = false;

  if(token.isAdmin == true) {
    access = true;
  }

  let storeType = 'Large';

  if(access == false) {
    let result = await db.query(`SELECT userId, storeType FROM stores where collectionName = ? and isDeleted = 0 and isPrivate = 1
                                 UNION
                                 SELECT 'PUBLIC', storeType FROM stores where collectionName = ? and isDeleted = 0 and isPrivate = 0`, [collectionName]);
    if(result[0][0].userId == 'PUBLIC' || result[0][0].userId == await userHashedId()) {
      access = true;
      storeType = result[0][1].storeType;
    }
  } else {
    let result = await db.query(`SELECT storeType FROM stores where collectionName = ? and isDeleted = 0`, [collectionName]);
    storeType = result[0][0].storeType;
  }

  if(access == false) {
    return [];
  }
  if(storeType == 'Graph') {

    let graph = await get_neo4jgraph(collectionName);

    const retrieval_query = `
    MATCH (p) 
    RETURN labels(p)[0] + ' ' + p.id as text, id(p) as id LIMIT 200
    `;

    const relat_query = `
    MATCH (a)-[r]-(b) 
    RETURN id(a) as from, id(b) as to, type(r) as label, id(r) as id limit 200
    `;

    let data = await graph.query(retrieval_query);
    let relat = await graph.query(relat_query);

    let ret: any[] = [];

    if(filter) {
      data = data.filter(x => x.text.toLowerCase().indexOf(filter.toString().toLowerCase()) >= 0);
    }

    for(var i = 0 + skip; i < 0 + skip + take; i++) {

      if(i >= data.length) {
        continue;
      }

      let relats = relat.filter(x => x.from == data[i].id);

      ret.push({
        total: data.length,
        sourceName: data[i].text,
        document: data[i].text,
        metadata: {relationships: relats},
        id: data[i].id,
        expanded: false
        });
    }

    return ret;

  } else if(storeType == 'SmallDocs') {

    let graph = await get_neo4jgraph(collectionName);

    const retrieval_query = `
    MATCH (node)-[:HAS_PARENT]->(parent)
    WITH parent, max(parent.id) as id
    RETURN parent.text AS text, ID(parent) as id, {file: parent.file, uploaded: parent.uploaded} AS metadata
    `;

    let data = await graph.query(retrieval_query);

    let ret: any[] = [];

    if(filter) {
      data = data.filter(x => x.text.toLowerCase().indexOf(filter.toString().toLowerCase()) >= 0);
    }

    for(var i = 0 + skip; i < 0 + skip + take; i++) {

      if(i >= data.length) {
        continue;
      }

      ret.push({
        total: data.length,
        sourceName: data[i].metadata.file,
        document: data[i].text,
        metadata: JSON.stringify(data[i].metadata),
        id: data[i].id,
        expanded: false
        });
    }

    return ret;

  } else {

    const client = new ChromaClient({
      path: process.env.CHROMA_URL
    });
    const collection = await client.getCollection({
      name: collectionName
    });
  
   let opts = {
    //ids: ["id1", "id2"],
    //where: { key: "value" },
    limit: take,
    offset: skip,
    include: [IncludeEnum.Metadatas, IncludeEnum.Documents],
    //whereDocument: { $contains: "value" },
  };
  
  if(filter.length > 0) {
    opts['whereDocument'] = { $contains: filter };
  }
  
    const response = await collection.get(opts);
  
  let ret: any[] = [];
  
  const count = await collection.count();
  
  for(var i = 0; i < response.documents.length; i++) {
  
  
    if(response != null && response.metadatas[i] != null) {
  
      let sourceName: any = '';
      if(response!.metadatas[i]!.file) {
        sourceName = response!.metadatas[i]!.file;
      } else if (response!.metadatas[i]!.url) {
        sourceName = response!.metadatas[i]!.url;
      } else {
        sourceName = response!.metadatas[i]!.title;
      }
  
    
      ret.push({
      total: count,
      sourceName: sourceName,
      document: response.documents[i],
      metadata: JSON.stringify(response.metadatas[i]),
      id: response.ids[i],
      expanded: false
      });
    } else {
      ret.push({
        total: count,
        sourceName: 'init',
        document: 'init',
        metadata: 'init',
        id: response.ids[i],
        expanded: false
      });
    }
  }
  
    return ret;
  }

};


export interface KnowledgeStoreModel {
  id: string;
  isPrivate: boolean;
  storeType: string;
  createdAt: string;
  userId: string;
  useName: string;
  isDeleted: boolean;
  collectionName: string;
  collectionDesc: string;
  collectionPrompt: string | null;
}

export interface KnowledgeStoreContentModel {
  sourceName: string;
  metadata: string;
  docuemnt: string;
  id: string;
}