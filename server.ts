import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLegalRequest, type EphemeralTurn } from './server/guardrails.ts';
import {
  checkAndConsumeRateLimit,
  peekRateLimit,
  refundRateLimitSlot,
} from './server/rateLimiter.ts';
import { ensureMandatoryFooter } from './server/systemPrompt.ts';
import {
  extractGeminiErrorInfo,
  generateLegalExplanation,
  getServerGeminiClient,
} from './server/geminiClient.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

async function startServer() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      stateless: true,
      jurisdiction: 'England & Wales',
    });
  });

  app.get('/api/quota', (req: Request, res: Response) => {
    const status = peekRateLimit(getClientIp(req));
    res.json({
      limit: status.limit,
      remaining: status.remaining,
      resetAtMs: status.resetAtMs,
    });
  });

  app.post('/api/explain', async (req: Request, res: Response) => {
    const body = req.body as {
      prompt?: unknown;
      topicLabel?: unknown;
      history?: unknown;
      consentConfirmed?: unknown;
    };

    if (body?.consentConfirmed !== true) {
      res.status(403).json({
        blocked: true,
        category: 'CONSENT_REQUIRED',
        title: 'Acknowledgement Required',
        message:
          'You must confirm the four non-reliance acknowledgements before submitting questions.',
        suggestion: 'Complete the entry checklist to enable the public Q&A portal.',
      });
      return;
    }

    const validation = validateLegalRequest(body.prompt, body.history);
    if (!validation.ok) {
      res.status(422).json({
        blocked: true,
        category: validation.category,
        title: validation.title,
        message: validation.message,
        suggestion: validation.suggestion,
      });
      return;
    }

    const clientIp = getClientIp(req);
    const rateStatus = checkAndConsumeRateLimit(clientIp);
    res.setHeader('X-RateLimit-Limit', String(rateStatus.limit));
    res.setHeader('X-RateLimit-Remaining', String(rateStatus.remaining));
    res.setHeader('X-RateLimit-Reset', String(rateStatus.resetAtMs));

    if (!rateStatus.allowed) {
      res.setHeader('Retry-After', String(rateStatus.retryAfterSeconds));
      res.status(429).json({
        blocked: true,
        category: 'RATE_LIMITED',
        title: 'Hourly Query Limit Reached',
        message: `To keep this free public information service sustainable, usage is capped at ${rateStatus.limit} questions per hour. Please try again in ${Math.ceil(rateStatus.retryAfterSeconds / 60)} minute(s).`,
        suggestion:
          'In the meantime, you can review your current explanations or read statutes directly on legislation.gov.uk.',
        limit: rateStatus.limit,
        remaining: 0,
        resetAtMs: rateStatus.resetAtMs,
      });
      return;
    }

    const ai = getServerGeminiClient();
    if (!ai) {
      const refunded = refundRateLimitSlot(clientIp);
      res.status(503).json({
        retryable: false,
        title: 'Service Configuration Pending',
        message:
          'GEMINI_API_KEY is not configured on the server. Check Settings > Secrets.',
        suggestion: 'Configure GEMINI_API_KEY in Settings > Secrets and try again.',
        limit: refunded.limit,
        remaining: refunded.remaining,
      });
      return;
    }

    const userPrompt = (body.prompt as string).trim();
    const topicLabel =
      typeof body.topicLabel === 'string' && body.topicLabel.trim().length > 0
        ? body.topicLabel.trim().slice(0, 80)
        : 'General England & Wales Law';

    const sanitizedHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(body.history)) {
      const recent = body.history.slice(-6) as EphemeralTurn[];
      for (const turn of recent) {
        if (
          turn &&
          (turn.role === 'user' || turn.role === 'model') &&
          typeof turn.text === 'string' &&
          turn.text.trim().length > 0
        ) {
          sanitizedHistory.push({
            role: turn.role,
            parts: [{ text: turn.text.trim().slice(0, 2500) }],
          });
        }
      }
    }

    const contextualPrompt = `[Topic Area: ${topicLabel}]\n\nPublic Question: ${userPrompt}`;

    try {
      const rawText = await generateLegalExplanation(ai, [
        ...sanitizedHistory,
        {
          role: 'user',
          parts: [{ text: contextualPrompt }],
        },
      ]);

      if (!rawText) {
        const refunded = refundRateLimitSlot(clientIp);
        res.status(502).json({
          retryable: true,
          title: 'Empty Model Response',
          message: 'Gemini returned an empty response body.',
          suggestion: 'Your hourly query slot was not consumed. Please try again.',
          limit: refunded.limit,
          remaining: refunded.remaining,
        });
        return;
      }

      res.json({
        reply: ensureMandatoryFooter(rawText),
        limit: rateStatus.limit,
        remaining: rateStatus.remaining,
        resetAtMs: rateStatus.resetAtMs,
      });
    } catch (err: unknown) {
      const { status, message } = extractGeminiErrorInfo(err);
      const refunded =
        status >= 500 || status === 429 ? refundRateLimitSlot(clientIp) : rateStatus;

      if (status === 503 || status === 429) {
        console.warn('Gemini endpoint upstream transient status:', status, message);
      } else {
        console.error('Gemini endpoint error status:', status, message);
      }

      res.status(status).json({
        retryable: status >= 500 || status === 429,
        title: `Gemini API Error (HTTP ${status})`,
        message: `HTTP ${status}: ${message}`,
        suggestion:
          'You can retry your question in a moment or consult legislation.gov.uk directly.',
        limit: refunded.limit,
        remaining: refunded.remaining,
        resetAtMs: refunded.resetAtMs,
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LexPlain UK server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LexPlain UK server:', err);
  process.exit(1);
});
