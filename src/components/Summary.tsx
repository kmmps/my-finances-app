import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Wallet,
  ChevronDown, ChevronUp,
  Pencil, Trash2, Plus,
} from 'lucide-react';
import { formatCurrency } from '../utils';
import type { Bill, Income } from '../types';

interface Props {
  bills: Bill[];
  incomes: Income[];
  onAddIncome: () => void;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
}

export default function Summary({ bills, incomes, onAddIncome, onEditIncome, onDeleteIncome }: Props) {
  const [open, setOpen] = useState(false);

  const totalIncome   = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = bills.reduce((s, b) => s + b.amount, 0);
  const paidExpenses  = bills.filter(b => b.isPaid).reduce((s, b) => s + b.amount, 0);
  const balance       = totalIncome - totalExpenses;
  const progress      = totalIncome > 0 ? Math.min((paidExpenses / totalIncome) * 100, 100) : 0;
  const expenseRatio  = totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0;
  const balanceColor  = balance >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="space-y-3">
      {/*
        Mobile:  2-col grid  → Receita ocupa col-span-2 (linha 1 inteira)
                               Gastos + Saldo lado a lado (linha 2)
        Desktop: 3-col grid  → Receita, Gastos, Saldo lado a lado (igual ao pedido)
        items-start: evita que Gastos/Saldo se estiquem quando Receita expande
      */}
      <div className="grid grid-cols-2 gap-2 items-start">

        {/* ── RECEITA (collapsible) ──────────────────────────────────── */}
        <div className="col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {/* Header — sempre visível */}
          <button
            onClick={() => setOpen(v => !v)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <TrendingUp size={13} className="text-emerald-400 shrink-0" />
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Receita</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm font-bold text-emerald-400 tabular-nums">
                {formatCurrency(totalIncome)}
              </span>
              {open
                ? <ChevronUp   size={13} className="text-gray-500 shrink-0" />
                : <ChevronDown size={13} className="text-gray-500 shrink-0" />}
            </div>
          </button>

          {/* Breakdown expandido */}
          {open && (
            <div className="border-t border-gray-800">
              {incomes.map(income => (
                <div
                  key={income.id}
                  className="flex items-center justify-between px-3 py-2 group hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      income.type === 'base' ? 'bg-emerald-400' : 'bg-blue-400'
                    }`} />
                    <span className="text-xs text-gray-300 truncate">{income.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className="text-xs font-semibold text-gray-100 tabular-nums">
                      {formatCurrency(income.amount)}
                    </span>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditIncome(income)}
                        className="p-1 rounded text-gray-600 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={() => onDeleteIncome(income.id)}
                        className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="px-3 py-2 border-t border-gray-800/60">
                <button
                  onClick={onAddIncome}
                  className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-emerald-400 transition-colors"
                >
                  <Plus size={12} /> Adicionar renda
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── GASTOS ────────────────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={13} className="text-red-400" />
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Gastos</span>
          </div>
          <p className="text-sm font-bold text-red-400 tabular-nums">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="mt-1.5 text-[10px] text-gray-500">{expenseRatio.toFixed(0)}% da receita</p>
        </div>

        {/* ── SALDO ─────────────────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet size={13} className="text-blue-400" />
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Saldo</span>
          </div>
          <p className={`text-sm font-bold tabular-nums ${balanceColor}`}>
            {formatCurrency(balance)}
          </p>
          <p className="mt-1.5 text-[10px] text-gray-500">
            {bills.filter(b => b.isPaid).length}/{bills.length} pagas
          </p>
        </div>

      </div>

      {/* ── Barra de progresso ────────────────────────────────────────── */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400 font-medium">Pago este mês</span>
          <span className="text-xs font-bold text-gray-200 tabular-nums">
            {formatCurrency(paidExpenses)}{' '}
            <span className="text-gray-500 font-normal">de</span>{' '}
            {formatCurrency(totalExpenses)}
          </span>
        </div>
        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-gray-500">{progress.toFixed(0)}% concluído</span>
          <span className="text-[10px] text-gray-500 tabular-nums">
            Restante: {formatCurrency(totalExpenses - paidExpenses)}
          </span>
        </div>
      </div>
    </div>
  );
}
