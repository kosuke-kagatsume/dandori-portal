import { NextResponse } from 'next/server';

export async function GET() {
  // This route is used to enable MSW in development
  return NextResponse.json({ mocking: process.env.NODE_ENV === 'development' });
}