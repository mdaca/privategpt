import { ChromaClient } from 'chromadb';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json();
    
  const client = new ChromaClient({
    path: "http://localhost:8000"
  });

  const collection = await client.getCollection({
    name: body.name
  });

  await collection.delete({
    ids: [body.id]
    });

  return NextResponse.json({ success: true })
}