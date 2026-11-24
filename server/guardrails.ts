export type GuardrailCategory =
  | 'INVALID_INPUT'
  | 'PII_DETECTED'
  | 'SELF_IDENTIFYING'
  | 'PERSONAL_ADVICE'
  | 'RESERVED_ACTIVITY';

export type GuardrailResult =
  | { ok: true }
  | {
      ok: false;
      category: GuardrailCategory;
      title: string;
      message: string;
      suggestion: string;
    };

export interface EphemeralTurn {
  role: 'user' | 'model';
  text: string;
}

const MAX_PROMPT_CHARS = 2000;
const MAX_HISTORY_TURNS = 10;

// UK Postcode (covers standard formats such as SW1A 1AA, M1 1AE, B33 8TH, GIR 0AA)
const UK_POSTCODE_REGEX =
  /\b(?:[Gg][Ii][Rr]\s?0[Aa]{2}|(?:[A-Za-z][0-9]{1,2}|[A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2}|[A-Za-z][0-9][A-Za-z]|[A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?)\s?[0-9][A-Za-z]{2})\b/;

// Email address
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

// UK Telephone numbers (+44 or leading 07/01/02/03/08 with 9-10 digits)
const UK_PHONE_REGEX =
  /(?:\+44\s?(?:\(0\)\s?)?|(?<![\d.])0(?:7\d{3}|1\d{3}|2\d{2}|3\d{2}|8\d{2}))[\s-]?\d{3}[\s-]?\d{3,4}\b/;

// UK National Insurance Number
const NI_NUMBER_REGEX =
  /\b[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/i;

// Court claim / case reference numbers
const CASE_NUMBER_REGEX =
  /\b(?:case|claim|court|crime|ref(?:erence)?)\s*(?:no\.?|number|id|#|:)\s*[A-Z0-9][A-Z0-9/-]{4,}\b/i;

// Street addresses (house number + street type)
const STREET_ADDRESS_REGEX =
  /\b\d{1,4}[A-Za-z]?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Close|Drive|Dr|Way|Crescent|Place|Court|Gardens|Terrace|Square)\b/;

const SELF_IDENTIFYING_PHRASES: RegExp[] = [
  /\bmy name is\b/i,
  /\bi am called\b/i,
  /\bi'm called\b/i,
  /\bi live at\b/i,
  /\bmy address is\b/i,
  /\bmy postcode is\b/i,
  /\bmy employer is\b/i,
  /\bi work (?:at|for)\b/i,
  /\bmy landlord is\b/i,
  /\bmy tenant is\b/i,
  /\bmy neighbou?r is\b/i,
  /\bmy boss is\b/i,
  /\bmy company is\b/i,
  /\bmy ex-(?:husband|wife|partner) is\b/i,
  /\bmy case number\b/i,
  /\bmy national insurance\b/i,
  /\bmy phone number\b/i,
  /\bmy email is\b/i,
];

const RESERVED_ACTIVITY_PATTERNS: RegExp[] = [
  /\b(?:draft|write|edit|review|check|complete|fill\s+in|fill\s+out)\s+(?:a|an|my|the|this)?\s*(?:will|codicil|deed|trust\s+deed|conveyanc(?:e|ing)|probate\s+(?:form|application|document)|witness\s+statement|particulars\s+of\s+claim|statement\s+of\s+case|court\s+form|n1\s+form|claim\s+form|legal\s+letter|letter\s+before\s+(?:action|claim)|contract\s+for\s+me)\b/i,
  /\b(?:draft|write|review)\s+my\s+(?:contract|tenancy\s+agreement|nda|employment\s+contract)\b/i,
];

const PERSONAL_ADVICE_PATTERNS: RegExp[] = [
  /\bwhat should i do\b/i,
  /\bwhat can i do\b/i,
  /\bshould i sue\b/i,
  /\bcan i sue\b/i,
  /\bcan i take (?:them|him|her|my\s+\w+)\s+to\s+court\b/i,
  /\bwill i win\b/i,
  /\bdo i have a (?:valid\s+)?(?:case|claim)\b/i,
  /\bwhat are my (?:legal\s+)?rights\b/i,
  /\bam i (?:legally\s+)?liable\b/i,
  /\bam i breaking the law\b/i,
  /\bshould i sign (?:this|the|my)\b/i,
  /\badvise me\b/i,
  /\badvice (?:on|for|about) my\b/i,
  /\bhelp me with my (?:case|claim|dispute|eviction|divorce|arrest)\b/i,
  /\bcan (?:my landlord|they|my employer) evict me\b/i,
  /\bcan my employer fire me\b/i,
  /\bshould i plead guilty\b/i,
  /\bhow much compensation (?:will|can) i get\b/i,
];

function checkSingleText(text: string): GuardrailResult {
  if (
    UK_POSTCODE_REGEX.test(text) ||
    EMAIL_REGEX.test(text) ||
    UK_PHONE_REGEX.test(text) ||
    NI_NUMBER_REGEX.test(text) ||
    CASE_NUMBER_REGEX.test(text) ||
    STREET_ADDRESS_REGEX.test(text)
  ) {
    return {
      ok: false,
      category: 'PII_DETECTED',
      title: 'Personal or Identifying Information Blocked',
      message:
        'Your message appears to contain a UK postcode, email address, phone number, National Insurance number, street address, or case reference number. For your privacy under UK GDPR, LexPlain UK blocks personal identifiers before any request reaches the AI model.',
      suggestion:
        'Remove all real-world identifiers and ask about the general legal principle instead (for example: "How does a fixed-term assured shorthold tenancy generally end?").',
    };
  }

  if (SELF_IDENTIFYING_PHRASES.some((pattern) => pattern.test(text))) {
    return {
      ok: false,
      category: 'SELF_IDENTIFYING',
      title: 'Real-World Identities Not Permitted',
      message:
        'LexPlain UK cannot process real names, employers, landlords, addresses, or personal situations. Your question was stopped locally and was not stored or sent to the AI.',
      suggestion:
        'Rephrase your question using abstract hypothetical labels such as "Party A", "Party B", or "Company X".',
    };
  }

  if (RESERVED_ACTIVITY_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      ok: false,
      category: 'RESERVED_ACTIVITY',
      title: 'Reserved Legal Documents Cannot Be Drafted or Reviewed',
      message:
        'Under the Legal Services Act 2007 and our Terms of Use, LexPlain UK strictly refuses requests to draft, edit, or review wills, deeds, court forms, particulars of claim, witness statements, probate documents, or formal legal letters.',
      suggestion:
        'You can ask a general statutory question instead, such as "What are the formal validity requirements for a will under section 9 of the Wills Act 1837?" For real documents, please consult a regulated solicitor via solicitors.lawsociety.org.uk.',
    };
  }

  if (PERSONAL_ADVICE_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      ok: false,
      category: 'PERSONAL_ADVICE',
      title: 'Personal Legal Advice Is Not Available',
      message:
        'LexPlain UK provides general public legal information for England & Wales only and cannot tell you what you should do, whether you will win a dispute, or what your personal legal rights or liabilities are.',
      suggestion:
        'Try rephrasing as a general legal question—for example: "What are a consumer\'s statutory rights if a faulty item breaks within 30 days?" For real disputes, contact Citizens Advice or a regulated solicitor.',
    };
  }

  return { ok: true };
}

