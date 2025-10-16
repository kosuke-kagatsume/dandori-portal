import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    DATABASE_URL_exists: !!process.env.DATABASE_URL,
    DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
    DATABASE_URL_starts_with: process.env.DATABASE_URL?.substring(0, 20) || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  });
}
