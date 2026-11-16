import type { LanguageCode } from '../types';

export interface UIStrings {
  appTitle: string;
  appSubtitle: string;
  quickAdd: string;
  settings: string;
  todayIn: string;
  todayOut: string;
  specificGroupsTotal: string;
  languageLabel: string;
  geminiActive: string;
  aiSetup: string;
  voiceHeroTitle: string;
  voiceHeroSubtitle: string;
  tapMicToSpeak: string;
  listeningText: string;
  recordingAudioText: string;
  extractingText: string;
  typeCommandLabel: string;
  commandPlaceholder: string;
  verifyBtn: string;
  samplesHeading: string;
  tabDaily: string;
  tabGroups: string;
  tabPeople: string;
  tabAccounts: string;
  navDaily: string;
  navGroups: string;
  navPeople: string;
  navAccounts: string;
  searchPlaceholder: string;
  filterAll: string;
  filterDailyOnly: string;
  filterSpecificOnly: string;
  emptyLedger: string;
  todayLabel: string;
  yesterdayLabel: string;
  transactionsCount: string;
  groupsExplainer: string;
  specificGroupTag: string;
  dailyGeneralTag: string;
  addBtn: string;
  totalCredit: string;
  totalDebit: string;
  netBalance: string;
  countLabel: string;
  peopleInGroup: string;
  confirmTitle: string;
  youSaid: string;
  recordedVoice: string;
  listenBtn: string;
  readingBtn: string;
  amountLabel: string;
  amountHint: string;
  amountError: string;
  txTypeLabel: string;
  creditTitle: string;
  creditSub: string;
  debitTitle: string;
  debitSub: string;
  personLabel: string;
  addNewPersonOption: string;
  newPersonLabel: string;
  accountLabel: string;
  addNewAccountOption: string;
  newAccountLabel: string;
  segregationLabel: string;
  perDayTitle: string;
  perDaySub: string;
  specificGroupTitle: string;
  specificGroupSub: string;
  selectGroupLabel: string;
  addNewGroupOption: string;
  newGroupLabel: string;
  dateLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
  cancelBtn: string;
  confirmSaveBtn: string;
  settingsTitle: string;
  settingsDesc: string;
  apiKeyLabel: string;
  showKey: string;
  hideKey: string;
  exportBtn: string;
  resetBtn: string;
  closeBtn: string;
  saveSettingsBtn: string;
  savedToastPrefix: string;
  deletedToast: string;
  settingsSavedToast: string;
  demoRestoredToast: string;
}

