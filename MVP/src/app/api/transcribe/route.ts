import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { toFile } from 'openai/uploads';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No audio file' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(buffer, 'audio.webm'),
      model: 'gpt-4o-transcribe',
      response_format: 'json',
      temperature: 0,
    });

    return NextResponse.json({ text: (transcription as any).text || '' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Transcription failed' }, { status: 500 });
  }
}


