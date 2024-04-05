import { BedrockEmbeddings } from '@langchain/community/embeddings/bedrock';
import { ChromaClient } from 'chromadb';
import { writeFile } from 'fs/promises'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Chroma } from 'langchain/vectorstores/chroma';
import { NextRequest, NextResponse } from 'next/server'
import * as PDFJS from "pdfjs-dist/build/pdf";
import * as PDFJSWorker from "pdfjs-dist/build/pdf.worker";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  PDFJS.GlobalWorkerOptions.workerSrc = PDFJSWorker;
  const url = request.url;
  const cn = url.split("cn=")[1];
  const data = await request.formData()
  const file: File | null = data.get('files') as unknown as File

  if (!file) {
    return NextResponse.json({ success: false })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  // With the file data in the buffer, you can do whatever you want with it.
  // For this, we'll just write it to the filesystem in a new location
  const path = `/tmp/${file.name}`
  await writeFile(path, buffer)
  console.log(`open ${path} to see the uploaded file`)

  const pdfjsLib = require("pdfjs-dist");

  let doc = await pdfjsLib.getDocument(path).promise;

  const client = new ChromaClient({
    path: process.env.CHROMA_URL
  });

  const collection = await client.getCollection({
    name: cn
  });

  await collection.delete({
    where: {"file": {"$eq": file.name}}
    });

    let uploaded = new Date().toISOString();

  for(let i = 1; i <= doc.numPages; i++) {

    let page = await doc.getPage(i);
    let content = await page.getTextContent();
    let strings = content.items.map(function(item: any) {
        return item.str;
    });
    console.dir(strings);
    let pageContent = strings.join(' ');

    
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
        embeddings = new OpenAIEmbeddings({azureOpenAIApiDeploymentName: 'text-embedding-ada-002'});
      }
    
     await Chroma.fromTexts(
    [
      pageContent
    ],
    [{ page: i, file: file.name, uploaded: uploaded }],
    embeddings,
    {
      collectionName: cn,
      url: process.env.CHROMA_URL
    }
  );
  }



  return NextResponse.json({ success: true })
}