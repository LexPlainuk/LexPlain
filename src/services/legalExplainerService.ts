import { validateQuestionInput, type EphemeralTurn } from './guardrails';

export interface SessionQuotaStatus {
  limit: number;
  remaining: number;
}

export interface ExplainLegalResult {
  ok: boolean;
  reply?: string;
  blocked?: boolean;
  retryable?: boolean;
  title?: string;
  message?: string;
  suggestion?: string;
  quota?: SessionQuotaStatus;
}

export async function fetchServerQuota(): Promise<SessionQuotaStatus | null> {
  try {
    const response = await fetch('/api/quota');
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as {
      limit?: number;
      remaining?: number;
    };
    if (typeof data.limit === 'number' && typeof data.remaining === 'number') {
      return { limit: data.limit, remaining: data.remaining };
    }
    return null;
  } catch {
    return null;
  }
}

export async function explainLegalQuestion(params: {
  prompt: string;
  topicLabel: string;
  history: EphemeralTurn[];
  consentConfirmed: boolean;
}): Promise<ExplainLegalResult> {
  if (!params.consentConfirmed) {
    return {
      ok: false,
      blocked: true,
      title: 'Acknowledgement Required',
      message:
        'You must confirm the four non-reliance acknowledgements before submitting questions.',
      suggestion: 'Complete the entry checklist to enable the public Q&A portal.',
    };
  }

  // Client-side pre-flight PII & advice check (re-enforced authoritatively on the server)
  const validation = validateQuestionInput(params.prompt, params.history);
  if (!validation.ok) {
    return {
      ok: false,
      blocked: true,
      title: validation.title,
      message: validation.message,
      suggestion: validation.suggestion,
    };
  }

  try {
    const response = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: params.prompt.trim(),
        topicLabel: params.topicLabel,
        history: params.history.slice(-6),
        consentConfirmed: params.consentConfirmed,
      }),
    });

    const data = (await response.json()) as {
      reply?: string;
      blocked?: boolean;
      retryable?: boolean;
      title?: string;
      message?: string;
      suggestion?: string;
      limit?: number;
      remaining?: number;
    };

    const quota =
      typeof data.limit === 'number' && typeof data.remaining === 'number'
        ? { limit: data.limit, remaining: data.remaining }
        : undefined;

    if (!response.ok || data.blocked || !data.reply) {
      return {
        ok: false,
        blocked: Boolean(data.blocked),
        retryable: Boolean(data.retryable ?? (response.status >= 500 || response.status === 429)),
        title: data.title ?? `Request Failed (HTTP ${response.status})`,
        message:
          data.message ??
          `HTTP ${response.status}: ${response.statusText || 'Request failed'}`,
        suggestion:
          data.suggestion ??
          'Try again in a moment or consult legislation.gov.uk directly.',
        quota,
      };
    }

    return {
      ok: true,
      reply: data.reply,
      quota,
    };
  } catch (error: unknown) {
    console.error('Legal explainer request failed:', error);
    const actualDetail =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unknown network or parsing error';

    return {
      ok: false,
      retryable: true,
      title: 'Request Error',
      message: actualDetail,
      suggestion: 'Check your connection or retry your question in a moment.',
    };
  }
}
