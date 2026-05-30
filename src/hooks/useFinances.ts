import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { AppState, Bill, Income, Tag, MonthData, TagColor } from '../types';
import { DEFAULT_BILLS, DEFAULT_INCOMES, DEFAULT_TAGS } from '../data/defaults';
import { getCurrentMonthKey, generateId } from '../utils';

const STORAGE_KEY    = 'finances-app-v1';
const MIGRATION_KEY  = 'finances-migrated-supabase-v1';

// ── DB row types ──────────────────────────────────────────────────────────────

interface DbBill {
  id: string; user_id: string; month_key: string;
  name: string; amount: number | string; due_day: number;
  tag_ids: string[]; is_paid: boolean; is_auto_debit: boolean;
  boleto_pix_code: string; boleto_file: unknown; comprovantes: unknown;
  note: string; sort_order: number;
}
interface DbIncome {
  id: string; user_id: string; month_key: string;
  name: string; amount: number | string; type: 'base' | 'extra';
}
interface DbTag { id: string; user_id: string; name: string; color: string; emoji: string; }

// ── Mappers ───────────────────────────────────────────────────────────────────

function fromDbBill(r: DbBill): Bill {
  return {
    id: r.id, name: r.name, amount: Number(r.amount), dueDay: r.due_day,
    tagIds: r.tag_ids ?? [], isPaid: r.is_paid, isAutoDebit: r.is_auto_debit,
    boleto: { pixCode: r.boleto_pix_code ?? '', file: r.boleto_file as Bill['boleto']['file'] },
    comprovantes: (r.comprovantes ?? []) as Bill['comprovantes'],
    note: r.note ?? '',
  };
}

function toDbBill(b: Bill, monthKey: string, sortOrder: number, userId: string) {
  return {
    id: b.id, user_id: userId, month_key: monthKey,
    name: b.name, amount: b.amount, due_day: b.dueDay,
    tag_ids: b.tagIds, is_paid: b.isPaid, is_auto_debit: b.isAutoDebit,
    boleto_pix_code: b.boleto.pixCode, boleto_file: b.boleto.file,
    comprovantes: b.comprovantes, note: b.note, sort_order: sortOrder,
  };
}

function fromDbIncome(r: DbIncome): Income {
  return { id: r.id, name: r.name, amount: Number(r.amount), type: r.type };
}

function toDbIncome(i: Income, monthKey: string, userId: string) {
  return { id: i.id, user_id: userId, month_key: monthKey, name: i.name, amount: i.amount, type: i.type };
}

function fromDbTag(r: DbTag): Tag {
  return { id: r.id, name: r.name, color: r.color as TagColor, emoji: r.emoji };
}

function toDbTag(t: Tag, userId: string) {
  return { id: t.id, user_id: userId, name: t.name, color: t.color, emoji: t.emoji };
}

// ── localStorage migration helpers ────────────────────────────────────────────

function migrateBill(raw: Record<string, unknown>): Bill {
  return {
    id:           String(raw.id ?? generateId()),
    name:         String(raw.name ?? ''),
    amount:       Number(raw.amount ?? 0),
    dueDay:       Number(raw.dueDay ?? 1),
    tagIds:       Array.isArray(raw.tagIds) ? (raw.tagIds as string[]) : [],
    isPaid:       Boolean(raw.isPaid),
    isAutoDebit:  Boolean(raw.isAutoDebit),
    boleto:       (raw.boleto && typeof raw.boleto === 'object')
                    ? (raw.boleto as Bill['boleto'])
                    : { pixCode: '', file: null },
    comprovantes: Array.isArray(raw.comprovantes)
                    ? (raw.comprovantes as Bill['comprovantes'])
                    : [],
    note: String(raw.note ?? ''),
  };
}

function migrateTag(raw: Record<string, unknown>): Tag {
  return {
    id:    String(raw.id ?? generateId()),
    name:  String(raw.name ?? ''),
    color: (raw.color as TagColor) ?? 'gray',
    emoji: String(raw.emoji ?? '🏷️'),
  };
}

function parseLocalState(raw: Record<string, unknown>): AppState {
  const rawTags   = Array.isArray(raw.tags) ? raw.tags : [];
  const rawMonths = (raw.months && typeof raw.months === 'object')
    ? (raw.months as Record<string, unknown>) : {};

  const months: AppState['months'] = {};
  for (const [k, v] of Object.entries(rawMonths)) {
    const mv = v as Record<string, unknown>;
    months[k] = {
      bills:   Array.isArray(mv.bills)   ? mv.bills.map(b => migrateBill(b as Record<string, unknown>)) : [],
      incomes: Array.isArray(mv.incomes) ? mv.incomes as Income[] : [],
    };
  }
  return { tags: rawTags.map(t => migrateTag(t as Record<string, unknown>)), months };
}

