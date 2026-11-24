export interface LegalTopicArea {
  id: string;
  label: string;
  keyStatutes: string;
}

export interface PublicExampleQuestion {
  id: string;
  topicId: string;
  topicLabel: string;
  statuteRef: string;
  question: string;
}

export interface OfficialResourceLink {
  label: string;
  domain: string;
  url: string;
  purpose: string;
}

export const LEGAL_TOPIC_AREAS: LegalTopicArea[] = [
  {
    id: 'all',
    label: 'All Topics',
    keyStatutes: 'General Law of England & Wales',
  },
  {
    id: 'consumer',
    label: 'Consumer & Contracts',
    keyStatutes: 'Consumer Rights Act 2015 · Misrepresentation Act 1967',
  },
  {
    id: 'housing',
    label: 'Housing & Tenancies',
    keyStatutes: 'Housing Act 1988 · Landlord and Tenant Act 1985',
  },
  {
    id: 'negligence',
    label: 'Negligence & Injury',
    keyStatutes: 'Occupiers’ Liability Acts 1957 & 1984 · Common Law',
  },
  {
    id: 'employment',
    label: 'Employment & Workplace',
    keyStatutes: 'Employment Rights Act 1996 · Equality Act 2010',
  },
  {
    id: 'public',
    label: 'Public & Civil Rights',
    keyStatutes: 'Human Rights Act 1998 · Data Protection Act 2018',
  },
];

export const PUBLIC_EXAMPLE_QUESTIONS: PublicExampleQuestion[] = [
  {
    id: 'consumer-30-days',
    topicId: 'consumer',
    topicLabel: 'Consumer & Contracts',
    statuteRef: 'Consumer Rights Act 2015',
    question:
      "What are a consumer's statutory rights if a faulty item breaks within 30 days?",
  },
  {
    id: 'negligence-test',
    topicId: 'negligence',
    topicLabel: 'Negligence & Injury',
    statuteRef: 'Duty · Breach · Causation · Remoteness',
    question:
      'What is the general legal test for negligence in England & Wales?',
  },
  {
    id: 'ast-ending',
    topicId: 'housing',
    topicLabel: 'Housing & Tenancies',
    statuteRef: 'Housing Act 1988',
    question:
      'How does a fixed-term assured shorthold tenancy generally end?',
  },
  {
    id: 'unfair-vs-wrongful',
    topicId: 'employment',
    topicLabel: 'Employment & Workplace',
    statuteRef: 'Employment Rights Act 1996',
    question:
      'What is the general difference between unfair dismissal and wrongful dismissal?',
  },
];

export const OFFICIAL_RESOURCES: OfficialResourceLink[] = [
  {
    label: 'legislation.gov.uk',
    domain: 'legislation.gov.uk',
    url: 'https://www.legislation.gov.uk',
    purpose: 'Official UK Acts & Statutory Instruments',
  },
  {
    label: 'judiciary.uk',
    domain: 'judiciary.uk',
    url: 'https://www.judiciary.uk',
    purpose: 'Courts & Tribunals Judiciary of England & Wales',
  },
  {
    label: 'citizensadvice.org.uk',
    domain: 'citizensadvice.org.uk',
    url: 'https://www.citizensadvice.org.uk',
    purpose: 'Free public guidance for real-world issues',
  },
  {
    label: 'solicitors.lawsociety.org.uk',
    domain: 'solicitors.lawsociety.org.uk',
    url: 'https://solicitors.lawsociety.org.uk',
    purpose: 'Find a qualified, SRA-regulated solicitor',
  },
];
