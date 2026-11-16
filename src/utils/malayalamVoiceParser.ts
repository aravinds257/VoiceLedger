import type {
  Account,
  ExtractedVoiceDraft,
  GroupCategory,
  LanguageCode,
  Person,
  TransactionType,
} from '../types';
import { getTodayISO } from '../data/initialData';

const MALAYALAM_NUMBER_WORDS: Array<{ pattern: RegExp; value: number }> = [
  { pattern: /പതിനായിരം|pathinaayiram|ten thousand/i, value: 10000 },
  { pattern: /അയ്യായിരം|ayyaayiram|five thousand/i, value: 5000 },
  { pattern: /നാലായിരം|naalaayiram|four thousand/i, value: 4000 },
  { pattern: /മൂവായിരം|moovaayiram|three thousand/i, value: 3000 },
  { pattern: /രണ്ടായിരം|randaayiram|two thousand/i, value: 2000 },
  { pattern: /ആയിരത്തി അഞ്ഞൂറ്|ആയിരത്തിഅഞ്ഞൂറ്|aayirathi anjooru/i, value: 1500 },
  { pattern: /ആയിരം|ഒരായിരം|aayiram|thousand/i, value: 1000 },
  { pattern: /തൊള്ളായിരം|thollaayiram/i, value: 900 },
  { pattern: /എണ്ണൂറ്|എണ്ണൂറു|ennooru/i, value: 800 },
  { pattern: /എഴുന്നൂറ്|എഴുന്നൂറു|ezhunnooru/i, value: 700 },
  { pattern: /അറുന്നൂറ്|അറുന്നൂറു|arunnooru/i, value: 600 },
  { pattern: /അഞ്ഞൂറ്|അഞ്ഞൂറു|anjooru|five hundred/i, value: 500 },
  { pattern: /നാനൂറ്|നാനൂറു|naanooru|four hundred/i, value: 400 },
  { pattern: /മുന്നൂറ്|മുന്നൂറു|munnooru|three hundred/i, value: 300 },
  { pattern: /ഇരുന്നൂറ്റി അമ്പത്|irunnootti ambathu/i, value: 250 },
  { pattern: /ഇരുന്നൂറ്|ഇരുന്നൂറു|irunnooru|two hundred/i, value: 200 },
  { pattern: /നൂറ്റി അമ്പത്|nootti ambathu/i, value: 150 },
  { pattern: /നൂറ്|നൂറു|ഒരു നൂറ്|nooru|one hundred/i, value: 100 },
  { pattern: /തൊണ്ണൂറ്|thonnooru/i, value: 90 },
  { pattern: /എൺപത്|enpathu/i, value: 80 },
  { pattern: /എഴുപത്|ezhupathu/i, value: 70 },
  { pattern: /അറുപത്|arupathu/i, value: 60 },
  { pattern: /അമ്പത്|അൻപത്|ambathu|fifty/i, value: 50 },
  { pattern: /നാൽപ്പത്|naalppathu/i, value: 40 },
  { pattern: /മുപ്പത്|muppathu/i, value: 30 },
  { pattern: /ഇരുപത്|irupathu/i, value: 20 },
  { pattern: /പത്ത്|pathu/i, value: 10 },
];

export function extractAmountFromText(text: string): number | null {
  const normalized = text.replace(/,/g, '');

  // 1. Check explicit digits with optional ₹ / രൂപ / rs
  const digitMatches = normalized.match(/(?:₹|rs\.?|രൂപ|inr)?\s*(\d+(?:\.\d{1,2})?)\s*(?:രൂപ|രൂപാ|rupees|rs|₹)?/gi);
  if (digitMatches) {
    for (const raw of digitMatches) {
      const numMatch = raw.match(/\d+(?:\.\d{1,2})?/);
      if (numMatch) {
        const val = parseFloat(numMatch[0]);
        if (!Number.isNaN(val) && val > 0) {
          return val;
        }
      }
    }
  }

  // 2. Check Malayalam / Manglish spoken number words
  for (const item of MALAYALAM_NUMBER_WORDS) {
    if (item.pattern.test(normalized)) {
      return item.value;
    }
  }

  return null;
}

export function extractDateFromText(text: string): string {
  const lower = text.toLowerCase();
  if (/മിനിഞ്ഞാന്ന്|mininjaannu|day before yesterday/i.test(lower)) {
    return getTodayISO(-2);
  }
  if (/ഇന്നലെ|innale|yesterday|நேற்று|कल/i.test(lower)) {
    return getTodayISO(-1);
  }
  if (/നാളെ|naale|tomorrow/i.test(lower)) {
    return getTodayISO(1);
  }
  return getTodayISO(0);
}

