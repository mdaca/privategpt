import { ChatMessageModel } from "../chat/chat-service";
import { ChatThreadModel } from "../chat/chat-thread-service";
import { userHashedId, userSession } from "@/features/auth/helpers";
import { db } from "../common/mysql";
import { ChromaClient } from "chromadb";
import { IncludeEnum } from "chromadb/dist/main/types";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Chroma } from 'langchain/vectorstores/chroma';
import { nanoid } from "nanoid";
import moment from 'moment';
import { getToken } from "next-auth/jwt";
import { accessSync } from "fs";

export const CreateStore = async (model: KnowledgeStoreModel) => {
    await Chroma.fromTexts(
  ['init'],
  [{}],
  new OpenAIEmbeddings({azureOpenAIApiDeploymentName: 'text-embedding-ada-002'}),
  {
    collectionName: model.collectionName ?? ""
  });

  model.userId = await userHashedId();
  model.useName = (await userSession())!.name;
  model.createdAt = (moment(new Date())).format('YYYY-MM-DD HH:mm:ss');
  model.id = nanoid();
  model.isDeleted = false;
  
  const result = await db.query(
    'INSERT INTO stores (collectionName, useName, UserId, isPrivate, id, createdAt, isDeleted, collectionDesc) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [model.collectionName, model.useName, model.userId, model.isPrivate? 1:0, model.id, model.createdAt,model.isDeleted? 1:0, model.collectionDesc]
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
  
    return await axios.get('http://localhost:8000/api/v1/collections')
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
    path: "http://localhost:8000"
  });
  await client.deleteCollection({name: collectionName});
  
  await db.query('UPDATE stores SET isDeleted = 1 WHERE collectionName = ?', [collectionName])

  return true;
};

export const GetStoreContent = async (collectionName: string, take: number, skip: number, filter: string) => {

  const client = new ChromaClient({
    path: "http://localhost:8000"
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
};


export interface KnowledgeStoreModel {
  id: string;
  isPrivate: boolean;
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