export function validateLegalRequest(
  prompt: unknown,
  history?: unknown
): GuardrailResult {
  if (typeof prompt !== 'string') {
    return {
      ok: false,
      category: 'INVALID_INPUT',
      title: 'Invalid Question',
      message: 'Please enter a valid text question about the law of England and Wales.',
      suggestion:
        'Example: "What is the general legal test for negligence in England & Wales?"',
    };
  }

  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      category: 'INVALID_INPUT',
      title: 'Empty Question',
      message: 'Please enter a general legal concept or statute question to begin.',
      suggestion:
        'Example: "What are a consumer\'s statutory rights if a faulty item breaks within 30 days?"',
    };
  }

  if (trimmed.length > MAX_PROMPT_CHARS) {
    return {
      ok: false,
      category: 'INVALID_INPUT',
      title: 'Question Too Long',
      message: `Please keep questions under ${MAX_PROMPT_CHARS} characters so explanations stay clear and focused.`,
      suggestion: 'Summarise the core legal rule or statute you want explained in plain English.',
    };
  }

  const promptCheck = checkSingleText(trimmed);
  if (!promptCheck.ok) {
    return promptCheck;
  }

  if (Array.isArray(history)) {
    const recentHistory = history.slice(-MAX_HISTORY_TURNS);
    for (const item of recentHistory) {
      if (
        item &&
        typeof item === 'object' &&
        'role' in item &&
        'text' in item &&
        item.role === 'user' &&
        typeof item.text === 'string'
      ) {
        if (item.text.length > MAX_PROMPT_CHARS) {
          return {
            ok: false,
            category: 'INVALID_INPUT',
            title: 'Session Context Limit Exceeded',
            message: 'A previous message in this session exceeded the maximum character limit.',
            suggestion: 'Click "Clear Session" to start a fresh ephemeral session.',
          };
        }
        const historyCheck = checkSingleText(item.text);
        if (!historyCheck.ok) {
          return historyCheck;
        }
      }
    }
  }

  return { ok: true };
}
