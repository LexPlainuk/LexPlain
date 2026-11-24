import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  ExternalLink,
  RotateCcw,
  Scale,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { ConsentGateModal } from './components/ConsentGateModal';
import { CookieBanner } from './components/CookieBanner';
import { FaqSection } from './components/FaqSection';
import { LegalModals, type LegalModalType } from './components/LegalModals';
import { StudyMessageCard, type StudyMessage } from './components/StudyMessageCard';
import {
  LEGAL_TOPIC_AREAS,
  PUBLIC_EXAMPLE_QUESTIONS,
  type PublicExampleQuestion,
} from './data/studySyllabus';
import {
  areNonEssentialScriptsAllowed,
  type CookieConsentState,
} from './utils/cookieScripts';
import { explainLegalQuestion, fetchServerQuota } from './services/legalExplainerService';
import { MAX_PROMPT_CHARS } from './services/guardrails';

interface GuardrailFeedback {
  title: string;
  message: string;
  suggestion: string;
}

interface QuotaState {
  limit: number;
  remaining: number;
}

function formatTimeNow(): string {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function App() {
  const [hasConsented, setHasConsented] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<CookieConsentState>('pending');
  const [activeLegalModal, setActiveLegalModal] = useState<LegalModalType>(null);

  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [messages, setMessages] = useState<StudyMessage[]>([]);
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [guardrailFeedback, setGuardrailFeedback] = useState<GuardrailFeedback | null>(null);
  const [lastRetryableQuestion, setLastRetryableQuestion] = useState<{
    question: string;
    topicLabel: string;
  } | null>(null);
  const [quota, setQuota] = useState<QuotaState>({ limit: 15, remaining: 15 });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const portalTopRef = useRef<HTMLElement | null>(null);

  const activeTopic =
    LEGAL_TOPIC_AREAS.find((t) => t.id === selectedTopicId) ?? LEGAL_TOPIC_AREAS[0];

  // PECR enforcement: Non-essential third-party scripts (e.g., analytics or ads)
  // remain strictly blocked unless cookieConsent === 'accepted'.
  const scriptsPermitted = areNonEssentialScriptsAllowed(cookieConsent);

  useEffect(() => {
    let active = true;
    void fetchServerQuota().then((serverQuota) => {
      if (active && serverQuota) {
        setQuota(serverQuota);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, isLoading]);

  const handleClearSession = () => {
    setMessages([]);
    setGuardrailFeedback(null);
    setLastRetryableQuestion(null);
    setPromptInput('');
  };

  const submitQuestion = async (rawQuestion: string, topicOverrideLabel?: string) => {
    if (!hasConsented || isLoading) {
      return;
    }

    const trimmed = rawQuestion.trim();
    if (!trimmed) {
      setGuardrailFeedback({
        title: 'Empty Question',
        message: 'Please enter a general legal concept or statute question for England & Wales.',
        suggestion:
          'Select one of the public example questions below or ask about a statutory rule in plain English.',
      });
      return;
    }

    const effectiveTopicLabel = topicOverrideLabel ?? activeTopic.label;

    setGuardrailFeedback(null);
    setLastRetryableQuestion(null);
    setIsLoading(true);

    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    try {
      const result = await explainLegalQuestion({
        prompt: trimmed,
        topicLabel: effectiveTopicLabel,
        history: historyPayload,
        consentConfirmed: hasConsented,
      });

      if (result.quota) {
        setQuota(result.quota);
      }

      if (!result.ok || result.blocked) {
        if (result.retryable) {
          setLastRetryableQuestion({ question: trimmed, topicLabel: effectiveTopicLabel });
        }
        setGuardrailFeedback({
          title: result.title ?? 'Request Not Processed',
          message:
            result.message ??
            'Your request could not be processed. Please rephrase using general hypothetical terms.',
          suggestion:
            result.suggestion ??
            'Example: "What is the general legal test for negligence in England & Wales?"',
        });
        return;
      }

      if (result.reply) {
        const nowLabel = formatTimeNow();
        const userMessage: StudyMessage = {
          id: `u-${Date.now()}`,
          role: 'user',
          text: trimmed,
          moduleTopic: effectiveTopicLabel,
          timestamp: nowLabel,
        };
        const aiMessage: StudyMessage = {
          id: `m-${Date.now() + 1}`,
          role: 'model',
          text: result.reply,
          moduleTopic: effectiveTopicLabel,
          timestamp: nowLabel,
        };
        setMessages((prev) => [...prev, userMessage, aiMessage]);
        setPromptInput('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitQuestion(promptInput);
  };

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submitQuestion(promptInput);
    }
  };

  const handleSelectExample = (example: PublicExampleQuestion) => {
    if (!hasConsented || isLoading) {
      return;
    }
    setSelectedTopicId(example.topicId);
    setPromptInput(example.question);
    void submitQuestion(example.question, example.topicLabel);
  };

  const scrollToPortalTop = () => {
    portalTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const composerElement = (
    <form
      onSubmit={handleFormSubmit}
      className="bg-white border border-stone-300 rounded-xl p-4 sm:p-5 shadow-xs space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#1E3A5F]" aria-hidden="true" />
          <span>
            Topic Area: <strong className="text-stone-900">{activeTopic.label}</strong>
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-stone-300">·</span>
          <span className="hidden sm:inline text-stone-500 font-mono-tabular">
            {activeTopic.keyStatutes}
          </span>
        </div>
        <div className="font-mono-tabular text-stone-500">
          {quota.remaining} / {quota.limit} hourly queries remaining · Stateless
        </div>
      </div>

      <label htmlFor="public-legal-question-input" className="sr-only">
        Ask a general question about the law of England and Wales
      </label>
      <textarea
        id="public-legal-question-input"
        rows={3}
        maxLength={MAX_PROMPT_CHARS}
        disabled={!hasConsented || isLoading}
        value={promptInput}
        onChange={(e) => setPromptInput(e.target.value)}
        onKeyDown={handleTextareaKeyDown}
        placeholder={
          hasConsented
            ? 'Ask a general question about UK statutes or legal principles in England & Wales (never enter real names, postcodes, addresses, or personal disputes)...'
            : 'Please complete the mandatory acknowledgement gate to ask a question...'
        }
        className="w-full resize-y min-h-[88px] rounded-lg border border-stone-200 bg-[#FBF9F5] px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-[#1E3A5F] focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span className="font-mono-tabular">
            {promptInput.length} / {MAX_PROMPT_CHARS} chars
          </span>
          <span aria-hidden="true">·</span>
          <span>Press Enter to ask</span>
        </div>

        <button
          type="submit"
          disabled={!hasConsented || isLoading || promptInput.trim().length === 0}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#1E3A5F] text-white hover:bg-[#162C49] disabled:bg-stone-200 disabled:text-stone-500 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-ring"
        >
          <span>{isLoading ? 'Generating Summary...' : 'Explain in Plain English'}</span>
          <ArrowUp className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  return (
    <div
      className="min-h-screen flex flex-col bg-[#FBF9F5] text-stone-900"
      data-non-essential-scripts={scriptsPermitted ? 'allowed' : 'blocked'}
    >
      {/* Mandatory Blocking Consent Gate on Entry */}
      {!hasConsented && (
        <ConsentGateModal
          onConfirm={() => setHasConsented(true)}
          onOpenLegalDoc={(doc) => setActiveLegalModal(doc)}
        />
      )}

      {/* 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#legal-portal"
            className="font-display text-xl font-semibold tracking-tight text-stone-900 whitespace-nowrap shrink-0 focus-ring rounded"
          >
            LexPlain UK
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600"
          >
            <button
              type="button"
              onClick={scrollToPortalTop}
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-ring rounded"
            >
              Topic Areas
            </button>
            <button
              type="button"
              onClick={() => setActiveLegalModal('guide')}
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-ring rounded"
            >
              Statute Guide
            </button>
            <button
              type="button"
              onClick={() => setActiveLegalModal('terms')}
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-ring rounded"
            >
              Terms of Use
            </button>
            <button
              type="button"
              onClick={() => setActiveLegalModal('privacy')}
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-ring rounded"
            >
              Privacy &amp; Cookies
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleClearSession}
              disabled={!hasConsented || (messages.length === 0 && !promptInput && !guardrailFeedback)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-ring"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Clear Session
            </button>
          </div>
        </div>
      </header>

      {/* Persistent High-Visibility Top Warning Banner */}
      <div
        role="region"
        aria-label="Mandatory legal information warning"
        className="bg-amber-50 border-b border-amber-300 text-amber-950"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-start sm:items-center gap-2.5 text-xs sm:text-sm font-medium leading-snug">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <p>
            General Legal Information Only — Not Legal Advice. Do not rely or act upon this output without consulting a qualified solicitor. Never enter personal details.
          </p>
        </div>
      </div>

      {/* Main Public Legal Information Q&A Portal */}
      <main
        id="legal-portal"
        ref={portalTopRef}
        className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-6"
      >
        {/* Portal Title & Topic Area Selector */}
        <section className="space-y-4">
          <div className="space-y-2 max-w-3xl">
            <p className="text-xs sm:text-sm font-medium text-[#1E3A5F]">
              Plain-English Legal Information for England &amp; Wales
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight text-balance">
              Understand UK statutes and legal principles clearly
            </h1>
            <p className="text-sm sm:text-[15px] text-stone-600 leading-relaxed">
              Ask general questions about consumer rights, housing rules, negligence, employment law, or statutory frameworks in England and Wales. Questions are processed strictly in memory and never stored.
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label="Select legal topic area"
            className="flex flex-wrap items-center gap-2 pt-1"
          >
            {LEGAL_TOPIC_AREAS.map((topic) => {
              const isActive = topic.id === selectedTopicId;
              return (
                <button
                  key={topic.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-ring ${
                    isActive
                      ? 'bg-[#1E3A5F] border-[#1E3A5F] text-white'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300 hover:text-stone-900'
                  }`}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* When no conversation yet: show composer right below header, then 4 everyday public questions */}
        {messages.length === 0 && (
          <>
            {composerElement}

            {guardrailFeedback && (
              <div
                role="alert"
                className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-2.5 text-amber-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                    <span>{guardrailFeedback.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {lastRetryableQuestion && (
                      <button
                        type="button"
                        onClick={() =>
                          void submitQuestion(
                            lastRetryableQuestion.question,
                            lastRetryableQuestion.topicLabel
                          )
                        }
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#1E3A5F] text-white hover:bg-[#162C49] cursor-pointer focus-ring"
                      >
                        Retry Question
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setGuardrailFeedback(null);
                        setLastRetryableQuestion(null);
                      }}
                      className="text-xs font-medium underline underline-offset-2 hover:text-stone-900 cursor-pointer focus-ring rounded"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-amber-900">
                  {guardrailFeedback.message}
                </p>
                <p className="text-xs leading-relaxed text-amber-800 pt-1 border-t border-amber-200">
                  <strong>Guidance:</strong> {guardrailFeedback.suggestion}
                </p>
              </div>
            )}

            {isLoading && (
              <div
                role="status"
                aria-live="polite"
                className="bg-white border border-stone-200 rounded-xl p-5 flex items-center gap-3 text-sm text-stone-700"
              >
                <Scale className="w-4 h-4 text-[#1E3A5F] animate-pulse shrink-0" aria-hidden="true" />
                <span>Preparing plain-English explanation for {activeTopic.label}...</span>
              </div>
            )}

            {/* Everyday Public Example Questions */}
            <section aria-label="Common public legal questions" className="space-y-3 pt-2">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-lg font-semibold text-stone-900">
                  Everyday Public Questions
                </h2>
                <span className="text-xs text-stone-500">
                  Click any question to view a plain-English summary
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PUBLIC_EXAMPLE_QUESTIONS.map((example) => (
                  <button
                    key={example.id}
                    type="button"
                    disabled={!hasConsented || isLoading}
                    onClick={() => handleSelectExample(example)}
                    className="group text-left p-4 sm:p-5 rounded-xl bg-white border border-stone-200 hover:border-[#1E3A5F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer focus-ring flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span className="font-medium text-[#1E3A5F]">{example.topicLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular truncate">{example.statuteRef}</span>
                      </div>
                      <p className="text-sm sm:text-[15px] font-medium text-stone-900 leading-snug">
                        {example.question}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A5F] group-hover:underline underline-offset-2">
                      <span>Read plain-English summary</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Frequently Asked Questions */}
            <FaqSection onOpenLegalDoc={(doc) => setActiveLegalModal(doc)} />

            {/* Clear Public Safeguards Summary */}
            <section className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs text-stone-700 leading-relaxed">
                <div>
                  <div className="font-semibold text-stone-900 mb-1">
                    1. General Legal Information Only
                  </div>
                  Answers explain statutes and general legal tests in plain English—never personal advice on whether you will win a dispute.
                </div>
                <div>
                  <div className="font-semibold text-stone-900 mb-1">
                    2. Reserved Activities Refused
                  </div>
                  Under the Legal Services Act 2007, wills, deeds, court forms, witness statements, and formal legal letters cannot be drafted or reviewed.
                </div>
                <div>
                  <div className="font-semibold text-stone-900 mb-1">
                    3. Zero-Storage Privacy
                  </div>
                  Questions and answers are processed ephemerally in memory only. Postcodes, emails, phone numbers, and real identities are blocked automatically.
                </div>
              </div>
            </section>
          </>
        )}

        {/* Active Q&A Conversation View */}
        {messages.length > 0 && (
          <section aria-label="Question and answer thread" className="space-y-5">
            {messages.map((msg) => (
              <StudyMessageCard key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <div
                role="status"
                aria-live="polite"
                className="bg-white border border-stone-200 rounded-xl p-5 flex items-center gap-3 text-sm text-stone-700"
              >
                <Scale className="w-4 h-4 text-[#1E3A5F] animate-pulse shrink-0" aria-hidden="true" />
                <span>Preparing plain-English explanation for {activeTopic.label}...</span>
              </div>
            )}

            {guardrailFeedback && (
              <div
                role="alert"
                className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-2.5 text-amber-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                    <span>{guardrailFeedback.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {lastRetryableQuestion && (
                      <button
                        type="button"
                        onClick={() =>
                          void submitQuestion(
                            lastRetryableQuestion.question,
                            lastRetryableQuestion.topicLabel
                          )
                        }
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#1E3A5F] text-white hover:bg-[#162C49] cursor-pointer focus-ring"
                      >
                        Retry Question
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setGuardrailFeedback(null);
                        setLastRetryableQuestion(null);
                      }}
                      className="text-xs font-medium underline underline-offset-2 hover:text-stone-900 cursor-pointer focus-ring rounded"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-amber-900">
                  {guardrailFeedback.message}
                </p>
                <p className="text-xs leading-relaxed text-amber-800 pt-1 border-t border-amber-200">
                  <strong>Guidance:</strong> {guardrailFeedback.suggestion}
                </p>
              </div>
            )}

            {composerElement}

            <div ref={messagesEndRef} />
          </section>
        )}
      </main>

      {/* Comprehensive Legal Footer */}
      <footer className="bg-white border-t border-stone-200 mt-8 pb-20 sm:pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-display font-semibold text-sm text-stone-900">
                LexPlain UK · Plain-English Legal Information for England &amp; Wales
              </div>
              <p className="text-xs text-stone-600 max-w-2xl leading-relaxed">
                Independent public legal information portal governed by the laws of England and Wales. Not a law firm, not regulated by the SRA, and no duty of care or solicitor-client relationship is formed. Do not rely on AI output without consulting a qualified solicitor.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-stone-700">
              <button
                type="button"
                onClick={() => setActiveLegalModal('terms')}
                className="hover:text-[#1E3A5F] underline underline-offset-4 cursor-pointer whitespace-nowrap focus-ring rounded"
              >
                Terms of Use &amp; Non-Reliance Disclaimer
              </button>
              <button
                type="button"
                onClick={() => setActiveLegalModal('privacy')}
                className="hover:text-[#1E3A5F] underline underline-offset-4 cursor-pointer whitespace-nowrap focus-ring rounded"
              >
                Privacy &amp; Cookie Policy (UK GDPR / PECR)
              </button>
              <button
                type="button"
                onClick={() => setCookieConsent('pending')}
                className="hover:text-[#1E3A5F] underline underline-offset-4 cursor-pointer whitespace-nowrap focus-ring rounded"
              >
                Cookie Preferences
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex flex-wrap items-center gap-4">
              <span>Need regulated legal help?</span>
              <a
                href="https://solicitors.lawsociety.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#1E3A5F] hover:underline underline-offset-2 font-medium"
              >
                solicitors.lawsociety.org.uk
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
              <a
                href="https://www.citizensadvice.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#1E3A5F] hover:underline underline-offset-2 font-medium"
              >
                citizensadvice.org.uk
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>
            <div className="font-mono-tabular">
              Non-essential scripts: {scriptsPermitted ? 'Accepted' : 'Blocked'}
            </div>
          </div>
        </div>
      </footer>

      {/* PECR-Compliant Cookie Consent Banner */}
      <CookieBanner
        consentState={cookieConsent}
        onAccept={() => setCookieConsent('accepted')}
        onReject={() => setCookieConsent('rejected')}
        onOpenPrivacy={() => setActiveLegalModal('privacy')}
      />

      {/* Legal Disclaimer, Privacy & Guide Modals */}
      <LegalModals
        activeModal={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
        cookieConsent={cookieConsent}
        onAcceptCookies={() => setCookieConsent('accepted')}
        onRejectCookies={() => setCookieConsent('rejected')}
      />
    </div>
  );
}
