import { useState } from 'react';
import { ShieldAlert, Check, Scale } from 'lucide-react';

interface ConsentGateModalProps {
  onConfirm: () => void;
  onOpenLegalDoc: (doc: 'terms' | 'privacy') => void;
}

const CONSENT_ITEMS = [
  {
    id: 'educational-only',
    text: 'I understand this website provides general legal information about the law of England and Wales for educational purposes ONLY, and is NOT legal advice.',
  },
  {
    id: 'non-reliance',
    text: 'I understand I must NOT rely or act upon any output from this tool without first consulting and obtaining approval from a qualified, regulated solicitor.',
  },
  {
    id: 'independent-ai-sra',
    text: 'I understand this is an independent public information tool powered by AI that can make mistakes, and is NOT a law firm or regulated by the Solicitors Regulation Authority (SRA).',
  },
  {
    id: 'no-personal-data',
    text: 'I will NOT enter real names of people or businesses, addresses, case numbers, or confidential personal details.',
  },
] as const;

export function ConsentGateModal({
  onConfirm,
  onOpenLegalDoc,
}: ConsentGateModalProps) {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  const checkedCount = CONSENT_ITEMS.filter((item) => checkedIds[item.id]).length;
  const allChecked = checkedCount === CONSENT_ITEMS.length;

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-gate-heading"
    >
      <div className="w-full max-w-2xl bg-[#FBF9F5] border border-stone-300 rounded-xl shadow-xl overflow-hidden my-auto">
        <div className="bg-[#1E3A5F] text-white px-6 py-5">
          <div className="flex items-center gap-2.5 text-xs tracking-wide text-stone-200 mb-1.5">
            <Scale className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>LexPlain UK · Plain-English Legal Information for England &amp; Wales</span>
          </div>
          <h2
            id="consent-gate-heading"
            className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-white"
          >
            Mandatory Public Information Acknowledgement
          </h2>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 text-sm leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong>Important Notice:</strong> Before the question bar is enabled, please read and confirm all four statements below. LexPlain UK is an independent public legal information tool and is not regulated to provide legal services.
            </p>
          </div>

          <div className="space-y-3" role="group" aria-label="Required acknowledgements">
            {CONSENT_ITEMS.map((item, idx) => {
              const isChecked = Boolean(checkedIds[item.id]);
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-3.5 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-white border-[#1E3A5F] text-stone-900'
                      : 'bg-white/80 border-stone-200 text-stone-800 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleItem(item.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                      isChecked
                        ? 'bg-[#1E3A5F] border-[#1E3A5F] text-white'
                        : 'bg-white border-stone-400 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span className="text-sm leading-relaxed">
                    <span className="font-mono-tabular text-xs text-stone-500 mr-2">
                      0{idx + 1}.
                    </span>
                    {item.text}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-stone-600 space-y-1">
              <div className="font-mono-tabular font-medium text-stone-800">
                {checkedCount} of {CONSENT_ITEMS.length} confirmed
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc('terms')}
                  className="underline underline-offset-2 hover:text-stone-900 focus-ring rounded"
                >
                  Terms &amp; Non-Reliance
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc('privacy')}
                  className="underline underline-offset-2 hover:text-stone-900 focus-ring rounded"
                >
                  Privacy &amp; UK GDPR
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={!allChecked}
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-ring ${
                allChecked
                  ? 'bg-[#1E3A5F] text-white hover:bg-[#162C49] cursor-pointer'
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed'
              }`}
            >
              I Agree &amp; Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
