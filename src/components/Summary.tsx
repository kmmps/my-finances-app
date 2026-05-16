import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react';
import { formatCurrency } from '../utils';
import type { Bill, Income } from '../types';

interface Props {
  bills: Bill[];
  incomes: Income[];
  onAddIncome: () => void;
}

export default function Summary({ bills, incomes, onAddIncome }: Props) {
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
        Mobile:  Receita ocupa as 2 colunas inteiras (linha 1)
                 Gastos e Saldo ficam lado a lado (linha 2)
        Desktop: grid de 3 colunas igual — sm:col-span-1 restaura o comportamento
      */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

        {/* ── Receita ── */}
        <div className="col-span-2 sm:col-span-1 bg-gray-900 rounded-xl p-3 border border-gray-800">
          {/*
            Mobile (flex): label à esquerda, valor à direita
            Desktop (sm:block): label acima, valor abaixo — igual aos outros cards
          */}
          <div className="flex items-center justify-between sm:block">
            <div className="flex items-center gap-1.5 sm:mb-1">
              <TrendingUp size={13} className="text-emerald-400" />
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Receita</span>
            </div>
            <p className="text-sm font-bold text-emerald-400 tabular-nums">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <button
            onClick={onAddIncome}
            className="mt-1.5 flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-emerald-400 transition-colors"
          >
            <Plus size={11} /> add
          </button>
        </div>

        {/* ── Gastos ── */}
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

        {/* ── Saldo ── */}
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

      {/* Progress bar */}
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
