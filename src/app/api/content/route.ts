import { GetMyStores, addToGraphStore, get_neo4jgraph, uploadToSmallDocsStore } from '@/features/vectorstore/vectorstore-service';
import { BedrockEmbeddings } from '@langchain/community/embeddings/bedrock';
import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Store } from 'lucide-react';
import { NextRequest, NextResponse } from 'next/server';
import { Document } from "@langchain/core/documents";
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  const body = await request.json();

  let extractedText = body.content.replace(/\s+/g,' ').trim();

    console.log(extractedText);

    function splitInto(str : string, len: number): any {
        var regex = new RegExp('.{' + len + '}|.{1,' + Number(len-1) + '}', 'g');
        return str.match(regex );
    }
 
    let chunks: string[] = splitInto(extractedText, 2000);

    let metadatas: any[] = [];

    for(let i = 0; i < chunks.length; i++) {
        metadatas.push({title: body.title, entered: new Date().toISOString(), chunk: i + 1});
    }
    
    let stores = await GetMyStores();

    let store: any = null;
  
    stores.forEach(element => {
      if(element.collectionName == body.name) {
        store = element;
      }
    });
  
    const token = await getToken({ req: request });
  
    let access: boolean = true;
  
    if(token != null && token['isAdmin'] == true) {
      access = true;
    }
  
    if(store.isPrivate == false || store.userId == token?.email) {
      access = true;
    }
  
    if(!access) {
      throw new Error("Access denied");
    }

    if(store) {
      if(store.storeType == 'Graph') {
        
      for(var i = 0; i < chunks.length; i++) {
        let lcDoc = new Document({ pageContent: chunks[i], metadata: metadatas[i] });
        await addToGraphStore(lcDoc, body.name, body.nodes, body.relats);
      }

      // let graph = await get_neo4jgraph(cn);

      // await graph.query(
      //   `MATCH (p:Parent {file: $file})
      //        DETACH DELETE p
      //       `, {
      //   "file": file.name
      // }
      // );
      // await graph.query(
      //   `MATCH (p:Child {file: $file})
      //        DELETE p
      //       `, {
      //   "file": file.name
      // }
      // );

    } else if(store.storeType == 'SmallDocs') {

        let graph = await get_neo4jgraph(body.name);

        await graph.query(
          `MATCH (p:Parent {title: $title})
               DETACH DELETE p
              `, {
          "title": body.title
        }
        );
        await graph.query(
          `MATCH (p:Child {title: $title})
               DELETE p
              `, {
          "title": body.title
        }
        );
    
        for(var i = 0; i < chunks.length; i++) {
          let lcDoc = new Document({ pageContent: chunks[i], metadata: metadatas[i] });
          await uploadToSmallDocsStore( lcDoc, body.name);
        }
        
      } else {
        const client = new ChromaClient({
          path: process.env.CHROMA_URL
        });
    
        const collection = await client.getCollection({
          name: body.name
        });
    
        await collection.delete({
          where: {"title": {"$eq": body.title}}
          });
    
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
    
        await Chroma.fromTexts(
            chunks,
            metadatas, embeddings,
            {
              collectionName: body.name ?? "",
              url: process.env.CHROMA_URL
            });
            ;
      }
    }
    

    return NextResponse.json({ success: true });

}
