import type { FilterType } from '../types';

interface Props {
  active: FilterType;
  onChange: (f: FilterType) => void;
  counts: Record<FilterType, number>;
}

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all',         label: 'Todas'   },
  { id: 'pending',     label: 'Pendente' },
  { id: 'paid',        label: 'Pagas'   },
  { id: 'auto-debit',  label: 'Déb. Auto' },
];

export default function FilterBar({ active, onChange, counts }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
      {FILTERS.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            active === f.id
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          {f.label}
          <span className={`text-[10px] rounded-full px-1.5 min-w-[18px] text-center ${
            active === f.id ? 'bg-white/20 text-white' : 'bg-gray-700 text-gray-400'
          }`}>
            {counts[f.id]}
          </span>
        </button>
      ))}
    </div>
  );
}
