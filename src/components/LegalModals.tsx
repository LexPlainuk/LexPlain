import { X, ExternalLink, ShieldCheck, Scale } from 'lucide-react';
import {
  getCookieStatusDescription,
  type CookieConsentState,
} from '../utils/cookieScripts';

export type LegalModalType = 'terms' | 'privacy' | 'guide' | null;

interface LegalModalsProps {
  activeModal: LegalModalType;
  onClose: () => void;
  cookieConsent: CookieConsentState;
  onAcceptCookies: () => void;
  onRejectCookies: () => void;
}

export function LegalModals({
  activeModal,
  onClose,
  cookieConsent,
  onAcceptCookies,
  onRejectCookies,
}: LegalModalsProps) {
  if (!activeModal) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/65 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="w-full max-w-2xl bg-[#FBF9F5] border border-stone-300 rounded-xl shadow-xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            {activeModal === 'privacy' ? (
              <ShieldCheck className="w-5 h-5 text-[#1E3A5F]" aria-hidden="true" />
            ) : (
              <Scale className="w-5 h-5 text-[#1E3A5F]" aria-hidden="true" />
            )}
            <h2
              id="legal-modal-title"
              className="text-lg sm:text-xl font-display font-semibold text-stone-900"
            >
              {activeModal === 'terms' && 'Terms of Use & Non-Reliance Disclaimer'}
              {activeModal === 'privacy' && 'Privacy & Cookie Policy (UK GDPR / PECR)'}
              {activeModal === 'guide' && 'How to Verify Statutes & Case Law'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer focus-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4 text-sm text-stone-700 leading-relaxed">
          {activeModal === 'terms' && (
            <>
              <section className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-stone-900">
                  1. Public Information Purpose Only
                </h3>
                <p>
                  LexPlain UK is an independent public legal information resource covering the law of England and Wales. All plain-English summaries, statutory references, and hypothetical examples are provided strictly for general public information and educational understanding. Nothing on this website constitutes legal advice, a legal service, or a regulated activity under the Legal Services Act 2007.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-stone-900">
                  2. No Duty of Care, No Warranty &amp; Non-Reliance
                </h3>
                <p>
                  This website is provided free of charge on an &ldquo;as is&rdquo; basis with no warranty, express or implied, as to accuracy, completeness, or statutory currency. AI-generated summaries can contain errors, omissions, or outdated interpretations of legislation.
                </p>
                <p>
                  No duty of care, contractual relationship, or solicitor-client relationship is created by using LexPlain UK. In accordance with English law principles (including non-reliance and Consumer Rights Act 2015 transparency), you must <strong>not</strong> rely or act upon any output from this tool without first consulting and obtaining approval from a qualified, SRA-regulated solicitor.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-stone-900">
                  3. Prohibited Uses
                </h3>
                <p>
                  You agree not to enter real names of living individuals, private companies, addresses, postcodes, National Insurance numbers, court case numbers, or confidential personal details. You must not use this tool to draft or review wills, deeds, court forms, witness statements, particulars of claim, or formal legal letters.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-stone-900">
                  4. Governing Law &amp; Where to Find Regulated Help
                </h3>
                <p>
                  These Terms of Use are governed by and construed in accordance with the laws of England and Wales. If you have a real-world legal issue, please contact a regulated professional or free independent guidance service:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <a
                      href="https://solicitors.lawsociety.org.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#1E3A5F] underline underline-offset-2 font-medium"
                    >
                      The Law Society — Find a Solicitor (solicitors.lawsociety.org.uk)
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.citizensadvice.org.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#1E3A5F] underline underline-offset-2 font-medium"
                    >
                      Citizens Advice (citizensadvice.org.uk)
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </li>
                </ul>
              </section>
            </>
          )}

          {activeModal === 'privacy' && (
            <>
              <section className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-stone-900">
                  1. Ephemeral In-Memory Processing (Zero Storage)
                </h3>
                <p>
                  LexPlain UK is engineered on a strict data-minimisation and zero-storage architecture under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
                </p>
                <p>
                  Your questions and AI responses are processed purely ephemerally in server memory during the request and are <strong>never</strong> written to a database, analytics warehouse, or server log file. Refreshing the page or clicking &ldquo;Clear Session&rdquo; wipes the temporary browser session immediately.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-stone-900">
                  2. Pre-API PII Blocker &amp; Ephemeral Rate Limiting
                </h3>
                <p>
                  Before any question reaches the AI model, automated guardrails inspect the text in memory to block UK postcodes, email addresses, telephone numbers, National Insurance numbers, street addresses, and self-identifying phrases. To prevent abuse, hourly rate limiting (15 requests/hour) uses a volatile, process-local cryptographic hash in RAM only; raw IP addresses are not stored or logged.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-display font-semibold text-base text-stone-900">
                  3. Cookie &amp; Script Control (PECR Compliance)
                </h3>
                <p>
                  Under the Privacy and Electronic Communications Regulations (PECR), non-essential cookies, analytics scripts, and advertising tags (such as Google AdSense) are blocked by default until you explicitly opt in.
                </p>
                <div className="p-3.5 bg-white border border-stone-200 rounded-lg space-y-3">
                  <div className="text-xs text-stone-800">
                    <strong>Current Status:</strong> {getCookieStatusDescription(cookieConsent)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={onRejectCookies}
                      className="px-3.5 py-1.5 rounded-md text-xs font-semibold border border-stone-300 bg-white text-stone-900 hover:bg-stone-100 cursor-pointer focus-ring"
                    >
                      Reject Non-Essential Cookies
                    </button>
                    <button
                      type="button"
                      onClick={onAcceptCookies}
                      className="px-3.5 py-1.5 rounded-md text-xs font-semibold border border-[#1E3A5F] bg-[#1E3A5F] text-white hover:bg-[#162C49] cursor-pointer focus-ring"
                    >
                      Accept Cookies
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeModal === 'guide' && (
            <>
              <section className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-stone-900">
                  Cross-Checking Official UK Legal Sources
                </h3>
                <p>
                  Primary Acts of Parliament, Statutory Instruments, and court judgments are the authoritative source of law in England and Wales—AI summaries are only a plain-English starting point. Always confirm exact statutory wording and current in-force status:
                </p>
              </section>
              <ul className="space-y-2.5 list-disc pl-5">
                <li>
                  <strong>Acts of Parliament &amp; Statutory Rules:</strong> Search the Act title and year on{' '}
                  <a
                    href="https://www.legislation.gov.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1E3A5F] underline underline-offset-2 font-medium"
                  >
                    legislation.gov.uk
                  </a>{' '}
                  and select the &ldquo;Latest Available (Revised)&rdquo; view to confirm whether a section has been amended or repealed.
                </li>
                <li>
                  <strong>Court &amp; Tribunal Guidance:</strong> Read official judicial summaries and court guidance on{' '}
                  <a
                    href="https://www.judiciary.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1E3A5F] underline underline-offset-2 font-medium"
                  >
                    judiciary.uk
                  </a>
                  .
                </li>
                <li>
                  <strong>Free Practical Guidance &amp; Regulated Solicitors:</strong> If you are facing a real-life dispute, seek free guidance at{' '}
                  <a
                    href="https://www.citizensadvice.org.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1E3A5F] underline underline-offset-2 font-medium"
                  >
                    citizensadvice.org.uk
                  </a>{' '}
                  or locate an SRA-regulated solicitor via{' '}
                  <a
                    href="https://solicitors.lawsociety.org.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1E3A5F] underline underline-offset-2 font-medium"
                  >
                    solicitors.lawsociety.org.uk
                  </a>
                  .
                </li>
              </ul>
            </>
          )}
        </div>

        <div className="px-6 py-3.5 bg-white border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer focus-ring"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
