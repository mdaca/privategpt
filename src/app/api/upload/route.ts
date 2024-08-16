import { GetMyStores, KnowledgeStoreModel, addToGraphStore, get_neo4jgraph, uploadToChroma, uploadToSmallDocsStore } from '@/features/vectorstore/vectorstore-service';
import { writeFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import * as PDFJS from "pdfjs-dist/build/pdf";
import * as PDFJSWorker from "pdfjs-dist/build/pdf.worker";
import { Document } from "@langchain/core/documents";
import { v4 as uuidv4 } from 'uuid';
import { userHashedId, userSession } from '@/features/auth/helpers';
import { getToken } from 'next-auth/jwt';
var fs = require('fs');

function getParameterByName(name, url = window.location.href): string {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return '';
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

export async function POST(request: NextRequest) {

  PDFJS.GlobalWorkerOptions.workerSrc = PDFJSWorker;
  const url = request.url;
  const cn = getParameterByName("cn", url);
  const data = await request.formData()
  const file: File | null = data.get('files') as unknown as File;
  const nodes: string | null = data.get('nodes') as unknown as string;
  const relats: string | null = data.get('relats') as unknown as string;
  const session = await userSession();
  
  if (!file) {
    return NextResponse.json({ success: false })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  // With the file data in the buffer, you can do whatever you want with it.
  // For this, we'll just write it to the filesystem in a new location
  const path = `/tmp/${uuidv4()}.tmp`
  await writeFile(path, buffer)
  console.log(`open ${path} to see the uploaded file`)

  let stores = await GetMyStores();

  let store: any = null;

  stores.forEach(element => {
    if(element.collectionName == cn) {
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
    return NextResponse.json({ success: false });
  }

  const pdfjsLib = require("pdfjs-dist");

  let doc = await pdfjsLib.getDocument(path).promise;

  if(store) {

    if(store.storeType == 'Graph') {
      let uploaded = new Date().toISOString();

      let pages: string[] = [];

      for (let i = 1; i <= doc.numPages; i++) {

        let page = await doc.getPage(i);
        let content = await page.getTextContent();
        let strings = content.items.map(function (item: any) {
          return item.str;
        });
        //console.dir(strings);
        let pageContent = strings.join(' \r\n');
        pages.push(pageContent);
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

      let lcDoc = new Document({ pageContent: pages.join('  \r\n'), metadata: { file: file.name, uploaded: uploaded } });

      await addToGraphStore(lcDoc, cn, nodes, relats);

      fs.rmSync(path, {
        force: true,
      });
      return NextResponse.json({ success: true });

    } else if(store.storeType == 'SmallDocs') {
      let uploaded = new Date().toISOString();

      let pages: string[] = [];

      for (let i = 1; i <= doc.numPages; i++) {

        let page = await doc.getPage(i);
        let content = await page.getTextContent();
        let strings = content.items.map(function (item: any) {
          return item.str;
        });
        //console.dir(strings);
        let pageContent = strings.join(' \r\n');
        pages.push(pageContent);
      }

      let graph = await get_neo4jgraph(cn);

      await graph.query(
        `MATCH (p:Parent {file: $file})
             DETACH DELETE p
            `, {
        "file": file.name
      }
      );
      await graph.query(
        `MATCH (p:Child {file: $file})
             DELETE p
            `, {
        "file": file.name
      }
      );

      let lcDoc = new Document({ pageContent: pages.join('  \r\n'), metadata: { file: file.name, uploaded: uploaded } });

      await uploadToSmallDocsStore(lcDoc, cn);

      fs.rmSync(path, {
        force: true,
      });
      return NextResponse.json({ success: true });
    
    } else {

    
      for(let i = 1; i <= doc.numPages; i++) {
    
        let page = await doc.getPage(i);
        let content = await page.getTextContent();
        let strings = content.items.map(function(item: any) {
            return item.str;
        });
        console.dir(strings);
        let pageContent = strings.join(' ');
    
        await uploadToChroma(pageContent, i, file.name, cn);
      }
    
      fs.rmSync(path, {
        force: true,
      });
    
      return NextResponse.json({ success: true });
    }
  } else {
    return NextResponse.json({ success: false });
  }

}