// ── Supabase: load all data ────────────────────────────────────────────────────

async function loadFromSupabase(): Promise<AppState | null> {
  try {
    const [{ data: bills, error: be }, { data: incomes, error: ie }, { data: tags, error: te }] =
      await Promise.all([
        supabase.from('bills').select('*').order('sort_order'),
        supabase.from('incomes').select('*'),
        supabase.from('tags').select('*'),
      ]);
    if (be || ie || te) return null;

    const months: AppState['months'] = {};
    for (const b of (bills ?? []) as DbBill[]) {
      if (!months[b.month_key]) months[b.month_key] = { bills: [], incomes: [] };
      months[b.month_key]!.bills.push(fromDbBill(b));
    }
    for (const i of (incomes ?? []) as DbIncome[]) {
      if (!months[i.month_key]) months[i.month_key] = { bills: [], incomes: [] };
      months[i.month_key]!.incomes.push(fromDbIncome(i));
    }
    return { months, tags: ((tags ?? []) as DbTag[]).map(fromDbTag) };
  } catch { return null; }
}

// ── localStorage → Supabase one-time migration ────────────────────────────────

async function runMigration(userId: string): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { localStorage.setItem(MIGRATION_KEY, '1'); return; }

  try {
    const old = parseLocalState(JSON.parse(raw) as Record<string, unknown>);
    const bills: object[] = [], incomes: object[] = [];
    for (const [monthKey, md] of Object.entries(old.months)) {
      md.bills.forEach((b, i)  => bills.push(toDbBill(b, monthKey, i, userId)));
      md.incomes.forEach(i     => incomes.push(toDbIncome(i, monthKey, userId)));
    }
    const tags = old.tags.length ? old.tags : DEFAULT_TAGS;
    await Promise.all([
      bills.length   ? supabase.from('bills').upsert(bills)                       : null,
      incomes.length ? supabase.from('incomes').upsert(incomes)                   : null,
      tags.length    ? supabase.from('tags').upsert(tags.map(t => toDbTag(t, userId))) : null,
    ].filter(Boolean));
    localStorage.setItem(MIGRATION_KEY, '1');
  } catch (e) { console.error('Migration error:', e); }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

const EMPTY: AppState = { tags: [], months: {} };
const LOAD_TIMEOUT_MS = 5000;

