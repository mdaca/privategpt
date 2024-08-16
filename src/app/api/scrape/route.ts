import { GetMyStores, addToGraphStore, get_neo4jgraph, uploadToSmallDocsStore } from '@/features/vectorstore/vectorstore-service';
import { BedrockEmbeddings } from '@langchain/community/embeddings/bedrock';
import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { Document } from "@langchain/core/documents";


let crawled: any[] = [];

export async function POST(request: NextRequest) {
  const body = await request.json();

  const puppeteer = require('puppeteer');
  
 
return (async () => { 
	// Initiate the browser 
	const browser = await puppeteer.launch(); 
	 
    await crawlPageAndChildren(browser, body.url, body.name, body.url, request, body.nodes, body.relats);
	// Closes the browser and all of its pages 
	await browser.close(); 

    return NextResponse.json({ success: true });
})();

}

async function crawlPageAndChildren(browser: any, url: any, collectionName:any, rootUrl: any, request: any, nodes: any, relats: any) {

    let pages = await crawlPage(browser, url, collectionName, request, nodes, relats);
    crawled.push(url);
    for(let i = 0; i < (pages).length; i ++) {

        if(pages[i].indexOf(rootUrl) == 0 && crawled.indexOf(pages[i]) == -1) {
            await crawlPageAndChildren(browser, pages[i], collectionName, rootUrl, request, nodes, relats);
        }

    }
      
}

async function crawlPage (browser:any, url:any, collectionName:any, request: any, nodes: any, relats: any): Promise<any[]> {
    
	// Create a new page with the default browser context 
	const page = await browser.newPage(); 
 
	// Get pages HTML content const page = (await browser.pages())[0];
    await page.goto(url);
    let extractedText: string = await page.$eval('*', (el: any) => {
        const selection: any = window.getSelection();
        const range = document.createRange();
        range.selectNode(el);
        selection.removeAllRanges();
        selection.addRange(range);
        let select = window.getSelection();

        return select ? select.toString() : '';
    });

    extractedText = extractedText.replace(/\s+/g,' ').trim();

    console.log(extractedText);

    function splitInto(str : string, len: number): any {
        var regex = new RegExp('.{' + len + '}|.{1,' + Number(len-1) + '}', 'g');
        return str.match(regex );
    }
 
    let chunks: string[] = splitInto(extractedText, 2000);

    let metadatas: any[] = [];

    for(let i = 0; i < chunks.length; i++) {
        metadatas.push({url: url, captured: new Date().toISOString(), chunk: i + 1});
    }

    let stores = await GetMyStores();

    let store: any = null;
  
    stores.forEach(element => {
      if(element.collectionName == collectionName) {
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
          await addToGraphStore(lcDoc, collectionName, nodes, relats);
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
        
        let graph = await get_neo4jgraph(collectionName);

        await graph.query(
          `MATCH (p:Parent {url: $url})
               DETACH DELETE p
              `, {
          "url": url
        }
        );
        await graph.query(
          `MATCH (p:Child {url: $url})
               DELETE p
              `, {
          "url": url
        }
        );

        for(var i = 0; i < chunks.length; i++) {
          let lcDoc = new Document({ pageContent: chunks[i], metadata: metadatas[i] });
          await uploadToSmallDocsStore( lcDoc, collectionName);
        }
      } else {
        
      
      const client = new ChromaClient({
        path: process.env.CHROMA_URL
      });

      const collection = await client.getCollection({
        name: collectionName
      });

        await collection.delete({
          where: {"url": {"$eq": url}}
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
              metadatas,
              embeddings,
              {
                collectionName: collectionName ?? "",
                url: process.env.CHROMA_URL
              });
      
              
              const pageUrls = await page.evaluate(() => {
                  
                  function contains(arrIn: any[], v: any) {
                      for (var i = 0; i < arrIn.length; i++) {
                      if (arrIn[i] === v) return true;
                      }
                      return false;
                  };
      
                  function unique(arrIn: any[]) {
                      var arr: any[] = [];
                      for (var i = 0; i < arrIn.length; i++) {
                      if (!contains(arr, arrIn[i])) {
                          arr.push(arrIn[i]);
                      }
                      }
                      return arr;
                  }
                  const urlArray = Array.from(document.links).map((link) => {
                   
                   let uri = link.href;
                   if(uri.indexOf('#') > 0) {
                      uri = uri.split('#')[1];
                   }
      
                   if(uri.endsWith('/') == true) {
                      uri = uri.substring(0, uri.length - 1);
                   }
      
                   return uri;
                      
                  });
                  //const uniqueUrlArray = [...new Set(urlArray)];
                  return unique(urlArray);
              });
      
          return pageUrls;
      }
    }
   return [];
}