export function extractTransactionType(text: string): TransactionType {
  const lower = text.toLowerCase();
  // Explicit credit / received keywords
  if (
    /കിട്ടി|ലഭിച്ചു|വാങ്ങി|വന്നു|വരവ്|തന്നു|അയച്ചു തന്നു|ഇട്ടു തന്നു|kitti|labhichu|vangi|thirichu thannu|received|got|credited|from|യിൽ നിന്ന്|ൽ നിന്ന്|ഇൽ നിന്ന്/i.test(
      lower
    )
  ) {
    return 'credit';
  }
  // Explicit debit / paid keywords
  if (
    /കൊടുത്തു|നൽകി|അയച്ചു|ചിലവ്|koduthu|nalki|ayachu|paid|gave|sent|debited/i.test(lower)
  ) {
    return 'debit';
  }
  // Default when user says "ചേർക്കുക" (add amount to person) -> credit/add entry
  return 'credit';
}

function stripMalayalamPersonSuffix(word: string): string {
  return word
    .replace(/(?:യിൽ നിന്ന്|ൽ നിന്ന്|ഇൽ നിന്ന്|യുടെ|ന്റെ|യ്ക്ക്|ക്ക്|യിന്|ന്|നു|ഇന്|ോട്|നോട്)$/u, '')
    .trim();
}

export function extractPersonFromText(
  text: string,
  people: Person[]
): {
  personName: string;
  personMalayalamName: string;
  matchedPersonId: string | null;
  isNewPerson: boolean;
} {
  const lower = text.toLowerCase();

  // 1. Check known people and their aliases
  for (const person of people) {
    if (
      lower.includes(person.name.toLowerCase()) ||
      text.includes(person.malayalamName) ||
      person.aliases.some((alias) => lower.includes(alias.toLowerCase()))
    ) {
      return {
        personName: person.name,
        personMalayalamName: person.malayalamName,
        matchedPersonId: person.id,
        isNewPerson: false,
      };
    }
  }

  // 2. Heuristic extraction for a newly spoken Malayalam name with dative/ablative case
  // e.g. "അനിലിന്", "മനോജിന്", "ദീപയ്ക്ക്", "വരുണിൽ നിന്ന്"
  const stopWords = new Set([
    'എസ്ബിഐ',
    'ജിപേ',
    'ക്യാഷ്',
    'ഫെഡറൽ',
    'ബാങ്ക്',
    'അക്കൗണ്ടിൽ',
    'അക്കൗണ്ട്',
    'ഗ്രൂപ്പിൽ',
    'ഇന്നലെ',
    'ഇന്ന്',
    'രൂപ',
    'വീട്',
    'പണി',
    'ചിട്ടി',
    'ഓണം',
    'കല്യാണം',
    'കടയിലെ',
    'വകയിൽ',
    'ഇനത്തിൽ',
  ]);

  // Check "X-ൽ നിന്ന്" or "X-ഇൽ നിന്ന്"
  const fromMatch = text.match(/([\u0D00-\u0D7F]{2,18}?)(?:യിൽ നിന്ന്|ൽ നിന്ന്|ഇൽ നിന്ന്)/u);
  if (fromMatch && fromMatch[1] && !stopWords.has(fromMatch[1])) {
    const cleanMal = stripMalayalamPersonSuffix(fromMatch[1]);
    if (cleanMal.length >= 2) {
      return {
        personName: cleanMal,
        personMalayalamName: cleanMal,
        matchedPersonId: null,
        isNewPerson: true,
      };
    }
  }

  // Check tokens ending in -ന് / -നു / -യ്ക്ക് / -ക്ക്
  const tokens = text.split(/\s+/);
  for (const rawToken of tokens) {
    const token = rawToken.replace(/[.,!?]/g, '');
    if (stopWords.has(token)) continue;

    if (/(?:യിന്|ന്|നു|യ്ക്ക്|ക്ക്)$/u.test(token)) {
      let stem = stripMalayalamPersonSuffix(token);
      // In Malayalam, stems ending in consonant + ിന് (e.g. അനിലിന് -> അനിൽ, മനോജിന് -> മനോജ്)
      if (stem.endsWith('ി') && stem.length > 2) {
        stem = `${stem.slice(0, -1)}ൽ`;
      }
      if (!stopWords.has(stem) && stem.length >= 2) {
        return {
          personName: stem,
          personMalayalamName: stem,
          matchedPersonId: null,
          isNewPerson: true,
        };
      }
    }
  }

  // English/Manglish fallback: "to <Name>" or "for <Name>" or "<Name>inu"
  const engMatch = text.match(/(?:to|for|from)\s+([A-Z][a-zA-Z]{2,15})/);
  if (engMatch && engMatch[1]) {
    return {
      personName: engMatch[1],
      personMalayalamName: engMatch[1],
      matchedPersonId: null,
      isNewPerson: true,
    };
  }

  const manglishMatch = text.match(/\b([A-Za-z]{3,14})(?:inu|kku|il ninnu)\b/i);
  if (manglishMatch && manglishMatch[1]) {
    const name =
      manglishMatch[1].charAt(0).toUpperCase() + manglishMatch[1].slice(1).toLowerCase();
    return {
      personName: name,
      personMalayalamName: name,
      matchedPersonId: null,
      isNewPerson: true,
    };
  }

  // Do not guess a default person when none was recognized in speech
  return {
    personName: '',
    personMalayalamName: '',
    matchedPersonId: null,
    isNewPerson: false,
  };
}

