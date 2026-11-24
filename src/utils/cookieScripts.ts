export type CookieConsentState = 'pending' | 'accepted' | 'rejected';

/**
 * PECR & UK GDPR Gate:
 * Non-essential third-party analytics or advertising scripts (such as Google AdSense)
 * MUST remain strictly unmounted/blocked until the user explicitly chooses "Accept Cookies".
 * LexPlain UK does not require or load any third-party trackers by default.
 */
export function areNonEssentialScriptsAllowed(consent: CookieConsentState): boolean {
  return consent === 'accepted';
}

export function getCookieStatusDescription(consent: CookieConsentState): string {
  if (consent === 'accepted') {
    return 'Non-essential cookies accepted for this browser session (no third-party ads or analytics scripts are currently active).';
  }
  if (consent === 'rejected') {
    return 'Non-essential cookies rejected. All analytics and advertising scripts remain strictly blocked.';
  }
  return 'Decision pending. All non-essential analytics and advertising scripts are blocked by default under PECR.';
}
