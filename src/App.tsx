import { useState, useMemo } from 'react';
import { useFinances } from './hooks/useFinances';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import MonthPicker from './components/MonthPicker';
import LoginScreen from './components/LoginScreen';
import Summary from './components/Summary';
import FilterBar from './components/FilterBar';
import BillList from './components/BillList';
import CategoryBreakdown from './components/CategoryBreakdown';
import BillModal from './components/modals/BillModal';
import IncomeModal from './components/modals/IncomeModal';
import TagManager from './components/modals/TagManager';
import SettingsModal from './components/modals/SettingsModal';
import AttachmentModal from './components/modals/AttachmentModal';
import type { AttachTab, Bill, FilterType, ModalType } from './types';

export default function App() {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const { authState, user, error, signUp, login, sendPasswordReset, updatePassword, logout } = useAuth();

  // ── Finances ─────────────────────────────────────────────────────────────────
  const {
    state, currentMonth, monthData, isLoading,
    navigate, navigateTo,
    togglePaid, reorderBills,
    saveBill, deleteBill,
    saveIncome, deleteIncome,
    saveTag, deleteTag,
  } = useFinances(user?.id);

  const [filter,     setFilter]     = useState<FilterType>('all');
  const [modal,      setModal]      = useState<ModalType>({ kind: 'none' });
  const [showPicker, setShowPicker] = useState(false);

  const { bills, incomes } = monthData;

  const counts: Record<FilterType, number> = {
    all:          bills.length,
    pending:      bills.filter(b => !b.isPaid).length,
    paid:         bills.filter(b => b.isPaid).length,
    'auto-debit': bills.filter(b => b.isAutoDebit).length,
  };

  const tagUsageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const md of Object.values(state.months))
      for (const bill of md.bills)
        for (const tid of bill.tagIds)
          c[tid] = (c[tid] ?? 0) + 1;
    return c;
  }, [state.months]);

  const monthsWithData = useMemo(() => new Set(Object.keys(state.months)), [state.months]);

  const handleOpenAttach = (bill: Bill, tab: AttachTab) => setModal({ kind: 'attachments', bill, tab });

  const handleAttachmentUpdate = (bill: Bill) => {
    void saveBill(bill);
    setModal(prev => prev.kind === 'attachments' ? { ...prev, bill } : prev);
  };

  // ── Auth gate ─────────────────────────────────────────────────────────────────
  if (authState === 'loading') return null;

  if (authState !== 'authenticated') {
    return (
      <LoginScreen
        isRecovery={authState === 'recovery'}
        error={error}
        onSignUp={signUp}
        onLogin={login}
        onForgotPassword={sendPasswordReset}
        onUpdatePassword={updatePassword}
      />
    );
  }

  // ── Loading data ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // ── App ───────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950">
      <Header
        currentMonth={currentMonth}
        onNavigate={navigate}
        onOpenTags={() => setModal({ kind: 'tags' })}
        onOpenPicker={() => setShowPicker(true)}
        onOpenSettings={() => setModal({ kind: 'settings' })}
      />

      {showPicker && (
        <MonthPicker
          currentMonth={currentMonth}
          monthsWithData={monthsWithData}
          onSelect={navigateTo}
          onClose={() => setShowPicker(false)}
        />
      )}

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-24">
        <Summary
          bills={bills}
          incomes={incomes}
          onAddIncome={() => setModal({ kind: 'income', income: null })}
          onEditIncome={income => setModal({ kind: 'income', income })}
          onDeleteIncome={deleteIncome}
        />

        <FilterBar active={filter} onChange={setFilter} counts={counts} />

        <BillList
          bills={bills}
          tags={state.tags}
          filter={filter}
          onTogglePaid={togglePaid}
          onReorder={reorderBills}
          onEdit={bill => setModal({ kind: 'bill', bill })}
          onDelete={id => void deleteBill(id)}
          onOpenAttach={handleOpenAttach}
          onAdd={() => setModal({ kind: 'bill', bill: null })}
        />

        <CategoryBreakdown bills={bills} tags={state.tags} />
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {modal.kind === 'bill' && (
        <BillModal
          bill={modal.bill}
          tags={state.tags}
          onSave={bill => void saveBill(bill)}
          onDelete={id => void deleteBill(id)}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}

      {modal.kind === 'income' && (
        <IncomeModal
          income={modal.income}
          onSave={income => void saveIncome(income)}
          onDelete={id => void deleteIncome(id)}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}

      {modal.kind === 'tags' && (
        <TagManager
          tags={state.tags}
          tagUsageCounts={tagUsageCounts}
          onSave={tag => void saveTag(tag)}
          onDelete={id => void deleteTag(id)}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}

      {modal.kind === 'settings' && (
        <SettingsModal
          userEmail={user?.email ?? ''}
          onUpdatePassword={updatePassword}
          onLogout={logout}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}

      {modal.kind === 'attachments' && (
        <AttachmentModal
          bill={modal.bill}
          initialTab={modal.tab}
          onUpdate={handleAttachmentUpdate}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}
    </div>
  );
}