export function extractAccountFromText(
  text: string,
  accounts: Account[]
): {
  accountName: string;
  accountMalayalamName: string;
  matchedAccountId: string | null;
  isNewAccount: boolean;
} {
  const lower = text.toLowerCase();

  for (const acc of accounts) {
    if (
      lower.includes(acc.name.toLowerCase()) ||
      text.includes(acc.malayalamName) ||
      acc.aliases.some((alias) => lower.includes(alias.toLowerCase()))
    ) {
      return {
        accountName: acc.name,
        accountMalayalamName: acc.malayalamName,
        matchedAccountId: acc.id,
        isNewAccount: false,
      };
    }
  }

  // Detect new custom account before "അക്കൗണ്ടിൽ" or "ബാങ്കിൽ"
  const newAccMatch = text.match(/([\u0D00-\u0D7FA-Za-z]{2,16})\s+(?:ബാങ്ക്\s+)?(?:അക്കൗണ്ടിൽ|അക്കൗണ്ട്|account)/u);
  if (newAccMatch && newAccMatch[1]) {
    const candidate = newAccMatch[1].trim();
    if (!['എന്റെ', 'അവന്റെ', 'ഈ', 'ആ'].includes(candidate)) {
      return {
        accountName: `${candidate} Account`,
        accountMalayalamName: `${candidate} അക്കൗണ്ട്`,
        matchedAccountId: null,
        isNewAccount: true,
      };
    }
  }

  const defaultAcc = accounts[0];
  return {
    accountName: defaultAcc?.name || 'Cash Box',
    accountMalayalamName: defaultAcc?.malayalamName || 'ക്യാഷ്',
    matchedAccountId: defaultAcc?.id || null,
    isNewAccount: false,
  };
}

export function extractGroupFromText(
  text: string,
  groups: GroupCategory[]
): {
  groupName: string;
  groupMalayalamName: string;
  matchedGroupId: string | null;
  isSpecificGroup: boolean;
  isNewGroup: boolean;
} {
  const lower = text.toLowerCase();

  // 1. Check specific groups first
  for (const grp of groups.filter((g) => g.isSpecific)) {
    if (
      lower.includes(grp.name.toLowerCase()) ||
      text.includes(grp.malayalamName) ||
      grp.aliases.some((alias) => lower.includes(alias.toLowerCase()))
    ) {
      return {
        groupName: grp.name,
        groupMalayalamName: grp.malayalamName,
        matchedGroupId: grp.id,
        isSpecificGroup: true,
        isNewGroup: false,
      };
    }
  }

  // 2. Check if user explicitly said "<Custom Name> ഗ്രൂപ്പിൽ" / "<Custom Name> ഇനത്തിൽ" / "<Custom Name> വകയിൽ"
  const customGroupMal = text.match(
    /([\u0D00-\u0D7FA-Za-z0-9]{2,20})\s+(?:ഗ്രൂപ്പിൽ|ഗ്രൂപ്പ്|ഇനത്തിൽ|വകയിൽ|ആവശ്യത്തിന്)/u
  );
  if (customGroupMal && customGroupMal[1]) {
    const grpLabel = customGroupMal[1].trim();
    if (!['രൂപ', 'അക്കൗണ്ടിൽ', 'ബാങ്ക്'].includes(grpLabel)) {
      return {
        groupName: grpLabel,
        groupMalayalamName: `${grpLabel} ഗ്രൂപ്പ്`,
        matchedGroupId: null,
        isSpecificGroup: true,
        isNewGroup: true,
      };
    }
  }

  const customGroupEng = text.match(/(?:under|in|group)\s+([A-Za-z0-9 ]{2,20})\s+group/i);
  if (customGroupEng && customGroupEng[1]) {
    const grpLabel = customGroupEng[1].trim();
    return {
      groupName: grpLabel,
      groupMalayalamName: grpLabel,
      matchedGroupId: null,
      isSpecificGroup: true,
      isNewGroup: true,
    };
  }

  // Default to Daily General (per-day basis)
  const dailyGrp = groups.find((g) => !g.isSpecific) || groups[0];
  return {
    groupName: dailyGrp?.name || 'Daily General',
    groupMalayalamName: dailyGrp?.malayalamName || 'ദിവസേനയുള്ള കണക്ക്',
    matchedGroupId: dailyGrp?.id || 'grp-daily',
    isSpecificGroup: false,
    isNewGroup: false,
  };
}

