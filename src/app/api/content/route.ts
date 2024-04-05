import { BedrockEmbeddings } from '@langchain/community/embeddings/bedrock';
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
        chunks,
        metadatas, embeddings,
        {
          collectionName: body.name ?? "",
          url: process.env.CHROMA_URL
        });
        ;

    return NextResponse.json({ success: true });

}
