# LexPlain UK — Plain-English Legal Information for England & Wales

An independent public legal information and statute explainer for England and Wales built with **React + Vite + TypeScript + Tailwind CSS** and an **Express** backend (`server.ts`) calling `@google/genai` on the server.

## Architecture & Legal Safeguards

- **Mandatory Entry Consent Gate (`src/components/ConsentGateModal.tsx`)**: Unskippable 4-checkbox acknowledgement confirming general information / non-legal-advice scope, non-reliance without a regulated solicitor, independent AI limitations / non-SRA status, and prohibition on entering personal details.
- **Persistent Warning Banner (`src/App.tsx`)**: Permanent banner above the Q&A portal reminding users not to rely on output or enter personal data.
- **PECR & UK GDPR Compliance (`src/components/CookieBanner.tsx`, `src/utils/cookieScripts.ts`)**: Non-essential analytics/ad scripts remain strictly blocked until explicit user acceptance, with equally prominent Accept and Reject actions.
- **Zero-Storage Server API (`server.ts`, `server/geminiClient.ts`, `server/rateLimiter.ts`)**: Gemini API calls run exclusively on the server using `GEMINI_API_KEY`. Prompts, histories, and IP addresses are never written to any database or log file, and hourly rate limiting (15 requests/hour) uses a volatile in-memory HMAC hash.
- **Pre-API Guardrails (`server/guardrails.ts`, `src/services/guardrails.ts`)**: Blocks UK postcodes, email addresses, UK phone numbers, National Insurance numbers, case numbers, street addresses, self-identifying phrases, reserved legal activities (Legal Services Act 2007), and personal advice requests before calling the AI model.
- **Structured Public-Friendly System Prompt & Enforced Footer (`server/systemPrompt.ts`)**: Structures every answer into *Plain-English Overview*, *Key Statutes & Principles*, and *Important Exceptions & Things to Check*, enforces hypothetical framing ("Party A" / "Party B"), and appends the mandatory non-reliance footer to every response.

## Setup & Running Locally

1. Configure `GEMINI_API_KEY` in your environment (or **Settings > Secrets** in AI Studio).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (Express + Vite on port 3000):
   ```bash
   npm run dev
   ```
4. Type-check, build, and run in production:
   ```bash
   npm run lint
   npm run build
   npm start
   ```
