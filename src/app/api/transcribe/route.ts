import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No audio file' }, { status: 400 });
    }
    // Gemini free tier does not provide a stable Whisper-compatible endpoint here.
    // For MVP, return empty transcript; voice RMS still feeds the Pulse engine to adapt pacing.
    return NextResponse.json({ text: '' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Transcription failed' }, { status: 500 });
  }
}


