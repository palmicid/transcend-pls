import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'transcendence-game-server',
    timestamp: new Date().toISOString()
  });
}
