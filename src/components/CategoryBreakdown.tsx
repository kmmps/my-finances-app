import { formatCurrency } from '../utils';
import type { Bill, Tag } from '../types';

interface Props {
  bills: Bill[];
  tags: Tag[];
}

interface CategoryStat {
  tag: Tag;
  total: number;
  paid: number;
  count: number;
}

export default function CategoryBreakdown({ bills, tags }: Props) {
  const totalExpenses = bills.reduce((s, b) => s + b.amount, 0);

  const stats: CategoryStat[] = tags
    .map(tag => {
      const tagBills = bills.filter(b => b.tagIds.includes(tag.id));
      return {
        tag,
        total: tagBills.reduce((s, b) => s + b.amount, 0),
        paid: tagBills.filter(b => b.isPaid).reduce((s, b) => s + b.amount, 0),
        count: tagBills.length,
      };
    })
    .filter(s => s.count > 0)
    .sort((a, b) => b.total - a.total);

  if (stats.length === 0) return null;

  const colorBar: Record<string, string> = {
    blue:   'bg-blue-500',
    purple: 'bg-purple-500',
    green:  'bg-green-500',
    yellow: 'bg-yellow-500',
    pink:   'bg-pink-500',
    red:    'bg-red-500',
    orange: 'bg-orange-500',
    teal:   'bg-teal-500',
    indigo: 'bg-indigo-500',
    gray:   'bg-gray-500',
  };

  const colorText: Record<string, string> = {
    blue:   'text-blue-400',
    purple: 'text-purple-400',
    green:  'text-green-400',
    yellow: 'text-yellow-400',
    pink:   'text-pink-400',
    red:    'text-red-400',
    orange: 'text-orange-400',
    teal:   'text-teal-400',
    indigo: 'text-indigo-400',
    gray:   'text-gray-400',
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-200">Por categoria</h2>
      </div>

      {/* Stacked bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {stats.map(s => {
            const pct = totalExpenses > 0 ? (s.total / totalExpenses) * 100 : 0;
            return (
              <div
                key={s.tag.id}
                title={`${s.tag.name}: ${formatCurrency(s.total)}`}
                className={`${colorBar[s.tag.color] ?? 'bg-gray-500'} rounded-full transition-all`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2.5">
        {stats.map(s => {
          const pct = totalExpenses > 0 ? (s.total / totalExpenses) * 100 : 0;
          const paidPct = s.total > 0 ? (s.paid / s.total) * 100 : 0;

          return (
            <div key={s.tag.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${colorBar[s.tag.color] ?? 'bg-gray-500'}`} />
                  <span className={`text-xs font-medium ${colorText[s.tag.color] ?? 'text-gray-400'}`}>
                    {s.tag.name}
                  </span>
                  <span className="text-[10px] text-gray-600">{s.count} conta{s.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-200">{formatCurrency(s.total)}</span>
                  <span className="text-[10px] text-gray-500 ml-1">{pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${colorBar[s.tag.color] ?? 'bg-gray-500'} opacity-60 transition-all`}
                  style={{ width: `${paidPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
