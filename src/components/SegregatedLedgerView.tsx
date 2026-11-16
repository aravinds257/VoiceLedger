import React, { useId, useMemo, useState } from 'react';
import {
  Calendar,
  FolderKanban,
  Users,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Search,
  PlusCircle,
} from 'lucide-react';
import type {
  Account,
  GroupCategory,
  LanguageCode,
  Person,
  TransactionEntry,
} from '../types';
import { getTodayISO } from '../data/initialData';
import { pickDisplayName, type UIStrings } from '../i18n/translations';

export type SegregationTab = 'per-day' | 'specific-groups' | 'people' | 'accounts';

interface SegregatedLedgerViewProps {
  selectedLanguage: LanguageCode;
  strings: UIStrings;
  transactions: TransactionEntry[];
  people: Person[];
  accounts: Account[];
  groups: GroupCategory[];
  activeTab: SegregationTab;
  onTabChange: (tab: SegregationTab) => void;
  onDeleteTransaction: (id: string) => void;
  onQuickAddForEntity: (preset: {
    personId?: string;
    accountId?: string;
    groupId?: string;
    isSpecificGroup?: boolean;
  }) => void;
}

function formatReadableDate(
  dateStr: string,
  strings: UIStrings
): { label: string; iso: string } {
  const today = getTodayISO(0);
  const yesterday = getTodayISO(-1);
  if (dateStr === today) {
    return { label: strings.todayLabel, iso: dateStr };
  }
  if (dateStr === yesterday) {
    return { label: strings.yesterdayLabel, iso: dateStr };
  }
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const formatted = dt.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return { label: formatted, iso: dateStr };
  } catch {
    return { label: dateStr, iso: dateStr };
  }
}

