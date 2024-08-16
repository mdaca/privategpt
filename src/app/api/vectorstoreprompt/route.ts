import { CreateStore, SetStorePrompt } from '@/features/vectorstore/vectorstore-service';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
 
  const body = await request.json();
  
  if(body.name.length > 0) {
    await SetStorePrompt({
      collectionName: body.name, collectionPrompt: body.prompt,
      id: '',
      isPrivate: false,
      storeType: '',
      createdAt: '',
      userId: '',
      useName: '',
      isDeleted: false,
      collectionDesc: ''
    });
  
    return NextResponse.json({ success: true })

  } else {
    return NextResponse.json({ success: false })
  }
}