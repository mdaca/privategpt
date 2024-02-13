import { GetMyStores } from '@/features/vectorstore/vectorstore-service';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    let stores = await GetMyStores();
    return NextResponse.json(stores);
  } catch (err) {
    console.log("Error");
    console.log(err);
    return NextResponse.json([]);
  }
}