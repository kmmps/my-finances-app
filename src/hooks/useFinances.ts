import { useState, useEffect, useCallback } from 'react';
import type { AppState, Bill, Income, Tag, MonthData, TagColor } from '../types';
import { DEFAULT_TAGS, DEFAULT_BILLS, DEFAULT_INCOMES, DEFAULT_TAG_EMOJIS } from '../data/defaults';
import { getCurrentMonthKey, generateId } from '../utils';

const STORAGE_KEY = 'finances-app-v1';

// ── Migration helpers ─────────────────────────────────────────────────────────

function migrateBill(raw: Record<string, unknown>): Bill {
  return {
    id:            String(raw.id ?? generateId()),
    name:          String(raw.name ?? ''),
    amount:        Number(raw.amount ?? 0),
    dueDay:        Number(raw.dueDay ?? 1),
    tagIds:        Array.isArray(raw.tagIds) ? (raw.tagIds as string[]) : [],
    isPaid:        Boolean(raw.isPaid),
    isAutoDebit:   Boolean(raw.isAutoDebit),
    boleto:        (raw.boleto && typeof raw.boleto === 'object')
                     ? (raw.boleto as Bill['boleto'])
                     : { pixCode: '', file: null },
    comprovantes:  Array.isArray(raw.comprovantes)
                     ? (raw.comprovantes as Bill['comprovantes'])
                     : (Array.isArray(raw.attachments) ? (raw.attachments as Bill['comprovantes']) : []),
    note:          String(raw.note ?? ''),
  };
}

function migrateTag(raw: Record<string, unknown>): Tag {
  return {
    id:    String(raw.id ?? generateId()),
    name:  String(raw.name ?? ''),
    color: (raw.color as TagColor) ?? 'gray',
    emoji: String(raw.emoji ?? DEFAULT_TAG_EMOJIS[String(raw.id)] ?? '🏷️'),
  };
}

function migrateState(raw: Record<string, unknown>): AppState {
  const rawTags = Array.isArray(raw.tags) ? raw.tags : [];
  const rawMonths = (raw.months && typeof raw.months === 'object') ? raw.months as Record<string, unknown> : {};

  const months: AppState['months'] = {};
  for (const [k, v] of Object.entries(rawMonths)) {
    const mv = v as Record<string, unknown>;
    months[k] = {
      bills:   Array.isArray(mv.bills)   ? mv.bills.map(b => migrateBill(b as Record<string, unknown>)) : [],
      incomes: Array.isArray(mv.incomes) ? mv.incomes as Income[] : [],
    };
  }

  return {
    tags:   rawTags.map(t => migrateTag(t as Record<string, unknown>)),
    months,
  };
}

// ── Boot ──────────────────────────────────────────────────────────────────────

