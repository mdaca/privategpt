import { GetMyStores, GetStoreContent } from '@/features/vectorstore/vectorstore-service';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const collectionName = body.name;
    const skip = body.skip;
    const take = body.take;
    const filter = body.filter;

    let stores = await GetStoreContent(collectionName, take, skip, filter);
    return NextResponse.json(stores);
  } catch (err) {
    console.log("Error");
    console.log(err);
    return NextResponse.json([]);
  }
}
