import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '../utils';
import type { Income } from '../types';

interface Props {
  incomes: Income[];
  onAdd: () => void;
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
}

export default function IncomeSection({ incomes, onAdd, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = incomes.reduce((s, i) => s + i.amount, 0);
  const base  = incomes.filter(i => i.type === 'base').reduce((s, i) => s + i.amount, 0);
  const extra = total - base;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* ── Header row ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-gray-200 shrink-0">Renda</span>

          {/* Pills: só valores, sem rótulo "Base"/"Extra" */}
          <div className="flex items-center gap-1.5 min-w-0">
            {base > 0 && (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-full px-2 py-0.5 font-medium tabular-nums whitespace-nowrap">
                {formatCurrency(base)}
              </span>
            )}
            {extra > 0 && (
              <>
                <span className="text-[10px] text-gray-600">+</span>
                <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/25 rounded-full px-2 py-0.5 font-medium tabular-nums whitespace-nowrap">
                  {formatCurrency(extra)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-sm font-bold text-emerald-400 tabular-nums">{formatCurrency(total)}</span>
          {expanded
            ? <ChevronUp  size={15} className="text-gray-500" />
            : <ChevronDown size={15} className="text-gray-500" />}
        </div>
      </button>

      {/* ── Expanded list ── */}
      {expanded && (
        <div className="border-t border-gray-800">
          {incomes.map(income => (
            <div
              key={income.id}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-800/30 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${income.type === 'base' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                <span className="text-sm text-gray-200">{income.name}</span>
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${
                  income.type === 'base'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-blue-500/15 text-blue-400'
                }`}>
                  {income.type === 'base' ? 'base' : 'extra'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-100 tabular-nums">
                  {formatCurrency(income.amount)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(income)}
                    className="p-1 rounded text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(income.id)}
                    className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="px-4 py-2.5 border-t border-gray-800/50">
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-400 transition-colors"
            >
              <Plus size={14} /> Adicionar renda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
