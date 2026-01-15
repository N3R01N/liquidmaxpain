// src/app/api/config/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    projectId: process.env.WALLETCONNECT_PROJECT_ID,
  });
}