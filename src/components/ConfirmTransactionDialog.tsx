import React, { useEffect, useId, useRef, useState } from 'react';
import {
  CheckCircle2,
  Volume2,
  Sparkles,
  UserPlus,
  Landmark,
  FolderPlus,
  AlertCircle,
  Calendar,
  Tag,
} from 'lucide-react';
import type {
  Account,
  ExtractedVoiceDraft,
  GroupCategory,
  LanguageCode,
  Person,
  TransactionType,
} from '../types';
import { buildSummaries } from '../utils/malayalamVoiceParser';
import { pickDisplayName, type UIStrings } from '../i18n/translations';

interface ConfirmTransactionDialogProps {
  draft: ExtractedVoiceDraft | null;
  selectedLanguage: LanguageCode;
  strings: UIStrings;
  people: Person[];
  accounts: Account[];
  groups: GroupCategory[];
  onConfirm: (confirmedDraft: ExtractedVoiceDraft) => void;
  onCancel: () => void;
}

export const ConfirmTransactionDialog: React.FC<ConfirmTransactionDialogProps> = ({
  draft,
  selectedLanguage,
  strings,
  people,
  accounts,
  groups,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const baseId = useId();

  const [personSelectId, setPersonSelectId] = useState<string>('');
  const [customPersonName, setCustomPersonName] = useState<string>('');
  const [accountSelectId, setAccountSelectId] = useState<string>('');
  const [customAccountName, setCustomAccountName] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [amountError, setAmountError] = useState<string>('');
  const [txType, setTxType] = useState<TransactionType>('credit');
  const [txDate, setTxDate] = useState<string>('');
  const [isSpecificGroup, setIsSpecificGroup] = useState<boolean>(false);
  const [groupSelectId, setGroupSelectId] = useState<string>('');
  const [customGroupName, setCustomGroupName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Sync local form state when a new voice draft arrives
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (draft) {
      if (draft.isNewPerson) {
        setPersonSelectId('__new__');
        setCustomPersonName(draft.personMalayalamName || draft.personName || '');
      } else if (draft.matchedPersonId) {
        setPersonSelectId(draft.matchedPersonId);
        setCustomPersonName('');
      } else {
        setPersonSelectId('');
        setCustomPersonName('');
      }

      if (draft.isNewAccount || !draft.matchedAccountId) {
        setAccountSelectId('__new__');
        setCustomAccountName(draft.accountMalayalamName || draft.accountName || '');
      } else {
        setAccountSelectId(draft.matchedAccountId);
        setCustomAccountName('');
      }

      setAmountStr(draft.amount !== null ? String(draft.amount) : '');
      setAmountError('');
      setTxType(draft.type);
      setTxDate(draft.date);
      setIsSpecificGroup(draft.isSpecificGroup);

      if (draft.isSpecificGroup) {
        if (draft.isNewGroup || !draft.matchedGroupId) {
          setGroupSelectId('__new__');
          setCustomGroupName(draft.groupMalayalamName || draft.groupName || '');
        } else {
          setGroupSelectId(draft.matchedGroupId);
          setCustomGroupName('');
        }
      } else {
        setGroupSelectId('grp-daily');
        setCustomGroupName('');
      }

      setNotes(draft.notes || draft.rawTranscript || '');

      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [draft]);

  // Native <dialog> close event handler that resets returnValue to prevent stale leaks
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      const outcome = dialog.returnValue;
      dialog.returnValue = '';
      if (outcome !== 'confirmed') {
        onCancel();
      }
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onCancel]);

  if (!draft) {
    return <dialog ref={dialogRef} aria-labelledby={`${baseId}-title`} className="confirm-dialog" />;
  }

  const resolvedPerson =
    personSelectId === '__new__'
      ? {
          id: null,
          name: customPersonName.trim() || 'New Person',
          malayalamName: customPersonName.trim() || 'പുതിയ വ്യക്തി',
          isNew: true,
        }
      : (() => {
          const found = people.find((p) => p.id === personSelectId);
          return {
            id: found?.id || null,
            name: found?.name || '...',
            malayalamName: found?.malayalamName || '...',
            isNew: false,
          };
        })();

  const resolvedAccount =
    accountSelectId === '__new__'
      ? {
          id: null,
          name: customAccountName.trim() || 'New Account',
          malayalamName: customAccountName.trim() || 'പുതിയ അക്കൗണ്ട്',
          isNew: true,
        }
      : (() => {
          const found = accounts.find((a) => a.id === accountSelectId) || accounts[0];
          return {
            id: found?.id || null,
            name: found?.name || 'Account',
            malayalamName: found?.malayalamName || 'അക്കൗണ്ട്',
            isNew: false,
          };
        })();

  const specificGroups = groups.filter((g) => g.isSpecific);
  const resolvedGroup = !isSpecificGroup
    ? {
        id: 'grp-daily',
        name: 'Daily General',
        malayalamName: 'ദിവസേനയുള്ള കണക്ക് (പൊതുവായത്)',
        isNew: false,
      }
    : groupSelectId === '__new__'
    ? {
        id: null,
        name: customGroupName.trim() || 'Custom Group',
        malayalamName: customGroupName.trim() || 'പ്രത്യേക ഗ്രൂപ്പ്',
        isNew: true,
      }
    : (() => {
        const found = specificGroups.find((g) => g.id === groupSelectId) || specificGroups[0];
        return {
          id: found?.id || null,
          name: found?.name || 'Specific Group',
          malayalamName: found?.malayalamName || 'പ്രത്യേക ഗ്രൂപ്പ്',
          isNew: false,
        };
      })();

  const numericAmount = parseFloat(amountStr.replace(/,/g, ''));
  const validAmount = !Number.isNaN(numericAmount) && numericAmount > 0 ? numericAmount : null;

  const liveSummaries = buildSummaries({
    personMalayalamName: resolvedPerson.malayalamName,
    personName: resolvedPerson.name,
    accountMalayalamName: resolvedAccount.malayalamName,
    accountName: resolvedAccount.name,
    amount: validAmount,
    type: txType,
    date: txDate,
    groupMalayalamName: resolvedGroup.malayalamName,
    groupName: resolvedGroup.name,
    isSpecificGroup,
  });

  const validateAmountField = (val: string): boolean => {
    const parsed = parseFloat(val.replace(/,/g, ''));
    if (!val.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setAmountError(strings.amountError);
      return false;
    }
    setAmountError('');
    return true;
  };

  const handleSpeakConfirmation = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const textToSpeak =
      selectedLanguage === 'ml-IN'
        ? liveSummaries.malayalamSummary
        : liveSummaries.englishSummary;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = selectedLanguage;
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateAmountField(amountStr)) {
      amountInputRef.current?.focus();
      return;
    }
    if (!personSelectId) {
      const personEl = document.getElementById(`${baseId}-person`);
      personEl?.focus();
      return;
    }

    const updatedDraft: ExtractedVoiceDraft = {
      ...draft,
      personName: resolvedPerson.name,
      personMalayalamName: resolvedPerson.malayalamName,
      matchedPersonId: resolvedPerson.id,
      isNewPerson: resolvedPerson.isNew,
      accountName: resolvedAccount.name,
      accountMalayalamName: resolvedAccount.malayalamName,
      matchedAccountId: resolvedAccount.id,
      isNewAccount: resolvedAccount.isNew,
      amount: validAmount,
      type: txType,
      date: txDate,
      groupName: resolvedGroup.name,
      groupMalayalamName: resolvedGroup.malayalamName,
      matchedGroupId: resolvedGroup.id,
      isSpecificGroup,
      isNewGroup: resolvedGroup.isNew,
      notes: notes.trim() || draft.rawTranscript,
      malayalamSummary: liveSummaries.malayalamSummary,
      englishSummary: liveSummaries.englishSummary,
    };

    const dialog = dialogRef.current;
    if (dialog) {
      dialog.returnValue = 'confirmed';
      dialog.close('confirmed');
    }
    onConfirm(updatedDraft);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${baseId}-title`}
      className="confirm-dialog"
      {...({ closedby: 'closerequest' } as Record<string, unknown>)}
    >
      <div className="confirm-dialog-inner">
        <header className="confirm-dialog-header">
          <div className="confirm-badge-row">
            <span className="source-pill">
              <Sparkles size={14} />
              {draft.extractionSource === 'gemini-ai'
                ? 'Gemini AI Extracted'
                : 'Malayalam Voice NLP'}
            </span>
            <button
              type="button"
              className="tts-btn"
              onClick={handleSpeakConfirmation}
              aria-label={strings.listenBtn}
            >
              <Volume2 size={16} />
              <span>{isSpeaking ? strings.readingBtn : strings.listenBtn}</span>
            </button>
          </div>
          <h2 id={`${baseId}-title`} className="confirm-dialog-title">
            {strings.confirmTitle}
          </h2>
          {draft.rawTranscript && (
            <div className="spoken-quote" aria-label={strings.youSaid}>
              <span className="spoken-quote-label">{strings.youSaid}</span>
              <p className="spoken-quote-text">“{draft.rawTranscript}”</p>
            </div>
          )}
          {draft.transcriptionError && (
            <div className="voice-status-notice" role="alert">
              {draft.transcriptionError}
            </div>
          )}
          {draft.audioUrl && (
            <div className="recorded-audio-review">
              <span className="spoken-quote-label">{strings.recordedVoice}</span>
              <audio controls src={draft.audioUrl} className="recorded-audio-player" />
            </div>
          )}
        </header>

        <div className="summary-preview-card" role="status" aria-live="polite">
          <p className="summary-mal">
            {selectedLanguage === 'ml-IN'
              ? liveSummaries.malayalamSummary
              : liveSummaries.englishSummary}
          </p>
        </div>

        <form className="confirm-form" onSubmit={handleSubmit} noValidate>
          {/* Amount Field */}
          <div className="form-group">
            <label htmlFor={`${baseId}-amount`} className="form-label">
              {strings.amountLabel} <span aria-hidden="true">*</span>
            </label>
            <input
              ref={amountInputRef}
              id={`${baseId}-amount`}
              name="amount"
              type="text"
              inputMode="decimal"
              enterKeyHint="next"
              required
              autoFocus
              value={amountStr}
              aria-invalid={amountError ? 'true' : 'false'}
              aria-describedby={amountError ? `${baseId}-amount-err` : `${baseId}-amount-hint`}
              onChange={(e) => {
                setAmountStr(e.target.value);
                if (amountError) setAmountError('');
              }}
              onBlur={(e) => {
                if (e.target.value !== String(draft.amount ?? '')) {
                  validateAmountField(e.target.value);
                }
              }}
              placeholder="0"
              className="form-input amount-highlight-input"
            />
            {amountError ? (
              <span id={`${baseId}-amount-err`} className="field-error" role="alert">
                <AlertCircle size={15} /> {amountError}
              </span>
            ) : (
              <span id={`${baseId}-amount-hint`} className="field-hint">
                {strings.amountHint}
              </span>
            )}
          </div>

          {/* Transaction Type Radio Group */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">{strings.txTypeLabel}</legend>
            <div className="radio-cards-row">
              <div className={`radio-card ${txType === 'credit' ? 'active-credit' : ''}`}>
                <input
                  type="radio"
                  id={`${baseId}-type-credit`}
                  name="txType"
                  value="credit"
                  checked={txType === 'credit'}
                  onChange={() => setTxType('credit')}
                />
                <label htmlFor={`${baseId}-type-credit`}>
                  <span className="radio-title">{strings.creditTitle}</span>
                  <span className="radio-sub">{strings.creditSub}</span>
                </label>
              </div>

              <div className={`radio-card ${txType === 'debit' ? 'active-debit' : ''}`}>
                <input
                  type="radio"
                  id={`${baseId}-type-debit`}
                  name="txType"
                  value="debit"
                  checked={txType === 'debit'}
                  onChange={() => setTxType('debit')}
                />
                <label htmlFor={`${baseId}-type-debit`}>
                  <span className="radio-title">{strings.debitTitle}</span>
                  <span className="radio-sub">{strings.debitSub}</span>
                </label>
              </div>
            </div>
          </fieldset>

          {/* Person Selection */}
          <div className="form-group">
            <label htmlFor={`${baseId}-person`} className="form-label">
              {strings.personLabel} <span aria-hidden="true">*</span>
            </label>
            <select
              id={`${baseId}-person`}
              name="personId"
              required
              value={personSelectId}
              onChange={(e) => setPersonSelectId(e.target.value)}
              className="form-select"
            >
              <option value="" disabled>
                -- {strings.personLabel} --
              </option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {pickDisplayName(selectedLanguage, p.name, p.malayalamName)}
                </option>
              ))}
              <option value="__new__">{strings.addNewPersonOption}</option>
            </select>

            {personSelectId === '__new__' && (
              <div className="nested-new-field">
                <label htmlFor={`${baseId}-new-person`} className="form-label">
                  <UserPlus size={15} /> {strings.newPersonLabel}
                </label>
                <input
                  id={`${baseId}-new-person`}
                  name="customPersonName"
                  type="text"
                  required
                  value={customPersonName}
                  onChange={(e) => setCustomPersonName(e.target.value)}
                  className="form-input"
                />
              </div>
            )}
          </div>

          {/* Account Selection */}
          <div className="form-group">
            <label htmlFor={`${baseId}-account`} className="form-label">
              {strings.accountLabel} <span aria-hidden="true">*</span>
            </label>
            <select
              id={`${baseId}-account`}
              name="accountId"
              value={accountSelectId}
              onChange={(e) => setAccountSelectId(e.target.value)}
              className="form-select"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {pickDisplayName(selectedLanguage, acc.name, acc.malayalamName)}
                </option>
              ))}
              <option value="__new__">{strings.addNewAccountOption}</option>
            </select>

            {accountSelectId === '__new__' && (
              <div className="nested-new-field">
                <label htmlFor={`${baseId}-new-account`} className="form-label">
                  <Landmark size={15} /> {strings.newAccountLabel}
                </label>
                <input
                  id={`${baseId}-new-account`}
                  name="customAccountName"
                  type="text"
                  required
                  value={customAccountName}
                  onChange={(e) => setCustomAccountName(e.target.value)}
                  className="form-input"
                />
              </div>
            )}
          </div>

          {/* Segregation Mode */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">{strings.segregationLabel}</legend>
            <div className="radio-cards-row">
              <div className={`radio-card ${!isSpecificGroup ? 'active-mode' : ''}`}>
                <input
                  type="radio"
                  id={`${baseId}-seg-daily`}
                  name="segregationMode"
                  value="daily"
                  checked={!isSpecificGroup}
                  onChange={() => setIsSpecificGroup(false)}
                />
                <label htmlFor={`${baseId}-seg-daily`}>
                  <span className="radio-title">
                    <Calendar size={14} /> {strings.perDayTitle}
                  </span>
                  <span className="radio-sub">{strings.perDaySub}</span>
                </label>
              </div>

              <div className={`radio-card ${isSpecificGroup ? 'active-mode' : ''}`}>
                <input
                  type="radio"
                  id={`${baseId}-seg-group`}
                  name="segregationMode"
                  value="specific"
                  checked={isSpecificGroup}
                  onChange={() => {
                    setIsSpecificGroup(true);
                    if (!groupSelectId || groupSelectId === 'grp-daily') {
                      setGroupSelectId(specificGroups[0]?.id || '__new__');
                    }
                  }}
                />
                <label htmlFor={`${baseId}-seg-group`}>
                  <span className="radio-title">
                    <Tag size={14} /> {strings.specificGroupTitle}
                  </span>
                  <span className="radio-sub">{strings.specificGroupSub}</span>
                </label>
              </div>
            </div>

            {isSpecificGroup && (
              <div className="nested-new-field">
                <label htmlFor={`${baseId}-group-select`} className="form-label">
                  {strings.selectGroupLabel}
                </label>
                <select
                  id={`${baseId}-group-select`}
                  name="groupSelectId"
                  value={groupSelectId}
                  onChange={(e) => setGroupSelectId(e.target.value)}
                  className="form-select"
                >
                  {specificGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {pickDisplayName(selectedLanguage, g.name, g.malayalamName)}
                    </option>
                  ))}
                  <option value="__new__">{strings.addNewGroupOption}</option>
                </select>

                {groupSelectId === '__new__' && (
                  <div className="nested-new-field">
                    <label htmlFor={`${baseId}-new-group`} className="form-label">
                      <FolderPlus size={15} /> {strings.newGroupLabel}
                    </label>
                    <input
                      id={`${baseId}-new-group`}
                      name="customGroupName"
                      type="text"
                      required
                      value={customGroupName}
                      onChange={(e) => setCustomGroupName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                )}
              </div>
            )}
          </fieldset>

          {/* Date & Notes row */}
          <div className="form-row-two">
            <div className="form-group">
              <label htmlFor={`${baseId}-date`} className="form-label">
                {strings.dateLabel}
              </label>
              <input
                id={`${baseId}-date`}
                name="txDate"
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor={`${baseId}-notes`} className="form-label">
                {strings.notesLabel}
              </label>
              <input
                id={`${baseId}-notes`}
                name="notes"
                type="text"
                enterKeyHint="done"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={strings.notesPlaceholder}
                className="form-input"
              />
            </div>
          </div>

          <div className="confirm-dialog-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const dialog = dialogRef.current;
                if (dialog) {
                  dialog.returnValue = 'cancel';
                  dialog.close('cancel');
                }
                onCancel();
              }}
            >
              {strings.cancelBtn}
            </button>
            <button type="submit" className="btn-primary-confirm">
              <CheckCircle2 size={18} />
              <span>{strings.confirmSaveBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
