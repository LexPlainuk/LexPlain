import { Cookie } from 'lucide-react';
import type { CookieConsentState } from '../utils/cookieScripts';

interface CookieBannerProps {
  consentState: CookieConsentState;
  onAccept: () => void;
  onReject: () => void;
  onOpenPrivacy: () => void;
}

export function CookieBanner({
  consentState,
  onAccept,
  onReject,
  onOpenPrivacy,
}: CookieBannerProps) {
  if (consentState !== 'pending') {
    return null;
  }

  return (
    <aside
      aria-label="Cookie and PECR consent banner"
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-300 shadow-lg"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3 max-w-3xl">
          <Cookie className="w-5 h-5 text-[#1E3A5F] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs sm:text-sm text-stone-700 leading-relaxed">
            <strong className="text-stone-900">UK GDPR &amp; PECR Privacy Notice:</strong>{' '}
            LexPlain UK processes questions ephemerally in memory without storing chat logs or user databases. Any non-essential analytics or third-party advertising scripts (such as Google AdSense) remain strictly blocked unless you choose to accept them.{' '}
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="underline underline-offset-2 text-[#1E3A5F] hover:text-stone-900 font-medium focus-ring rounded"
            >
              Read Privacy &amp; Cookie Policy
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onReject}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-stone-300 bg-white text-stone-900 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-ring"
          >
            Reject Non-Essential Cookies
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-[#1E3A5F] bg-[#1E3A5F] text-white hover:bg-[#162C49] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-ring"
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </aside>
  );
}
