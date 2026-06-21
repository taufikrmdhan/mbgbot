import { NextResponse } from 'next/server';
import getAssistantReply from '../../../lib/assistant';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ reply: 'Pesan kosong' }, { status: 400 });
    }

    const reply = await getAssistantReply(message);
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat route error:', msg);
    return NextResponse.json({ reply: 'Maaf, terjadi kesalahan.' }, { status: 500 });
  }
}