export function buildSummaries(draft: {
  personMalayalamName: string;
  personName: string;
  accountMalayalamName: string;
  accountName: string;
  amount: number | null;
  type: TransactionType;
  date: string;
  groupMalayalamName: string;
  groupName: string;
  isSpecificGroup: boolean;
}): { malayalamSummary: string; englishSummary: string } {
  const amtText = draft.amount !== null ? `₹${draft.amount.toLocaleString('en-IN')}` : 'തുക വ്യക്തമല്ല';
  const actionMal = draft.type === 'credit' ? 'വരവ് (കിട്ടിയത് / ചേർത്തത്)' : 'ചിലവ് (കൊടുത്തത്)';
  const actionEng = draft.type === 'credit' ? 'Credit / Added for' : 'Debit / Paid to';
  const groupPartMal = draft.isSpecificGroup
    ? `'${draft.groupMalayalamName}' പ്രത്യേക ഗ്രൂപ്പിൽ`
    : 'ദിവസേനയുള്ള പൊതു കണക്കിൽ (Per-Day)';

  const malayalamSummary = `${draft.personMalayalamName} — ${draft.accountMalayalamName} വഴി ${amtText} രൂപ ${groupPartMal} ${actionMal} ആയി രേഖപ്പെടുത്തട്ടെ?`;
  const englishSummary = `${actionEng} ${draft.personName}: ${amtText} in ${draft.accountName} (${
    draft.isSpecificGroup ? `Specific Group: ${draft.groupName}` : `Daily Basis: ${draft.date}`
  })`;

  return { malayalamSummary, englishSummary };
}

export function parseMalayalamVoiceLocally(
  transcript: string,
  people: Person[],
  accounts: Account[],
  groups: GroupCategory[]
): ExtractedVoiceDraft {
  const cleanText = transcript.trim();
  const amount = extractAmountFromText(cleanText);
  const date = extractDateFromText(cleanText);
  const type = extractTransactionType(cleanText);
  const personInfo = extractPersonFromText(cleanText, people);
  const accountInfo = extractAccountFromText(cleanText, accounts);
  const groupInfo = extractGroupFromText(cleanText, groups);

  const summaries = buildSummaries({
    personMalayalamName: personInfo.personMalayalamName,
    personName: personInfo.personName,
    accountMalayalamName: accountInfo.accountMalayalamName,
    accountName: accountInfo.accountName,
    amount,
    type,
    date,
    groupMalayalamName: groupInfo.groupMalayalamName,
    groupName: groupInfo.groupName,
    isSpecificGroup: groupInfo.isSpecificGroup,
  });

  const confidence =
    amount !== null && (personInfo.matchedPersonId !== null || personInfo.isNewPerson)
      ? 0.94
      : amount !== null
      ? 0.78
      : 0.55;

  return {
    ...personInfo,
    ...accountInfo,
    ...groupInfo,
    amount,
    type,
    date,
    rawTranscript: cleanText,
    notes: cleanText,
    confidence,
    ...summaries,
    extractionSource: 'local-malayalam-nlp',
  };
}

