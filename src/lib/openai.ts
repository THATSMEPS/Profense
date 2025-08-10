import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const maxOutputTokens = Number.parseInt(process.env.GEMINI_MAX_TOKENS || '300', 10);

export type AdaptiveAction = 'none' | 'quiz' | 'analogy' | 'advanced' | 'humor' | 'gamified' | 'breakdown';

export interface AdaptiveResponse {
  message: string;
  action: AdaptiveAction;
  mode?: 'normal' | 'analogy' | 'advanced' | 'humor' | 'gamified' | 'breakdown';
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
- Be concise (<= 120 words). Prefer short steps and bullet points.
- Personalize using pulse signals when useful.
- If action is 'quiz', include a single multiple-choice question with 3-4 options and one correctIndex.
 - If pulse.state is 'frustrated' or action is 'analogy', ALSO include exactly one quiz in the same JSON response.
Topic: ${topic}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: `Pulse: ${JSON.stringify(pulse)}\nUser: ${userMessage}` },
  ] as any[];

  const model = genAI.getGenerativeModel({ model: modelName });
  const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${typeof m.content === 'string' ? m.content : ''}`).join('\n\n');
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.5, maxOutputTokens },
  });
  const raw = result.response.text() ?? '{"message":"","action":"none"}';
  const extracted = extractJsonObject(raw);
  try {
    const parsed = JSON.parse(extracted) as AdaptiveResponse;
    if (!parsed.message || !parsed.action) throw new Error('missing keys');
    return parsed;
  } catch (err) {
    return { message: stripCodeFences(raw), action: 'none' };
  }
}

function extractJsonObject(text: string): string {
  // Try to find the first top-level {...} JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

function stripCodeFences(text: string): string {
  return text.replace(/^```[\s\S]*?\n|```$/g, '').trim();
}


