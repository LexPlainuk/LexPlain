import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { SYSTEM_PROMPT } from './systemPrompt.ts';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getServerGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function extractGeminiErrorInfo(err: unknown): {
  status: number;
  message: string;
} {
  let status = 500;
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const parsed = Number((err as { status?: number }).status);
    if (!Number.isNaN(parsed) && parsed >= 400 && parsed < 600) {
      status = parsed;
    }
  }
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'Unknown upstream error';

  return { status, message };
}

export async function generateLegalExplanation(
  ai: GoogleGenAI,
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
): Promise<string | undefined> {
  const attempts: Array<{ model: string; useLowThinking: boolean; delayAfterMs: number }> = [
    { model: 'gemini-4-hydrogen', useLowThinking: true, delayAfterMs: 600 },
    { model: 'gemini-4-hydrogen', useLowThinking: true, delayAfterMs: 1200 },
    { model: 'gemini-3.1-flash-lite', useLowThinking: false, delayAfterMs: 700 },
    { model: 'gemini-3.1-flash-lite', useLowThinking: false, delayAfterMs: 0 },
  ];

  let lastError: unknown;

  for (let i = 0; i < attempts.length; i++) {
    const step = attempts[i];
    try {
      const response = await ai.models.generateContent({
        model: step.model,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          ...(step.useLowThinking
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });
      return response.text?.trim();
    } catch (err: unknown) {
      lastError = err;
      const { status } = extractGeminiErrorInfo(err);
      const isTransient =
        status === 503 || status === 502 || status === 504 || status === 429;
      if (!isTransient || i === attempts.length - 1) {
        throw err;
      }
      const jitter = Math.floor(Math.random() * 250);
      await sleep(step.delayAfterMs + jitter);
    }
  }

  throw lastError;
}