export const SegregatedLedgerView: React.FC<SegregatedLedgerViewProps> = ({
  selectedLanguage,
  strings,
  transactions,
  people,
  accounts,
  groups,
  activeTab,
  onTabChange,
  onDeleteTransaction,
  onQuickAddForEntity,
}) => {
  const searchId = useId();
  const [searchQuery, setSearchQuery] = useState('');
  const [dailyFilterMode, setDailyFilterMode] = useState<'all' | 'general-only' | 'specific-only'>(
    'all'
  );

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (!q) return true;
      return (
        tx.personName.toLowerCase().includes(q) ||
        tx.personMalayalamName.toLowerCase().includes(q) ||
        tx.accountName.toLowerCase().includes(q) ||
        tx.accountMalayalamName.toLowerCase().includes(q) ||
        tx.groupName.toLowerCase().includes(q) ||
        tx.groupMalayalamName.toLowerCase().includes(q) ||
        tx.rawTranscript.toLowerCase().includes(q) ||
        String(tx.amount).includes(q)
      );
    });
  }, [transactions, searchQuery]);

  const perDayBuckets = useMemo(() => {
    const list = filteredTransactions.filter((tx) => {
      if (dailyFilterMode === 'general-only') return !tx.isSpecificGroup;
      if (dailyFilterMode === 'specific-only') return tx.isSpecificGroup;
      return true;
    });

    const map = new Map<
      string,
      {
        date: string;
        totalCredit: number;
        totalDebit: number;
        entries: TransactionEntry[];
      }
    >();

    for (const tx of list) {
      const existing = map.get(tx.date) || {
        date: tx.date,
        totalCredit: 0,
        totalDebit: 0,
        entries: [],
      };
      if (tx.type === 'credit') {
        existing.totalCredit += tx.amount;
      } else {
        existing.totalDebit += tx.amount;
      }
      existing.entries.push(tx);
      map.set(tx.date, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions, dailyFilterMode]);

  const groupBuckets = useMemo(() => {
    const map = new Map<
      string,
      {
        groupId: string;
        groupName: string;
        groupMalayalamName: string;
        isSpecific: boolean;
        color: string;
        totalCredit: number;
        totalDebit: number;
        entries: TransactionEntry[];
        personTotals: Map<string, { name: string; malName: string; credit: number; debit: number }>;
      }
    >();

    for (const grp of groups) {
      map.set(grp.id, {
        groupId: grp.id,
        groupName: grp.name,
        groupMalayalamName: grp.malayalamName,
        isSpecific: grp.isSpecific,
        color: grp.color,
        totalCredit: 0,
        totalDebit: 0,
        entries: [],
        personTotals: new Map(),
      });
    }

    for (const tx of filteredTransactions) {
      const key = tx.groupId || (tx.isSpecificGroup ? tx.groupName : 'grp-daily');
      let bucket = map.get(key);
      if (!bucket) {
        bucket = {
          groupId: key,
          groupName: tx.groupName,
          groupMalayalamName: tx.groupMalayalamName,
          isSpecific: tx.isSpecificGroup,
          color: '#0f766e',
          totalCredit: 0,
          totalDebit: 0,
          entries: [],
          personTotals: new Map(),
        };
        map.set(key, bucket);
      }

      if (tx.type === 'credit') {
        bucket.totalCredit += tx.amount;
      } else {
        bucket.totalDebit += tx.amount;
      }
      bucket.entries.push(tx);

      const pStat = bucket.personTotals.get(tx.personId) || {
        name: tx.personName,
        malName: tx.personMalayalamName,
        credit: 0,
        debit: 0,
      };
      if (tx.type === 'credit') pStat.credit += tx.amount;
      else pStat.debit += tx.amount;
      bucket.personTotals.set(tx.personId, pStat);
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.isSpecific !== b.isSpecific) return a.isSpecific ? -1 : 1;
      return b.entries.length - a.entries.length;
    });
  }, [filteredTransactions, groups]);

  const personBuckets = useMemo(() => {
    return people.map((person) => {
      const entries = filteredTransactions.filter((t) => t.personId === person.id);
      const totalCredit = entries
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalDebit = entries
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        person,
        entries,
        totalCredit,
        totalDebit,
      };
    });
  }, [people, filteredTransactions]);

  const accountBuckets = useMemo(() => {
    return accounts.map((account) => {
      const entries = filteredTransactions.filter((t) => t.accountId === account.id);
      const totalCredit = entries
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalDebit = entries
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        account,
        entries,
        totalCredit,
        totalDebit,
      };
    });
  }, [accounts, filteredTransactions]);

  return (
    <section className="ledger-section" aria-label={strings.tabDaily}>
      <div className="segregation-tabs" role="tablist" aria-label={strings.segregationLabel}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'per-day'}
          className={`seg-tab-btn ${activeTab === 'per-day' ? 'active' : ''}`}
          onClick={() => onTabChange('per-day')}
        >
          <Calendar size={16} />
          <span>{strings.tabDaily}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'specific-groups'}
          className={`seg-tab-btn ${activeTab === 'specific-groups' ? 'active' : ''}`}
          onClick={() => onTabChange('specific-groups')}
        >
          <FolderKanban size={16} />
          <span>{strings.tabGroups}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'people'}
          className={`seg-tab-btn ${activeTab === 'people' ? 'active' : ''}`}
          onClick={() => onTabChange('people')}
        >
          <Users size={16} />
          <span>{strings.tabPeople}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'accounts'}
          className={`seg-tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => onTabChange('accounts')}
        >
          <Landmark size={16} />
          <span>{strings.tabAccounts}</span>
        </button>
      </div>

      {/* Semantic <search> element per modern-web-guidance `forms` */}
      <search className="ledger-search-bar">
        <form
          action="/search"
          method="GET"
          onSubmit={(e) => e.preventDefault()}
          className="search-form-row"
        >
          <div className="search-input-wrap">
            <label htmlFor={searchId} className="visually-hidden">
              {strings.searchPlaceholder}
            </label>
            <Search size={16} className="search-icon" />
            <input
              type="search"
              id={searchId}
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={strings.searchPlaceholder}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="search-input"
            />
          </div>
        </form>
      </search>

      {/* TAB 1: PER-DAY SEGREGATION */}
      {activeTab === 'per-day' && (
        <div className="tab-panel-content">
          <div className="subfilter-pills" role="group" aria-label={strings.tabDaily}>
            <button
              type="button"
              className={`subfilter-pill ${dailyFilterMode === 'all' ? 'active' : ''}`}
              onClick={() => setDailyFilterMode('all')}
            >
              {strings.filterAll} ({filteredTransactions.length})
            </button>
            <button
              type="button"
              className={`subfilter-pill ${dailyFilterMode === 'general-only' ? 'active' : ''}`}
              onClick={() => setDailyFilterMode('general-only')}
            >
              {strings.filterDailyOnly}
            </button>
            <button
              type="button"
              className={`subfilter-pill ${dailyFilterMode === 'specific-only' ? 'active' : ''}`}
              onClick={() => setDailyFilterMode('specific-only')}
            >
              {strings.filterSpecificOnly}
            </button>
          </div>

          {perDayBuckets.length === 0 ? (
            <div className="empty-state-card">
              <p>{strings.emptyLedger}</p>
            </div>
          ) : (
            perDayBuckets.map((dayBucket) => {
              const { label, iso } = formatReadableDate(dayBucket.date, strings);
              return (
                <article key={dayBucket.date} className="day-bucket-card">
                  <header className="day-bucket-header">
                    <div>
                      <h3 className="day-bucket-title">{label}</h3>
                      <span className="day-bucket-sub">
                        {iso} • {dayBucket.entries.length} {strings.transactionsCount}
                      </span>
                    </div>
                    <div className="day-bucket-totals">
                      <span className="tot-credit">
                        +₹{dayBucket.totalCredit.toLocaleString('en-IN')}
                      </span>
                      <span className="tot-debit">
                        -₹{dayBucket.totalDebit.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </header>

                  <div className="tx-list">
                    {dayBucket.entries.map((tx) => (
                      <div key={tx.id} className="tx-item">
                        <div className={`tx-icon-circle ${tx.type}`}>
                          {tx.type === 'credit' ? (
                            <ArrowDownLeft size={18} />
                          ) : (
                            <ArrowUpRight size={18} />
                          )}
                        </div>
                        <div className="tx-details">
                          <div className="tx-top-line">
                            <span className="tx-person-name">
                              {pickDisplayName(
                                selectedLanguage,
                                tx.personName,
                                tx.personMalayalamName
                              )}
                            </span>
                            <span className={`tx-amount ${tx.type}`}>
                              {tx.type === 'credit' ? '+' : '-'}₹
                              {tx.amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="tx-meta-badges">
                            <span className="badge-account">
                              {pickDisplayName(
                                selectedLanguage,
                                tx.accountName,
                                tx.accountMalayalamName
                              )}
                            </span>
                            <span
                              className={`badge-group ${
                                tx.isSpecificGroup ? 'specific' : 'general'
                              }`}
                            >
                              {tx.isSpecificGroup
                                ? `★ ${pickDisplayName(
                                    selectedLanguage,
                                    tx.groupName,
                                    tx.groupMalayalamName
                                  )}`
                                : strings.tabDaily}
                            </span>
                          </div>
                          {tx.rawTranscript && (
                            <p className="tx-transcript">“{tx.rawTranscript}”</p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="tx-delete-btn"
                          onClick={() => onDeleteTransaction(tx.id)}
                          aria-label={`Delete ₹${tx.amount}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: SPECIFIC GROUPING SEGREGATION */}
      {activeTab === 'specific-groups' && (
        <div className="tab-panel-content">
          <div className="section-explainer">
            <p>{strings.groupsExplainer}</p>
          </div>

          {groupBuckets.map((grp) => (
            <article
              key={grp.groupId}
              className={`group-bucket-card ${grp.isSpecific ? 'is-specific' : 'is-daily-general'}`}
            >
              <header className="group-bucket-header">
                <div className="group-title-col">
                  <div className="group-badge-line">
                    <span className="group-dot" style={{ backgroundColor: grp.color }} />
                    <span className="group-kind-tag">
                      {grp.isSpecific ? strings.specificGroupTag : strings.dailyGeneralTag}
                    </span>
                  </div>
                  <h3 className="group-bucket-title">
                    {pickDisplayName(selectedLanguage, grp.groupName, grp.groupMalayalamName)}
                  </h3>
                </div>

                <button
                  type="button"
                  className="quick-add-mini-btn"
                  onClick={() =>
                    onQuickAddForEntity({
                      groupId: grp.groupId,
                      isSpecificGroup: grp.isSpecific,
                    })
                  }
                >
                  <PlusCircle size={15} />
                  <span>{strings.addBtn}</span>
                </button>
              </header>

              <div className="group-summary-strip">
                <div className="strip-stat">
                  <span className="strip-label">{strings.totalCredit}</span>
                  <strong className="tot-credit">
                    +₹{grp.totalCredit.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="strip-stat">
                  <span className="strip-label">{strings.totalDebit}</span>
                  <strong className="tot-debit">
                    -₹{grp.totalDebit.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="strip-stat">
                  <span className="strip-label">{strings.countLabel}</span>
                  <strong>{grp.entries.length}</strong>
                </div>
              </div>

              {grp.personTotals.size > 0 && (
                <div className="group-people-breakdown">
                  <h4 className="breakdown-subtitle">{strings.peopleInGroup}</h4>
                  <div className="person-mini-chips">
                    {Array.from(grp.personTotals.entries()).map(([pId, pInfo]) => (
                      <div key={pId} className="person-mini-chip">
                        <span className="p-chip-name">
                          {pickDisplayName(selectedLanguage, pInfo.name, pInfo.malName)}
                        </span>
                        {pInfo.credit > 0 && (
                          <span className="tot-credit">+₹{pInfo.credit.toLocaleString('en-IN')}</span>
                        )}
                        {pInfo.debit > 0 && (
                          <span className="tot-debit">-₹{pInfo.debit.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {grp.entries.length > 0 && (
                <div className="tx-list compact">
                  {grp.entries.map((tx) => (
                    <div key={tx.id} className="tx-item">
                      <div className="tx-details">
                        <div className="tx-top-line">
                          <span className="tx-person-name">
                            {pickDisplayName(
                              selectedLanguage,
                              tx.personName,
                              tx.personMalayalamName
                            )}{' '}
                            •{' '}
                            <small>
                              {pickDisplayName(
                                selectedLanguage,
                                tx.accountName,
                                tx.accountMalayalamName
                              )}
                            </small>
                          </span>
                          <span className={`tx-amount ${tx.type}`}>
                            {tx.type === 'credit' ? '+' : '-'}₹
                            {tx.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="tx-date-caption">
                          {formatReadableDate(tx.date, strings).label}
                          {tx.rawTranscript ? ` — “${tx.rawTranscript}”` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* TAB 3: PEOPLE LEDGER */}
      {activeTab === 'people' && (
        <div className="tab-panel-content">
          {personBuckets.map(({ person, entries, totalCredit, totalDebit }) => (
            <article key={person.id} className="entity-card">
              <header className="entity-card-header">
                <div className="entity-avatar-row">
                  <div
                    className="entity-avatar"
                    style={{ backgroundColor: person.avatarColor }}
                  >
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="entity-title">
                      {pickDisplayName(selectedLanguage, person.name, person.malayalamName)}
                    </h3>
                    <span className="entity-sub">
                      {entries.length} {strings.transactionsCount}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="quick-add-mini-btn"
                  onClick={() => onQuickAddForEntity({ personId: person.id })}
                >
                  <PlusCircle size={15} />
                  <span>{strings.addBtn}</span>
                </button>
              </header>

              <div className="group-summary-strip">
                <div className="strip-stat">
                  <span className="strip-label">{strings.totalCredit}</span>
                  <strong className="tot-credit">+₹{totalCredit.toLocaleString('en-IN')}</strong>
                </div>
                <div className="strip-stat">
                  <span className="strip-label">{strings.totalDebit}</span>
                  <strong className="tot-debit">-₹{totalDebit.toLocaleString('en-IN')}</strong>
                </div>
                <div className="strip-stat">
                  <span className="strip-label">{strings.netBalance}</span>
                  <strong>₹{(totalCredit - totalDebit).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {entries.length > 0 && (
                <div className="tx-list compact">
                  {entries.map((tx) => (
                    <div key={tx.id} className="tx-item">
                      <div className="tx-details">
                        <div className="tx-top-line">
                          <span className="tx-person-name">
                            {pickDisplayName(
                              selectedLanguage,
                              tx.accountName,
                              tx.accountMalayalamName
                            )}
                          </span>
                          <span className={`tx-amount ${tx.type}`}>
                            {tx.type === 'credit' ? '+' : '-'}₹
                            {tx.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="tx-meta-badges">
                          <span className="badge-date">
                            {formatReadableDate(tx.date, strings).label}
                          </span>
                          <span
                            className={`badge-group ${
                              tx.isSpecificGroup ? 'specific' : 'general'
                            }`}
                          >
                            {pickDisplayName(
                              selectedLanguage,
                              tx.groupName,
                              tx.groupMalayalamName
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* TAB 4: ACCOUNTS LEDGER */}
      {activeTab === 'accounts' && (
        <div className="tab-panel-content">
          {accountBuckets.map(({ account, entries, totalCredit, totalDebit }) => (
            <article key={account.id} className="entity-card">
              <header className="entity-card-header">
                <div className="entity-avatar-row">
                  <div
                    className="entity-avatar"
                    style={{ backgroundColor: account.color }}
                  >
                    <Landmark size={18} />
                  </div>
                  <div>
                    <h3 className="entity-title">
                      {pickDisplayName(selectedLanguage, account.name, account.malayalamName)}
                    </h3>
                    <span className="entity-sub">
                      {account.type.toUpperCase()} • {entries.length} {strings.transactionsCount}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="quick-add-mini-btn"
                  onClick={() => onQuickAddForEntity({ accountId: account.id })}
                >
                  <PlusCircle size={15} />
                  <span>{strings.addBtn}</span>
                </button>
              </header>

              <div className="group-summary-strip">
                <div className="strip-stat">
                  <span className="strip-label">{strings.totalCredit}</span>
                  <strong className="tot-credit">+₹{totalCredit.toLocaleString('en-IN')}</strong>
                </div>
                <div className="strip-stat">
                  <span className="strip-label">{strings.totalDebit}</span>
                  <strong className="tot-debit">-₹{totalDebit.toLocaleString('en-IN')}</strong>
                </div>
                <div className="strip-stat">
                  <span className="strip-label">{strings.netBalance}</span>
                  <strong>₹{(totalCredit - totalDebit).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {entries.length > 0 && (
                <div className="tx-list compact">
                  {entries.map((tx) => (
                    <div key={tx.id} className="tx-item">
                      <div className="tx-details">
                        <div className="tx-top-line">
                          <span className="tx-person-name">
                            {pickDisplayName(
                              selectedLanguage,
                              tx.personName,
                              tx.personMalayalamName
                            )}
                          </span>
                          <span className={`tx-amount ${tx.type}`}>
                            {tx.type === 'credit' ? '+' : '-'}₹
                            {tx.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="tx-meta-badges">
                          <span className="badge-date">
                            {formatReadableDate(tx.date, strings).label}
                          </span>
                          <span
                            className={`badge-group ${
                              tx.isSpecificGroup ? 'specific' : 'general'
                            }`}
                          >
                            {pickDisplayName(
                              selectedLanguage,
                              tx.groupName,
                              tx.groupMalayalamName
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
