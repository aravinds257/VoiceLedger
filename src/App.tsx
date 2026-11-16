import React, { useEffect, useMemo, useState } from 'react';
import {
  Mic,
  Calendar,
  FolderKanban,
  Users,
  Landmark,
  Settings,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import type {
  Account,
  ExtractedVoiceDraft,
  GroupCategory,
  LanguageCode,
  Person,
  TransactionEntry,
} from './types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_GROUPS,
  INITIAL_PEOPLE,
  getInitialTransactions,
  getTodayISO,
} from './data/initialData';
import {
  buildSummaries,
  parseMalayalamVoiceLocally,
  parseVoiceWithGemini,
} from './utils/malayalamVoiceParser';
import { VoiceRecorderCard } from './components/VoiceRecorderCard';
import { ConfirmTransactionDialog } from './components/ConfirmTransactionDialog';
import {
  SegregatedLedgerView,
  type SegregationTab,
} from './components/SegregatedLedgerView';
import { SettingsDialog } from './components/SettingsDialog';
import { getUIStrings, pickDisplayName } from './i18n/translations';

const STORAGE_KEYS = {
  PEOPLE: 'mvl_people_v1',
  ACCOUNTS: 'mvl_accounts_v1',
  GROUPS: 'mvl_groups_v1',
  TRANSACTIONS: 'mvl_transactions_v1',
  GEMINI_KEY: 'mvl_gemini_api_key_v1',
  LANGUAGE: 'mvl_language_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(() =>
    loadFromStorage<LanguageCode>(STORAGE_KEYS.LANGUAGE, 'ml-IN')
  );
  const [people, setPeople] = useState<Person[]>(() =>
    loadFromStorage<Person[]>(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE)
  );
  const [accounts, setAccounts] = useState<Account[]>(() =>
    loadFromStorage<Account[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS)
  );
  const [groups, setGroups] = useState<GroupCategory[]>(() =>
    loadFromStorage<GroupCategory[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS)
  );
  const [transactions, setTransactions] = useState<TransactionEntry[]>(() =>
    loadFromStorage<TransactionEntry[]>(STORAGE_KEYS.TRANSACTIONS, getInitialTransactions())
  );
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() =>
    localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || ''
  );

  const [pendingDraft, setPendingDraft] = useState<ExtractedVoiceDraft | null>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false);
  const [activeSegTab, setActiveSegTab] = useState<SegregationTab>('per-day');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [toastBanner, setToastBanner] = useState<string>('');

  const strings = useMemo(() => getUIStrings(selectedLanguage), [selectedLanguage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, JSON.stringify(selectedLanguage));
    document.documentElement.lang = selectedLanguage.split('-')[0];
  }, [selectedLanguage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  const showToast = (msg: string) => {
    setToastBanner(msg);
    window.setTimeout(() => {
      setToastBanner((curr) => (curr === msg ? '' : curr));
    }, 4500);
  };

  // Helper to convert recorded audio Blob to base64 for Gemini Multimodal Audio
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  // Process spoken Malayalam / multilingual text or recorded audio Blob and open Confirmation Dialog
  const handleProcessSpokenText = async (
    spokenText: string,
    audioBlob?: Blob | null,
    speechErrorCode?: string
  ) => {
    setIsProcessingVoice(true);
    try {
      let draft: ExtractedVoiceDraft;
      if (geminiApiKey.trim()) {
        try {
          let audioBase64: string | undefined;
          let audioMimeType: string | undefined;
          if (audioBlob && audioBlob.size > 0) {
            audioBase64 = await blobToBase64(audioBlob);
            audioMimeType = (audioBlob.type || 'audio/webm').split(';')[0];
          }
          draft = await parseVoiceWithGemini({
            apiKey: geminiApiKey.trim(),
            transcript: spokenText || undefined,
            audioBase64,
            audioMimeType,
            language: selectedLanguage,
            people,
            accounts,
            groups,
          });
        } catch (err) {
          console.error('Gemini parsing failed, falling back to local parser:', err);
          draft = parseMalayalamVoiceLocally(
            spokenText,
            people,
            accounts,
            groups
          );
          draft.transcriptionError =
            err instanceof Error
              ? `Gemini AI Error: ${err.message}`
              : 'Gemini AI transcription failed.';
        }
      } else {
        draft = parseMalayalamVoiceLocally(spokenText, people, accounts, groups);
        if (!spokenText.trim() && audioBlob && audioBlob.size > 0) {
          const reason = speechErrorCode ? ` [${speechErrorCode}]` : '';
          draft.transcriptionError =
            selectedLanguage === 'ml-IN'
              ? `ഈ ബ്രൗസറിൽ വോയ്സ് ട്രാൻസ്ക്രിപ്ഷൻ ലഭ്യമല്ല${reason}. ഓഡിയോ കേട്ട് വിവരങ്ങൾ നൽകുക, അല്ലെങ്കിൽ Chrome ഉപയോഗിക്കുക / Gemini API Key ചേർക്കുക.`
              : `Browser speech-to-text failed${reason}. Listen to your recording below, use Google Chrome on localhost, or add a Gemini API Key in Settings.`;
        }
      }
      if (audioBlob && audioBlob.size > 0) {
        draft.audioUrl = URL.createObjectURL(audioBlob);
      }
      setPendingDraft(draft);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Open manual/preset entry inside the same Confirmation Dialog
  const handleQuickAddPreset = (preset?: {
    personId?: string;
    accountId?: string;
    groupId?: string;
    isSpecificGroup?: boolean;
  }) => {
    const person =
      people.find((p) => p.id === preset?.personId) || people[0];
    const account =
      accounts.find((a) => a.id === preset?.accountId) || accounts[0];
    const group =
      groups.find((g) => g.id === preset?.groupId) ||
      (preset?.isSpecificGroup ? groups.find((g) => g.isSpecific) : groups[0]) ||
      groups[0];
    const isSpec = preset?.isSpecificGroup ?? group.isSpecific;
    const today = getTodayISO(0);

    const summaries = buildSummaries({
      personMalayalamName: person.malayalamName,
      personName: person.name,
      accountMalayalamName: account.malayalamName,
      accountName: account.name,
      amount: 500,
      type: 'credit',
      date: today,
      groupMalayalamName: group.malayalamName,
      groupName: group.name,
      isSpecificGroup: isSpec,
    });

    setPendingDraft({
      personName: person.name,
      personMalayalamName: person.malayalamName,
      matchedPersonId: person.id,
      isNewPerson: false,
      accountName: account.name,
      accountMalayalamName: account.malayalamName,
      matchedAccountId: account.id,
      isNewAccount: false,
      amount: 500,
      type: 'credit',
      date: today,
      groupName: group.name,
      groupMalayalamName: group.malayalamName,
      matchedGroupId: group.id,
      isSpecificGroup: isSpec,
      isNewGroup: false,
      rawTranscript: '',
      notes: '',
      confidence: 1,
      ...summaries,
      extractionSource: 'manual',
    });
  };

  // Store transaction ONLY after user confirms in the Confirmation Modal
  const handleConfirmDraft = (confirmed: ExtractedVoiceDraft) => {
    let finalPersonId = confirmed.matchedPersonId;
    let finalPersonName = confirmed.personName;
    let finalPersonMalName = confirmed.personMalayalamName;

    if (confirmed.isNewPerson || !finalPersonId) {
      const newPerson: Person = {
        id: `person-${Date.now()}`,
        name: confirmed.personName,
        malayalamName: confirmed.personMalayalamName || confirmed.personName,
        aliases: [confirmed.personName.toLowerCase(), confirmed.personMalayalamName],
        roleOrNote: 'ശബ്ദത്തിലൂടെ ചേർത്ത വ്യക്തി (Added via Voice)',
        avatarColor: '#0d9488',
      };
      setPeople((prev) => [...prev, newPerson]);
      finalPersonId = newPerson.id;
      finalPersonName = newPerson.name;
      finalPersonMalName = newPerson.malayalamName;
    }

    let finalAccountId = confirmed.matchedAccountId;
    let finalAccountName = confirmed.accountName;
    let finalAccountMalName = confirmed.accountMalayalamName;

    if (confirmed.isNewAccount || !finalAccountId) {
      const newAcc: Account = {
        id: `acc-${Date.now()}`,
        name: confirmed.accountName,
        malayalamName: confirmed.accountMalayalamName || confirmed.accountName,
        aliases: [confirmed.accountName.toLowerCase(), confirmed.accountMalayalamName],
        type: 'bank',
        color: '#2563eb',
      };
      setAccounts((prev) => [...prev, newAcc]);
      finalAccountId = newAcc.id;
      finalAccountName = newAcc.name;
      finalAccountMalName = newAcc.malayalamName;
    }

    let finalGroupId = confirmed.matchedGroupId || 'grp-daily';
    let finalGroupName = confirmed.groupName;
    let finalGroupMalName = confirmed.groupMalayalamName;

    if (confirmed.isSpecificGroup && (confirmed.isNewGroup || !confirmed.matchedGroupId)) {
      const newGrp: GroupCategory = {
        id: `grp-${Date.now()}`,
        name: confirmed.groupName,
        malayalamName: confirmed.groupMalayalamName || confirmed.groupName,
        aliases: [confirmed.groupName.toLowerCase(), confirmed.groupMalayalamName],
        isSpecific: true,
        color: '#d97706',
      };
      setGroups((prev) => [...prev, newGrp]);
      finalGroupId = newGrp.id;
      finalGroupName = newGrp.name;
      finalGroupMalName = newGrp.malayalamName;
    }

    const newTx: TransactionEntry = {
      id: `tx-${Date.now()}`,
      personId: finalPersonId,
      personName: finalPersonName,
      personMalayalamName: finalPersonMalName,
      accountId: finalAccountId,
      accountName: finalAccountName,
      accountMalayalamName: finalAccountMalName,
      amount: confirmed.amount || 0,
      type: confirmed.type,
      date: confirmed.date,
      createdAt: new Date().toISOString(),
      groupId: finalGroupId,
      groupName: finalGroupName,
      groupMalayalamName: finalGroupMalName,
      isSpecificGroup: confirmed.isSpecificGroup,
      rawTranscript: confirmed.rawTranscript,
      notes: confirmed.notes,
      language: selectedLanguage,
      extractionSource: confirmed.extractionSource,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setPendingDraft(null);

    const displayPerson = pickDisplayName(
      selectedLanguage,
      finalPersonName,
      finalPersonMalName
    );
    const displaySub = confirmed.isSpecificGroup
      ? pickDisplayName(selectedLanguage, finalGroupName, finalGroupMalName)
      : pickDisplayName(selectedLanguage, finalAccountName, finalAccountMalName);

    showToast(
      `${strings.savedToastPrefix} ₹${newTx.amount.toLocaleString(
        'en-IN'
      )} — ${displayPerson} (${displaySub})`
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast(strings.deletedToast);
  };

  const handleExportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      people,
      accounts,
      groups,
      transactions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malayalam-voice-ledger-${getTodayISO(0)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetDemoData = () => {
    setPeople(INITIAL_PEOPLE);
    setAccounts(INITIAL_ACCOUNTS);
    setGroups(INITIAL_GROUPS);
    setTransactions(getInitialTransactions());
    setIsSettingsOpen(false);
    showToast(strings.demoRestoredToast);
  };

  const stats = useMemo(() => {
    const today = getTodayISO(0);
    const todayEntries = transactions.filter((t) => t.date === today);
    const todayCredit = todayEntries
      .filter((t) => t.type === 'credit')
      .reduce((s, t) => s + t.amount, 0);
    const todayDebit = todayEntries
      .filter((t) => t.type === 'debit')
      .reduce((s, t) => s + t.amount, 0);
    const specificGroupTotal = transactions
      .filter((t) => t.isSpecificGroup)
      .reduce((s, t) => s + t.amount, 0);

    return {
      todayCredit,
      todayDebit,
      specificGroupTotal,
      totalTransactions: transactions.length,
    };
  }, [transactions]);

  return (
    <div className="mobile-app-shell">
      {/* Top App Bar */}
      <header className="app-topbar">
        <div className="brand-block">
          <div className="brand-logo" aria-hidden="true">
            <Mic size={20} />
          </div>
          <div>
            <h1 className="app-title">{strings.appTitle}</h1>
            <p className="app-subtitle">{strings.appSubtitle}</p>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="icon-action-btn"
            onClick={() => handleQuickAddPreset()}
            aria-label={strings.quickAdd}
          >
            <Plus size={18} />
            <span className="hide-xs">{strings.quickAdd}</span>
          </button>
          <button
            type="button"
            className="icon-action-btn"
            onClick={() => setIsSettingsOpen(true)}
            aria-label={strings.settings}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toastBanner && (
        <div className="toast-banner" role="status" aria-live="polite">
          <CheckCircle2 size={18} />
          <span>{toastBanner}</span>
        </div>
      )}

      <main className="app-main-content">
        {/* KPI Strip */}
        <section className="kpi-grid" aria-label={strings.todayIn}>
          <div className="kpi-card credit-kpi">
            <span className="kpi-label">{strings.todayIn}</span>
            <strong className="kpi-value">+₹{stats.todayCredit.toLocaleString('en-IN')}</strong>
          </div>
          <div className="kpi-card debit-kpi">
            <span className="kpi-label">{strings.todayOut}</span>
            <strong className="kpi-value">-₹{stats.todayDebit.toLocaleString('en-IN')}</strong>
          </div>
          <div className="kpi-card group-kpi">
            <span className="kpi-label">{strings.specificGroupsTotal}</span>
            <strong className="kpi-value">₹{stats.specificGroupTotal.toLocaleString('en-IN')}</strong>
          </div>
        </section>

        {/* Primary Voice Recording & Extraction Card */}
        <VoiceRecorderCard
          selectedLanguage={selectedLanguage}
          strings={strings}
          onLanguageChange={setSelectedLanguage}
          onProcessSpokenText={handleProcessSpokenText}
          isProcessing={isProcessingVoice}
          hasGeminiKey={Boolean(geminiApiKey.trim())}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Segregated Ledger */}
        <SegregatedLedgerView
          selectedLanguage={selectedLanguage}
          strings={strings}
          transactions={transactions}
          people={people}
          accounts={accounts}
          groups={groups}
          activeTab={activeSegTab}
          onTabChange={setActiveSegTab}
          onDeleteTransaction={handleDeleteTransaction}
          onQuickAddForEntity={handleQuickAddPreset}
        />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Navigation">
        <button
          type="button"
          className={`bottom-nav-item ${activeSegTab === 'per-day' ? 'active' : ''}`}
          onClick={() => setActiveSegTab('per-day')}
        >
          <Calendar size={20} />
          <span>{strings.navDaily}</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${activeSegTab === 'specific-groups' ? 'active' : ''}`}
          onClick={() => setActiveSegTab('specific-groups')}
        >
          <FolderKanban size={20} />
          <span>{strings.navGroups}</span>
        </button>

        <button
          type="button"
          className="bottom-nav-fab"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label={strings.tapMicToSpeak}
        >
          <Mic size={22} />
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${activeSegTab === 'people' ? 'active' : ''}`}
          onClick={() => setActiveSegTab('people')}
        >
          <Users size={20} />
          <span>{strings.navPeople}</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${activeSegTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveSegTab('accounts')}
        >
          <Landmark size={20} />
          <span>{strings.navAccounts}</span>
        </button>
      </nav>

      {/* Mandatory Confirmation Dialog Before Storing */}
      <ConfirmTransactionDialog
        draft={pendingDraft}
        selectedLanguage={selectedLanguage}
        strings={strings}
        people={people}
        accounts={accounts}
        groups={groups}
        onConfirm={(confirmed) => {
          if (pendingDraft?.audioUrl) {
            URL.revokeObjectURL(pendingDraft.audioUrl);
          }
          handleConfirmDraft(confirmed);
        }}
        onCancel={() => {
          if (pendingDraft?.audioUrl) {
            URL.revokeObjectURL(pendingDraft.audioUrl);
          }
          setPendingDraft(null);
        }}
      />

      {/* Settings & Backup Modal */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        strings={strings}
        geminiApiKey={geminiApiKey}
        onSaveApiKey={(key) => {
          setGeminiApiKey(key);
          localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, key);
          showToast(strings.settingsSavedToast);
        }}
        onExportData={handleExportData}
        onResetDemoData={handleResetDemoData}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