export async function parseVoiceWithGemini(params: {
  apiKey: string;
  transcript?: string;
  audioBase64?: string;
  audioMimeType?: string;
  language: LanguageCode;
  people: Person[];
  accounts: Account[];
  groups: GroupCategory[];
}): Promise<ExtractedVoiceDraft> {
  const { apiKey, transcript, audioBase64, audioMimeType, people, accounts, groups } = params;
  const today = getTodayISO(0);
  const yesterday = getTodayISO(-1);

  const systemPrompt = `You are a Malayalam & Multilingual financial voice assistant.
Today's date is ${today} (yesterday was ${yesterday}).
Known People: ${JSON.stringify(people.map((p) => ({ id: p.id, name: p.name, malayalamName: p.malayalamName })))}
Known Accounts: ${JSON.stringify(accounts.map((a) => ({ id: a.id, name: a.name, malayalamName: a.malayalamName })))}
Known Groups: ${JSON.stringify(groups.map((g) => ({ id: g.id, name: g.name, malayalamName: g.malayalamName, isSpecific: g.isSpecific })))}

Extract the transaction from the user's spoken Malayalam (or Manglish/Indian language) utterance and return ONLY valid JSON with:
{
  "rawTranscript": "string (Malayalam transcript of what was spoken)",
  "personName": "string (English name)",
  "personMalayalamName": "string (Malayalam name)",
  "matchedPersonId": "string or null (id from Known People if matched)",
  "isNewPerson": boolean,
  "accountName": "string",
  "accountMalayalamName": "string",
  "matchedAccountId": "string or null (id from Known Accounts if matched)",
  "isNewAccount": boolean,
  "amount": number or null,
  "type": "credit" | "debit",
  "date": "YYYY-MM-DD",
  "groupName": "string (use 'Daily General' if no specific group/event was mentioned)",
  "groupMalayalamName": "string",
  "matchedGroupId": "string or null",
  "isSpecificGroup": boolean (true ONLY if user specified a group/project/purpose like House Work, Chit, Onam, Wedding, etc.),
  "isNewGroup": boolean,
  "notes": "string"
}`;

  const parts: Array<Record<string, unknown>> = [{ text: systemPrompt }];
  if (audioBase64 && audioMimeType) {
    parts.push({
      inlineData: {
        mimeType: audioMimeType,
        data: audioBase64,
      },
    });
  }
  if (transcript) {
    parts.push({ text: `Spoken text: "${transcript}"` });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Gemini API (${response.status}): ${errBody.slice(0, 180) || response.statusText}`);
  }

  const data = await response.json();
  let rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) {
    throw new Error('Empty response from Gemini API');
  }
  rawJson = rawJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  const parsed = JSON.parse(rawJson);
  const summaries = buildSummaries({
    personMalayalamName: parsed.personMalayalamName || parsed.personName || 'വ്യക്തി',
    personName: parsed.personName || 'Person',
    accountMalayalamName: parsed.accountMalayalamName || parsed.accountName || 'അക്കൗണ്ട്',
    accountName: parsed.accountName || 'Account',
    amount: typeof parsed.amount === 'number' ? parsed.amount : null,
    type: parsed.type === 'debit' ? 'debit' : 'credit',
    date: parsed.date || today,
    groupMalayalamName: parsed.groupMalayalamName || parsed.groupName || 'ദിവസേനയുള്ള കണക്ക്',
    groupName: parsed.groupName || 'Daily General',
    isSpecificGroup: Boolean(parsed.isSpecificGroup),
  });

  return {
    personName: parsed.personName || 'Unknown',
    personMalayalamName: parsed.personMalayalamName || parsed.personName || 'വ്യക്തി',
    matchedPersonId: parsed.matchedPersonId || null,
    isNewPerson: Boolean(parsed.isNewPerson),
    accountName: parsed.accountName || 'Cash Box',
    accountMalayalamName: parsed.accountMalayalamName || 'ക്യാഷ്',
    matchedAccountId: parsed.matchedAccountId || null,
    isNewAccount: Boolean(parsed.isNewAccount),
    amount: typeof parsed.amount === 'number' ? parsed.amount : null,
    type: parsed.type === 'debit' ? 'debit' : 'credit',
    date: parsed.date || today,
    groupName: parsed.groupName || 'Daily General',
    groupMalayalamName: parsed.groupMalayalamName || 'ദിവസേനയുള്ള കണക്ക്',
    matchedGroupId: parsed.matchedGroupId || (parsed.isSpecificGroup ? null : 'grp-daily'),
    isSpecificGroup: Boolean(parsed.isSpecificGroup),
    isNewGroup: Boolean(parsed.isNewGroup),
    rawTranscript: parsed.rawTranscript || transcript || '',
    notes: parsed.notes || parsed.rawTranscript || transcript || '',
    confidence: 0.97,
    ...summaries,
    extractionSource: 'gemini-ai',
  };
}