const ML_STRINGS: UIStrings = {
  appTitle: 'ശബ്ദ കണക്ക്',
  appSubtitle: 'സംസാരിച്ച് കണക്കുകൾ എളുപ്പത്തിൽ രേഖപ്പെടുത്താം',
  quickAdd: 'ചേർക്കുക',
  settings: 'ക്രമീകരണങ്ങൾ',
  todayIn: 'ഇന്നത്തെ വരവ്',
  todayOut: 'ഇന്നത്തെ ചിലവ്',
  specificGroupsTotal: 'പ്രത്യേക ഗ്രൂപ്പുകൾ',
  languageLabel: 'ഭാഷ',
  geminiActive: 'Gemini AI സജീവം',
  aiSetup: 'AI ക്രമീകരണം',
  voiceHeroTitle: 'മലയാളത്തിൽ സംസാരിച്ച് കണക്ക് ചേർക്കുക',
  voiceHeroSubtitle: 'വ്യക്തിയുടെ പേര്, അക്കൗണ്ട്, തുക, ഗ്രൂപ്പ് എന്നിവ പറയുക — സേവ് ചെയ്യും മുമ്പ് ഉറപ്പുവരുത്താം.',
  tapMicToSpeak: 'മൈക്കിൽ തൊട്ട് സംസാരിക്കുക',
  listeningText: 'കേൾക്കുന്നു... സംസാരിക്കുക',
  recordingAudioText: 'റെക്കോർഡ് ചെയ്യുന്നു — കഴിയുമ്പോൾ നിർത്തുക',
  extractingText: 'വിവരങ്ങൾ വേർതിരിക്കുന്നു...',
  typeCommandLabel: 'അല്ലെങ്കിൽ വാചകം ഇവിടെ ടൈപ്പ് ചെയ്യുക:',
  commandPlaceholder: 'ഉദാ: രാഹുലിന് എസ്ബിഐ അക്കൗണ്ടിൽ 1500 രൂപ വീട് പണി ഗ്രൂപ്പിൽ കൊടുത്തു',
  verifyBtn: 'പരിശോധിക്കുക',
  samplesHeading: 'പരീക്ഷിക്കാൻ ഒരു വാചകത്തിൽ തൊടുക:',
  tabDaily: 'ദിവസേന',
  tabGroups: 'ഗ്രൂപ്പുകൾ',
  tabPeople: 'വ്യക്തികൾ',
  tabAccounts: 'അക്കൗണ്ടുകൾ',
  navDaily: 'ദിവസേന',
  navGroups: 'ഗ്രൂപ്പ്',
  navPeople: 'വ്യക്തി',
  navAccounts: 'അക്കൗണ്ട്',
  searchPlaceholder: 'വ്യക്തി, അക്കൗണ്ട്, അല്ലെങ്കിൽ ഗ്രൂപ്പ് തിരയുക...',
  filterAll: 'എല്ലാം',
  filterDailyOnly: 'പൊതുവായവ മാത്രം',
  filterSpecificOnly: 'പ്രത്യേക ഗ്രൂപ്പുകൾ മാത്രം',
  emptyLedger: 'ഈ വിഭാഗത്തിൽ കണക്കുകൾ ഒന്നും ചേർത്തിട്ടില്ല.',
  todayLabel: 'ഇന്ന്',
  yesterdayLabel: 'ഇന്നലെ',
  transactionsCount: 'ഇടപാടുകൾ',
  groupsExplainer: 'സംസാരിക്കുമ്പോൾ പ്രത്യേക ആവശ്യം പറഞ്ഞാൽ ആ തുകകൾ ഇവിടെ ഗ്രൂപ്പുകളായി വേർതിരിച്ചു കാണാം.',
  specificGroupTag: 'പ്രത്യേക ഗ്രൂപ്പ്',
  dailyGeneralTag: 'ദിവസേന പൊതുവായത്',
  addBtn: 'ചേർക്കുക',
  totalCredit: 'ആകെ വരവ്',
  totalDebit: 'ആകെ ചിലവ്',
  netBalance: 'ബാക്കി',
  countLabel: 'എണ്ണം',
  peopleInGroup: 'ഈ ഗ്രൂപ്പിലെ വ്യക്തികൾ:',
  confirmTitle: 'സേവ് ചെയ്യും മുമ്പ് ഉറപ്പുവരുത്തുക',
  youSaid: 'നിങ്ങൾ പറഞ്ഞത്:',
  recordedVoice: 'റെക്കോർഡ് ചെയ്ത ശബ്ദം:',
  listenBtn: 'കേൾക്കുക',
  readingBtn: 'വായിക്കുന്നു...',
  amountLabel: 'തുക (₹)',
  amountHint: 'ആവശ്യമെങ്കിൽ തുക ഇവിടെ തിരുത്താം',
  amountError: 'ദയവായി ശരിയായ തുക നൽകുക.',
  txTypeLabel: 'ഇടപാട് തരം',
  creditTitle: 'വരവ് / ചേർക്കുക',
  creditSub: 'തുക കിട്ടിയത് അല്ലെങ്കിൽ ചേർത്തത്',
  debitTitle: 'ചിലവ് / കൊടുത്തത്',
  debitSub: 'വ്യക്തിക്ക് പണം നൽകിയത്',
  personLabel: 'വ്യക്തി',
  addNewPersonOption: '+ പുതിയ വ്യക്തിയെ ചേർക്കുക',
  newPersonLabel: 'പുതിയ വ്യക്തിയുടെ പേര്',
  accountLabel: 'അക്കൗണ്ട്',
  addNewAccountOption: '+ പുതിയ അക്കൗണ്ട് ചേർക്കുക',
  newAccountLabel: 'പുതിയ അക്കൗണ്ട് പേര്',
  segregationLabel: 'തരംതിരിക്കൽ രീതി',
  perDayTitle: 'ദിവസേനയുള്ള കണക്ക്',
  perDaySub: 'സാധാരണ ദിവസേനയുള്ള വിഭാഗം',
  specificGroupTitle: 'പ്രത്യേക ഗ്രൂപ്പ്',
  specificGroupSub: 'വീട് പണി, ചിട്ടി, ഓണം മുതലായവ',
  selectGroupLabel: 'പ്രത്യേക ഗ്രൂപ്പ് തിരഞ്ഞെടുക്കുക',
  addNewGroupOption: '+ പുതിയ ഗ്രൂപ്പ് നിർമ്മിക്കുക',
  newGroupLabel: 'പുതിയ ഗ്രൂപ്പിന്റെ പേര്',
  dateLabel: 'തീയതി',
  notesLabel: 'കുറിപ്പ്',
  notesPlaceholder: 'വിവരണം...',
  cancelBtn: 'റദ്ദാക്കുക',
  confirmSaveBtn: 'ഉറപ്പിച്ചു സേവ് ചെയ്യുക',
  settingsTitle: 'ക്രമീകരണങ്ങൾ',
  settingsDesc: 'മലയാളം വോയ്സ് സംവിധാനം ഓഫ്‌ലൈനായി പ്രവർത്തിക്കും. കൂടുതൽ കൃത്യതയ്ക്കായി Gemini API Key ചേർക്കാം.',
  apiKeyLabel: 'Gemini API Key (ഐച്ഛികം)',
  showKey: 'കാണിക്കുക',
  hideKey: 'മറയ്ക്കുക',
  exportBtn: 'ബാക്കപ്പ് ഡൗൺലോഡ് ചെയ്യുക',
  resetBtn: 'ഡെമോ കണക്കുകൾ പുനഃസ്ഥാപിക്കുക',
  closeBtn: 'അടയ്ക്കുക',
  saveSettingsBtn: 'സേവ് ചെയ്യുക',
  savedToastPrefix: 'സേവ് ചെയ്തു:',
  deletedToast: 'കണക്ക് നീക്കം ചെയ്തു.',
  settingsSavedToast: 'ക്രമീകരണങ്ങൾ സേവ് ചെയ്തു.',
  demoRestoredToast: 'ഡെമോ കണക്കുകൾ പുനഃസ്ഥാപിച്ചു.',
};