function freshBills(bills: Bill[]): Bill[] {
  return bills.map(b => ({
    ...b,
    id:           generateId(),
    isPaid:       false,
    boleto:       { pixCode: '', file: null },
    comprovantes: [],
  }));
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateState(JSON.parse(raw) as Record<string, unknown>);
  } catch { /* ignore corrupt data */ }

  const month = getCurrentMonthKey();
  return {
    tags: DEFAULT_TAGS,
    months: {
      [month]: {
        bills:   DEFAULT_BILLS.map(b => ({ ...b })),
        incomes: DEFAULT_INCOMES.map(i => ({ ...i })),
      },
    },
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFinances() {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthKey);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const ensureMonth = useCallback((month: string) => {
    setState(prev => {
      if (prev.months[month]) return prev;

      const sortedMonths = Object.keys(prev.months).sort();
      const lastMonth = sortedMonths[sortedMonths.length - 1];
      let newData: MonthData;

      if (lastMonth && prev.months[lastMonth]) {
        const last = prev.months[lastMonth]!;
        newData = {
          bills:   freshBills(last.bills),
          incomes: last.incomes.map(i => ({ ...i, id: generateId() })),
        };
      } else {
        newData = {
          bills:   DEFAULT_BILLS.map(b => ({ ...b })),
          incomes: DEFAULT_INCOMES.map(i => ({ ...i })),
        };
      }

      return { ...prev, months: { ...prev.months, [month]: newData } };
    });
  }, []);

  const navigate = useCallback((delta: number) => {
    setCurrentMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y!, m! - 1 + delta, 1);
      const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      ensureMonth(next);
      return next;
    });
  }, [ensureMonth]);

  const navigateTo = useCallback((month: string) => {
    ensureMonth(month);
    setCurrentMonth(month);
  }, [ensureMonth]);

  const monthData = state.months[currentMonth] ?? { bills: [], incomes: [] };

  // ── Bills ─────────────────────────────────────────────────────────────────

  const updateBills = useCallback((updater: (bills: Bill[]) => Bill[]) => {
    setState(prev => ({
      ...prev,
      months: {
        ...prev.months,
        [currentMonth]: {
          ...prev.months[currentMonth]!,
          bills: updater(prev.months[currentMonth]?.bills ?? []),
        },
      },
    }));
  }, [currentMonth]);

  const togglePaid = useCallback((id: string) => {
    updateBills(bills => {
      const idx = bills.findIndex(b => b.id === id);
      if (idx === -1) return bills;
      const updated = { ...bills[idx]!, isPaid: !bills[idx]!.isPaid };
      if (updated.isPaid) {
        // Sink paid bill to end of list
        return [...bills.filter(b => b.id !== id), updated];
      }
      return bills.map(b => b.id === id ? updated : b);
    });
  }, [updateBills]);

  const reorderBills = useCallback((activeId: string, overId: string) => {
    updateBills(bills => {
      const from = bills.findIndex(b => b.id === activeId);
      const to   = bills.findIndex(b => b.id === overId);
      if (from === -1 || to === -1 || from === to) return bills;
      const next = [...bills];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next;
    });
  }, [updateBills]);

  const saveBill = useCallback((bill: Bill) => {
    updateBills(bills => {
      const idx = bills.findIndex(b => b.id === bill.id);
      if (idx >= 0) {
        const next = [...bills];
        next[idx] = bill;
        return next;
      }
      return [...bills, { ...bill, id: generateId() }];
    });
  }, [updateBills]);

  const deleteBill = useCallback((id: string) => {
    updateBills(bills => bills.filter(b => b.id !== id));
  }, [updateBills]);

  // ── Incomes ───────────────────────────────────────────────────────────────

  const updateIncomes = useCallback((updater: (incomes: Income[]) => Income[]) => {
    setState(prev => ({
      ...prev,
      months: {
        ...prev.months,
        [currentMonth]: {
          ...prev.months[currentMonth]!,
          incomes: updater(prev.months[currentMonth]?.incomes ?? []),
        },
      },
    }));
  }, [currentMonth]);

  const saveIncome = useCallback((income: Income) => {
    updateIncomes(incomes => {
      const idx = incomes.findIndex(i => i.id === income.id);
      if (idx >= 0) {
        const next = [...incomes];
        next[idx] = income;
        return next;
      }
      return [...incomes, { ...income, id: generateId() }];
    });
  }, [updateIncomes]);

  const deleteIncome = useCallback((id: string) => {
    updateIncomes(incomes => incomes.filter(i => i.id !== id));
  }, [updateIncomes]);

  // ── Tags ──────────────────────────────────────────────────────────────────

  const saveTag = useCallback((tag: Tag) => {
    setState(prev => {
      const idx = prev.tags.findIndex(t => t.id === tag.id);
      const tags = idx >= 0
        ? prev.tags.map((t, i) => i === idx ? tag : t)
        : [...prev.tags, { ...tag, id: generateId() }];
      return { ...prev, tags };
    });
  }, []);

  const deleteTag = useCallback((id: string) => {
    setState(prev => {
      const tags = prev.tags.filter(t => t.id !== id);
      const months: AppState['months'] = {};
      for (const [k, v] of Object.entries(prev.months)) {
        months[k] = {
          ...v,
          bills: v.bills.map(b => ({
            ...b,
            tagIds: b.tagIds.filter(tid => tid !== id),
          })),
        };
      }
      return { ...prev, tags, months };
    });
  }, []);

  return {
    state,
    currentMonth,
    monthData,
    navigate,
    navigateTo,
    togglePaid,
    reorderBills,
    saveBill,
    deleteBill,
    saveIncome,
    deleteIncome,
    saveTag,
    deleteTag,
  };
}
