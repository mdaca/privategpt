import { CreateStore, StoreExists } from '@/features/vectorstore/vectorstore-service';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
 
  const body = await request.json();
  
  const token = await getToken({ req: request });

  let priv = true;

  if(token != null && token['isAdmin'] == true) {
    priv = body.private;

    if(isNaN(priv['value']) == false) {
      priv = priv['value'] == 1;
    }
  }

  if(body.name.length > 0 && await StoreExists(body.name) == false)  {
    await CreateStore({
      collectionName: body.name, collectionDesc: body.desc, isPrivate: priv, storeType: body.storeType,
      id: '',
      createdAt: '',
      userId: '',
      useName: '',
      isDeleted: false,
      collectionPrompt: null
    });
  
    return NextResponse.json({ success: true })

  } else {
    return NextResponse.json({ success: true })
  }
}