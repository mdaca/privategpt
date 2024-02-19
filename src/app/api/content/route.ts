import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Chroma } from 'langchain/vectorstores/chroma';
import { NextRequest, NextResponse } from 'next/server'

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
    
    const client = new ChromaClient({
      path: process.env.CHROMA_URL
    });

    const collection = await client.getCollection({
      name: body.name
    });

    await collection.delete({
      where: {"title": {"$eq": body.title}}
      });


    await Chroma.fromTexts(
        chunks,
        metadatas,
        new OpenAIEmbeddings({azureOpenAIApiDeploymentName: 'text-embedding-ada-002'}),
        {
          collectionName: body.name ?? ""
        });

    return NextResponse.json({ success: true });

}
