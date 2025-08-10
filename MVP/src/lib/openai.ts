import OpenAI from 'openai';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type AdaptiveAction = 'none' | 'quiz' | 'analogy' | 'advanced' | 'humor' | 'gamified' | 'breakdown';

export interface AdaptiveResponse {
  message: string;
  action: AdaptiveAction;
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  };
}

export interface PulseSnapshot {
  timestamp: number;
  cognitiveLoad: number; // 0..1
  state: 'lost' | 'unfocused' | 'confident' | 'frustrated' | 'neutral';
  signals: Record<string, number>;
}

export async function generateAdaptiveLesson(params: {
  topic: string;
  userMessage: string;
  pulse: PulseSnapshot;
  history?: { role: 'user' | 'assistant' | 'system'; content: string }[];
}): Promise<AdaptiveResponse> {
  const { topic, userMessage, pulse, history = [] } = params;

  const systemPrompt = `You are SynapSense, an emotionally and cognitively adaptive AI professor.
You receive a current Learning Pulse with cognitive load, state, and signals. Adapt your teaching style accordingly.

Rules:
- Always produce STRICT JSON with keys: message (string), action (one of none|quiz|analogy|advanced|humor|gamified|breakdown), and optional quiz {question, options, correctIndex, explanation}.
- If pulse.state is 'lost' or cognitiveLoad > 0.7 -> action 'breakdown' and/or 'analogy'.
- If 'unfocused' -> action 'gamified'.
- If 'confident' -> action 'advanced'.
- If 'frustrated' -> action 'humor' or 'analogy'.
- Keep message concise, conversational, and personalized using pulse signals when useful.
- If action is 'quiz', include a single multiple-choice question with 3-4 options and one correctIndex.
Topic: ${topic}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: `Pulse: ${JSON.stringify(pulse)}\nUser: ${userMessage}` },
  ] as any[];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    messages,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content ?? '{"message":"","action":"none"}';
  try {
    const parsed = JSON.parse(raw) as AdaptiveResponse;
    if (!parsed.message || !parsed.action) throw new Error('missing keys');
    return parsed;
  } catch (err) {
    return { message: raw, action: 'none' };
  }
}


