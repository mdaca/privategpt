import { DeleteStore } from '@/features/vectorstore/vectorstore-service';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json();

  await DeleteStore(body.name, request);

  return NextResponse.json({ success: true });
}