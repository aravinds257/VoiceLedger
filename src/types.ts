export type LanguageCode = 'ml-IN' | 'en-IN' | 'ta-IN' | 'hi-IN';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  exampleHint: string;
}

export type TransactionType = 'credit' | 'debit';

export interface Person {
  id: string;
  name: string;
  malayalamName: string;
  aliases: string[];
  roleOrNote?: string;
  avatarColor: string;
}

export interface Account {
  id: string;
  name: string;
  malayalamName: string;
  aliases: string[];
  type: 'cash' | 'upi' | 'bank' | 'ledger';
  color: string;
}

export interface GroupCategory {
  id: string;
  name: string;
  malayalamName: string;
  aliases: string[];
  isSpecific: boolean;
  color: string;
}

export interface TransactionEntry {
  id: string;
  personId: string;
  personName: string;
  personMalayalamName: string;
  accountId: string;
  accountName: string;
  accountMalayalamName: string;
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD for per-day segregation
  createdAt: string; // ISO string
  groupId: string;
  groupName: string;
  groupMalayalamName: string;
  isSpecificGroup: boolean;
  rawTranscript: string;
  notes: string;
  language: LanguageCode;
  extractionSource: 'gemini-ai' | 'local-malayalam-nlp' | 'manual';
}

export interface ExtractedVoiceDraft {
  personName: string;
  personMalayalamName: string;
  matchedPersonId: string | null;
  isNewPerson: boolean;
  accountName: string;
  accountMalayalamName: string;
  matchedAccountId: string | null;
  isNewAccount: boolean;
  amount: number | null;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  groupName: string;
  groupMalayalamName: string;
  matchedGroupId: string | null;
  isSpecificGroup: boolean;
  isNewGroup: boolean;
  rawTranscript: string;
  notes: string;
  confidence: number;
  malayalamSummary: string;
  englishSummary: string;
  extractionSource: 'gemini-ai' | 'local-malayalam-nlp' | 'manual';
  audioUrl?: string;
  transcriptionError?: string;
}

export interface SampleVoicePhrase {
  id: string;
  malayalamText: string;
  transliteration: string;
  englishMeaning: string;
  tag: string;
}
