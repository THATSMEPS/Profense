import { NextRequest, NextResponse } from 'next/server';
import { generateAdaptiveLesson } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, userMessage, pulse, history } = body ?? {};
    if (!pulse) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const safeTopic = (topic && String(topic).trim()) || 'General Learning';
    const safeMessage = (userMessage && String(userMessage).trim()) || 'Continue the lesson and adapt to my current pulse.';
    const trimmedHistory = Array.isArray(history) && history.length > 8 ? history.slice(-8) : history;
    const data = await generateAdaptiveLesson({ topic: safeTopic, userMessage: safeMessage, pulse, history: trimmedHistory });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}