const EN_STRINGS: UIStrings = {
  appTitle: 'Voice Ledger',
  appSubtitle: 'Speak to record person & account amounts',
  quickAdd: 'Add',
  settings: 'Settings',
  todayIn: 'Today In',
  todayOut: 'Today Out',
  specificGroupsTotal: 'Specific Groups',
  languageLabel: 'Language',
  geminiActive: 'Gemini AI Active',
  aiSetup: 'AI Setup',
  voiceHeroTitle: 'Speak to Add an Entry',
  voiceHeroSubtitle: 'Say the person, account, amount, and optional group — review and confirm before saving.',
  tapMicToSpeak: 'Tap Mic to Speak',
  listeningText: 'Listening... speak now',
  recordingAudioText: 'Recording — tap Stop when finished',
  extractingText: 'Extracting details...',
  typeCommandLabel: 'Or type your command below:',
  commandPlaceholder: 'e.g. Paid 1500 rupees to Rahul from SBI account under House Work group',
  verifyBtn: 'Verify',
  samplesHeading: 'Tap a sample phrase to try:',
  tabDaily: 'Per-Day',
  tabGroups: 'Groups',
  tabPeople: 'People',
  tabAccounts: 'Accounts',
  navDaily: 'Daily',
  navGroups: 'Groups',
  navPeople: 'People',
  navAccounts: 'Accounts',
  searchPlaceholder: 'Search person, account, or group...',
  filterAll: 'All',
  filterDailyOnly: 'Daily General Only',
  filterSpecificOnly: 'Specific Groups Only',
  emptyLedger: 'No entries found in this view.',
  todayLabel: 'Today',
  yesterdayLabel: 'Yesterday',
  transactionsCount: 'entries',
  groupsExplainer: 'Amounts spoken with a specific group or purpose are segregated here.',
  specificGroupTag: 'Specific Group',
  dailyGeneralTag: 'Daily General',
  addBtn: 'Add',
  totalCredit: 'Total Credit',
  totalDebit: 'Total Debit',
  netBalance: 'Net Balance',
  countLabel: 'Count',
  peopleInGroup: 'People in this group:',
  confirmTitle: 'Confirm Entry Before Saving',
  youSaid: 'You said:',
  recordedVoice: 'Recorded Voice:',
  listenBtn: 'Listen',
  readingBtn: 'Speaking...',
  amountLabel: 'Amount (₹)',
  amountHint: 'You can edit the amount if needed',
  amountError: 'Please enter a valid amount greater than 0.',
  txTypeLabel: 'Transaction Type',
  creditTitle: 'Credit / Add',
  creditSub: 'Money received or added',
  debitTitle: 'Debit / Paid',
  debitSub: 'Money paid to person',
  personLabel: 'Person',
  addNewPersonOption: '+ Add New Person',
  newPersonLabel: 'New Person Name',
  accountLabel: 'Account',
  addNewAccountOption: '+ Add New Account',
  newAccountLabel: 'New Account Name',
  segregationLabel: 'Segregation Mode',
  perDayTitle: 'Per-Day Basis',
  perDaySub: 'Standard daily general entry',
  specificGroupTitle: 'Specific Group',
  specificGroupSub: 'House work, chit, festival, etc.',
  selectGroupLabel: 'Select Specific Group',
  addNewGroupOption: '+ Create New Group',
  newGroupLabel: 'New Group Name',
  dateLabel: 'Date',
  notesLabel: 'Note',
  notesPlaceholder: 'Details...',
  cancelBtn: 'Cancel',
  confirmSaveBtn: 'Confirm & Save',
  settingsTitle: 'Settings',
  settingsDesc: 'Voice parsing works offline. Add a Gemini API Key for direct audio transcription.',
  apiKeyLabel: 'Gemini API Key (Optional)',
  showKey: 'Show',
  hideKey: 'Hide',
  exportBtn: 'Download JSON Backup',
  resetBtn: 'Restore Demo Data',
  closeBtn: 'Close',
  saveSettingsBtn: 'Save Settings',
  savedToastPrefix: 'Saved:',
  deletedToast: 'Entry deleted.',
  settingsSavedToast: 'Settings saved.',
  demoRestoredToast: 'Demo data restored.',
};