export function useFinances(userId: string | undefined) {
  const [state,        setState]       = useState<AppState>(EMPTY);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthKey);
  const [isLoading,    setIsLoading]   = useState(true);
  const [loadError,    setLoadError]   = useState(false);
  const [retryCount,   setRetryCount]  = useState(0);
  const initRef = useRef(false);

  const retry = useCallback(() => {
    initRef.current = false;
    setLoadError(false);
    setRetryCount(c => c + 1);
  }, []);

  // ── Load / reset on auth change ─────────────────────────────────────────

  useEffect(() => {
    if (!userId) {
      setState(EMPTY);
      setIsLoading(false);
      setLoadError(false);
      initRef.current = false;
      return;
    }
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      console.log('[finances] iniciando carregamento...');
      setIsLoading(true);
      setLoadError(false);

      // 1. Mostra dados do cache imediatamente
      let hasCachedData = false;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          setState(parseLocalState(JSON.parse(raw) as Record<string, unknown>));
          hasCachedData = true;
          console.log('[finances] dados locais carregados do localStorage');
        }
      } catch (e) {
        console.warn('[finances] erro ao ler localStorage:', e);
      }

      try {
        // 2. Migração única localStorage → Supabase
        await runMigration(userId);

        // 3. Busca dados do Supabase com timeout de 5s
        console.log('[finances] buscando dados do Supabase...');
        const fresh = await Promise.race<AppState | null>([
          loadFromSupabase(),
          new Promise<null>(resolve =>
            setTimeout(() => {
              console.warn(`[finances] timeout: Supabase não respondeu em ${LOAD_TIMEOUT_MS}ms`);
              resolve(null);
            }, LOAD_TIMEOUT_MS)
          ),
        ]);

        if (fresh) {
          console.log('[finances] dados do Supabase carregados com sucesso');

          // 4. Primeiro login: banco vazio → insere dados padrão
          if (Object.keys(fresh.months).length === 0 && fresh.tags.length === 0) {
            console.log('[finances] primeiro login: inserindo contas e tags padrão...');
            const monthKey   = getCurrentMonthKey();
            const tags       = DEFAULT_TAGS.map(t => ({ ...t }));
            const bills      = DEFAULT_BILLS.map(b => ({ ...b }));
            const incomes    = DEFAULT_INCOMES.map(i => ({ ...i }));
            const seeded: AppState = { tags, months: { [monthKey]: { bills, incomes } } };
            setState(seeded);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
            void Promise.all([
              supabase.from('tags').upsert(tags.map(t => toDbTag(t, userId))),
              supabase.from('bills').upsert(bills.map((b, i) => toDbBill(b, monthKey, i, userId))),
              supabase.from('incomes').upsert(incomes.map(i => toDbIncome(i, monthKey, userId))),
            ])
              .then(() => console.log('[finances] dados padrão salvos no Supabase'))
              .catch(e => console.error('[finances] erro ao salvar dados padrão:', e));
          } else {
            setState(fresh);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
          }
        } else {
          // Supabase falhou ou timeout — usa localStorage como fallback
          console.warn('[finances] Supabase indisponível, usando localStorage como fallback');
          if (!hasCachedData) {
            // Sem dados locais → carrega padrões offline
            const monthKey = getCurrentMonthKey();
            const offlineState: AppState = {
              tags:   DEFAULT_TAGS.map(t => ({ ...t })),
              months: { [monthKey]: { bills: DEFAULT_BILLS.map(b => ({ ...b })), incomes: DEFAULT_INCOMES.map(i => ({ ...i })) } },
            };
            setState(offlineState);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(offlineState));
            console.log('[finances] dados padrão offline carregados');
          }
          setLoadError(true);
        }
      } catch (e) {
        console.error('[finances] erro inesperado no carregamento:', e);
        if (!hasCachedData) {
          const monthKey = getCurrentMonthKey();
          setState({
            tags:   DEFAULT_TAGS.map(t => ({ ...t })),
            months: { [monthKey]: { bills: DEFAULT_BILLS.map(b => ({ ...b })), incomes: DEFAULT_INCOMES.map(i => ({ ...i })) } },
          });
        }
        setLoadError(true);
      } finally {
        setIsLoading(false);
        console.log('[finances] carregamento finalizado');
      }
    })();
  }, [userId, retryCount]);

  // Sync local cache whenever state changes (after initial load)
  useEffect(() => {
    if (!userId || isLoading) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, userId, isLoading]);

  const monthData = state.months[currentMonth] ?? { bills: [], incomes: [] };

  // ── Ensure Month ──────────────────────────────────────────────────────────

  const ensureMonth = useCallback(async (month: string): Promise<void> => {
    if (state.months[month] || !userId) return;

    const sorted    = Object.keys(state.months).sort();
    const lastKey   = sorted[sorted.length - 1];
    const last      = lastKey ? state.months[lastKey] : null;

    const newBills: Bill[] = last
      ? last.bills.map(b => ({ ...b, id: generateId(), isPaid: false, boleto: { pixCode: '', file: null }, comprovantes: [] }))
      : DEFAULT_BILLS.map(b => ({ ...b }));

    const newIncomes: Income[] = last
      ? last.incomes.map(i => ({ ...i, id: generateId() }))
      : DEFAULT_INCOMES.map(i => ({ ...i }));

    const newData: MonthData = { bills: newBills, incomes: newIncomes };

    // Optimistic local update first
    setState(prev => ({ ...prev, months: { ...prev.months, [month]: newData } }));

    // Persist in background
    await Promise.all([
      newBills.length   ? supabase.from('bills').upsert(newBills.map((b, i) => toDbBill(b, month, i, userId)))     : null,
      newIncomes.length ? supabase.from('incomes').upsert(newIncomes.map(i => toDbIncome(i, month, userId)))        : null,
    ].filter(Boolean));
  }, [state.months, userId]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const navigate = useCallback((delta: number): void => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d    = new Date(y!, m! - 1 + delta, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(next);
    void ensureMonth(next);
  }, [currentMonth, ensureMonth]);

  const navigateTo = useCallback((month: string): void => {
    setCurrentMonth(month);
    void ensureMonth(month);
  }, [ensureMonth]);

  // ── Bills ─────────────────────────────────────────────────────────────────

  const saveBill = useCallback(async (bill: Bill) => {
    if (!userId) return;
    const prev  = state.months[currentMonth] ?? { bills: [], incomes: [] };
    const idx   = prev.bills.findIndex(b => b.id === bill.id);
    const bills = idx >= 0 ? prev.bills.map(b => b.id === bill.id ? bill : b) : [...prev.bills, bill];
    setState(s => ({ ...s, months: { ...s.months, [currentMonth]: { ...prev, bills } } }));
    await supabase.from('bills').upsert(toDbBill(bill, currentMonth, idx < 0 ? prev.bills.length : idx, userId));
  }, [userId, currentMonth, state.months]);

  const deleteBill = useCallback(async (id: string) => {
    if (!userId) return;
    setState(s => {
      const month = s.months[currentMonth];
      if (!month) return s;
      return { ...s, months: { ...s.months, [currentMonth]: { ...month, bills: month.bills.filter(b => b.id !== id) } } };
    });
    await supabase.from('bills').delete().eq('id', id);
  }, [userId, currentMonth]);

  const togglePaid = useCallback(async (id: string) => {
    if (!userId) return;
    const month = state.months[currentMonth];
    if (!month) return;
    const bill = month.bills.find(b => b.id === id);
    if (!bill) return;

    const updated = { ...bill, isPaid: !bill.isPaid };
    const bills   = updated.isPaid
      ? [...month.bills.filter(b => b.id !== id), updated]
      : month.bills.map(b => b.id === id ? updated : b);

    setState(s => ({ ...s, months: { ...s.months, [currentMonth]: { ...month, bills } } }));
    await supabase.from('bills').update({ is_paid: updated.isPaid }).eq('id', id);
    if (updated.isPaid) {
      await Promise.all(bills.map((b, i) => supabase.from('bills').update({ sort_order: i }).eq('id', b.id)));
    }
  }, [userId, currentMonth, state.months]);

  const reorderBills = useCallback(async (activeId: string, overId: string) => {
    if (!userId) return;
    const month = state.months[currentMonth];
    if (!month) return;

    const bills = [...month.bills];
    const from  = bills.findIndex(b => b.id === activeId);
    const to    = bills.findIndex(b => b.id === overId);
    if (from === -1 || to === -1 || from === to) return;
    const [moved] = bills.splice(from, 1);
    bills.splice(to, 0, moved!);

    setState(s => ({ ...s, months: { ...s.months, [currentMonth]: { ...month, bills } } }));
    await Promise.all(bills.map((b, i) => supabase.from('bills').update({ sort_order: i }).eq('id', b.id)));
  }, [userId, currentMonth, state.months]);

  // ── Incomes ───────────────────────────────────────────────────────────────

  const saveIncome = useCallback(async (income: Income) => {
    if (!userId) return;
    const prev    = state.months[currentMonth] ?? { bills: [], incomes: [] };
    const exists  = prev.incomes.some(i => i.id === income.id);
    const incomes = exists ? prev.incomes.map(i => i.id === income.id ? income : i) : [...prev.incomes, income];
    setState(s => ({ ...s, months: { ...s.months, [currentMonth]: { ...prev, incomes } } }));
    await supabase.from('incomes').upsert(toDbIncome(income, currentMonth, userId));
  }, [userId, currentMonth, state.months]);

  const deleteIncome = useCallback(async (id: string) => {
    if (!userId) return;
    setState(s => {
      const month = s.months[currentMonth];
      if (!month) return s;
      return { ...s, months: { ...s.months, [currentMonth]: { ...month, incomes: month.incomes.filter(i => i.id !== id) } } };
    });
    await supabase.from('incomes').delete().eq('id', id);
  }, [userId, currentMonth]);

  // ── Tags ──────────────────────────────────────────────────────────────────

  const saveTag = useCallback(async (tag: Tag) => {
    if (!userId) return;
    setState(s => {
      const exists = s.tags.some(t => t.id === tag.id);
      return { ...s, tags: exists ? s.tags.map(t => t.id === tag.id ? tag : t) : [...s.tags, tag] };
    });
    await supabase.from('tags').upsert(toDbTag(tag, userId));
  }, [userId]);

  const deleteTag = useCallback(async (id: string) => {
    if (!userId) return;

    // Collect bills that reference this tag (across all months)
    const affectedBills: { id: string; tagIds: string[] }[] = [];
    for (const md of Object.values(state.months)) {
      for (const b of md.bills) {
        if (b.tagIds.includes(id)) affectedBills.push({ id: b.id, tagIds: b.tagIds.filter(t => t !== id) });
      }
    }

    setState(s => {
      const tags   = s.tags.filter(t => t.id !== id);
      const months: AppState['months'] = {};
      for (const [k, v] of Object.entries(s.months)) {
        months[k] = { ...v, bills: v.bills.map(b => ({ ...b, tagIds: b.tagIds.filter(tid => tid !== id) })) };
      }
      return { ...s, tags, months };
    });

    await Promise.all([
      supabase.from('tags').delete().eq('id', id),
      ...affectedBills.map(b => supabase.from('bills').update({ tag_ids: b.tagIds }).eq('id', b.id)),
    ]);
  }, [userId, state.months]);

  return {
    state, currentMonth, monthData, isLoading, loadError,
    navigate, navigateTo,
    togglePaid, reorderBills,
    saveBill, deleteBill,
    saveIncome, deleteIncome,
    saveTag, deleteTag,
    retry,
  };
}
