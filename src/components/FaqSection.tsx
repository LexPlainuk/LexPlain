import { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import type { LegalModalType } from './LegalModals';

interface FaqSectionProps {
  onOpenLegalDoc: (doc: LegalModalType) => void;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  actionLabel?: string;
  actionDoc?: LegalModalType;
  links?: { label: string; href: string }[];
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'privacy',
    question: 'How does LexPlain handle data privacy?',
    answer:
      'LexPlain UK is built with a stateless, zero-storage architecture. Your questions and generated summaries are processed strictly in memory for your active browser tab and are never saved to a database, chat history log, or user profile. Before any request reaches the AI model, automated filters block UK postcodes, National Insurance numbers, phone numbers, email addresses, and personal names. Hourly rate limiting uses volatile HMAC-hashed identifiers in server memory only, and non-essential scripts remain blocked under PECR unless you explicitly accept cookies.',
    actionLabel: 'Read Privacy & Cookie Policy',
    actionDoc: 'privacy',
  },
  {
    id: 'urgent-help',
    question: 'What should I do if I need urgent legal help?',
    answer:
      'Do not use LexPlain UK for urgent, time-sensitive, or personal legal situations—this portal provides general legal information only and cannot assess deadlines, court dates, or individual risks. If anyone is in immediate physical danger, call 999 straight away. For urgent personal disputes, housing evictions, employment deadlines, or criminal matters in England and Wales, contact Citizens Advice for free impartial guidance or instruct a qualified, SRA-regulated solicitor through The Law Society directory.',
    links: [
      { label: 'Find a solicitor (The Law Society)', href: 'https://solicitors.lawsociety.org.uk' },
      { label: 'Citizens Advice', href: 'https://www.citizensadvice.org.uk' },
    ],
  },
  {
    id: 'legal-advice-drafting',
    question: 'Does LexPlain UK provide legal advice or draft legal documents?',
    answer:
      'No. LexPlain UK is an independent AI-powered public information tool, not a law firm, and is not regulated by the Solicitors Regulation Authority (SRA). No solicitor-client relationship or duty of care is ever formed. Under the Legal Services Act 2007, this tool also refuses requests to draft, review, or tailor formal legal instruments such as wills, property deeds, contracts, court pleadings, witness statements, or letters before claim.',
    actionLabel: 'View Terms of Use & Non-Reliance Disclaimer',
    actionDoc: 'terms',
  },
  {
    id: 'blocked-question',
    question: 'Why was my question blocked before getting an answer?',
    answer:
      'To protect your privacy and stay strictly within general legal information boundaries, LexPlain UK blocks prompts containing real names of individuals or companies, street addresses, UK postcodes, contact details, case numbers, or personal-advice phrasing such as "can I sue" or "what should I do". You can still explore the underlying statute or legal test by rephrasing in neutral hypothetical terms—for example, using "Party A" and "Party B" without identifying details.',
  },
  {
    id: 'verify-statutes',
    question: 'Can I rely on AI summaries for a court claim or dispute?',
    answer:
      'No. AI language models can make mistakes, misstate statutory thresholds, or miss important exceptions and recent amendments. You must never rely or act upon any summary from LexPlain UK without checking the authoritative primary text on legislation.gov.uk or judiciary.uk and obtaining approval from a qualified, regulated solicitor.',
    actionLabel: 'Open Statute Verification Guide',
    actionDoc: 'guide',
    links: [
      { label: 'legislation.gov.uk', href: 'https://www.legislation.gov.uk' },
      { label: 'judiciary.uk', href: 'https://www.judiciary.uk' },
    ],
  },
];

export function FaqSection({ onOpenLegalDoc }: FaqSectionProps) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    privacy: true,
  });

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section aria-labelledby="faq-section-heading" className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
        <h2
          id="faq-section-heading"
          className="font-display text-lg font-semibold text-stone-900"
        >
          Frequently Asked Questions
        </h2>
        <span className="text-xs text-stone-500">
          How LexPlain UK works, privacy safeguards, and where to get regulated help
        </span>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-200">
        {FAQ_ITEMS.map((item) => {
          const isOpen = Boolean(openIds[item.id]);
          const panelId = `faq-panel-${item.id}`;
          const buttonId = `faq-button-${item.id}`;

          return (
            <div key={item.id}>
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-stone-50/80 transition-colors cursor-pointer focus-ring first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="text-sm sm:text-[15px] font-medium text-stone-900 leading-snug">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#1E3A5F]' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="px-5 pb-4 pt-0.5 text-sm text-stone-700 leading-relaxed space-y-2.5"
              >
                <p>{item.answer}</p>

                {(item.actionDoc || (item.links && item.links.length > 0)) && (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs font-medium">
                    {item.actionDoc && item.actionLabel && (
                      <button
                        type="button"
                        onClick={() => onOpenLegalDoc(item.actionDoc ?? null)}
                        className="text-[#1E3A5F] hover:underline underline-offset-2 cursor-pointer focus-ring rounded"
                      >
                        {item.actionLabel}
                      </button>
                    )}

                    {item.links?.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#1E3A5F] hover:underline underline-offset-2 focus-ring rounded"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