const TA_STRINGS: UIStrings = {
  ...EN_STRINGS,
  appTitle: 'குரல் கணக்கு',
  appSubtitle: 'பேசி கணக்குகளை எளிதாக சேர்க்கலாம்',
  quickAdd: 'சேர்',
  settings: 'அமைப்புகள்',
  todayIn: 'இன்றைய வரவு',
  todayOut: 'இன்றைய செலவு',
  specificGroupsTotal: 'சிறப்பு குழுக்கள்',
  languageLabel: 'மொழி',
  voiceHeroTitle: 'தமிழில் பேசி கணக்கை சேர்க்கவும்',
  voiceHeroSubtitle: 'நபர், கணக்கு, தொகை மற்றும் குழுவை கூறவும் — சேமிக்கும் முன் உறுதிப்படுத்தவும்.',
  tapMicToSpeak: 'பேச மைக்கை தட்டவும்',
  verifyBtn: 'சரிபார்',
  tabDaily: 'தினசரி',
  tabGroups: 'குழுக்கள்',
  tabPeople: 'நபர்கள்',
  tabAccounts: 'கணக்குகள்',
  navDaily: 'தினசரி',
  navGroups: 'குழுக்கள்',
  navPeople: 'நபர்கள்',
  navAccounts: 'கணக்கு',
  confirmTitle: 'சேமிக்கும் முன் உறுதிப்படுத்தவும்',
  cancelBtn: 'ரத்து செய்',
  confirmSaveBtn: 'உறுதிப்படுத்தி சேமி',
};

const HI_STRINGS: UIStrings = {
  ...EN_STRINGS,
  appTitle: 'वॉइस खाता',
  appSubtitle: 'बोलकर आसानी से हिसाब दर्ज करें',
  quickAdd: 'जोड़ें',
  settings: 'सेटिंग्स',
  todayIn: 'आज की आवक',
  todayOut: 'आज का खर्च',
  specificGroupsTotal: 'विशेष समूह',
  languageLabel: 'भाषा',
  voiceHeroTitle: 'बोलकर हिसाब जोड़ें',
  voiceHeroSubtitle: 'व्यक्ति, खाता, राशि और समूह बोलें — सेव करने से पहले पुष्टि करें।',
  tapMicToSpeak: 'बोलने के लिए माइक दबाएं',
  verifyBtn: 'जांचें',
  tabDaily: 'दैनिक',
  tabGroups: 'समूह',
  tabPeople: 'व्यक्ति',
  tabAccounts: 'खाते',
  navDaily: 'दैनिक',
  navGroups: 'समूह',
  navPeople: 'व्यक्ति',
  navAccounts: 'खाते',
  confirmTitle: 'सेव करने से पहले पुष्टि करें',
  cancelBtn: 'रद्द करें',
  confirmSaveBtn: 'पुष्टि करें और सेव करें',
};

export function getUIStrings(lang: LanguageCode): UIStrings {
  switch (lang) {
    case 'ml-IN':
      return ML_STRINGS;
    case 'ta-IN':
      return TA_STRINGS;
    case 'hi-IN':
      return HI_STRINGS;
    case 'en-IN':
    default:
      return EN_STRINGS;
  }
}

export function pickDisplayName(
  lang: LanguageCode,
  englishName: string,
  malayalamName?: string
): string {
  if (lang === 'ml-IN' && malayalamName) {
    return malayalamName;
  }
  return englishName;
}
