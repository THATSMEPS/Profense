import { NextRequest, NextResponse } from 'next/server';
import { generateAdaptiveLesson } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, userMessage, pulse, history } = body ?? {};
    if (!topic || !userMessage || !pulse) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const data = await generateAdaptiveLesson({ topic, userMessage, pulse, history });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}




