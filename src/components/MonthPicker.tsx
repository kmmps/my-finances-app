import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface Props {
  currentMonth: string;          // "YYYY-MM"
  monthsWithData: Set<string>;   // which months have data
  onSelect: (month: string) => void;
  onClose: () => void;
}

export default function MonthPicker({ currentMonth, monthsWithData, onSelect, onClose }: Props) {
  const [year, setYear] = useState(() => parseInt(currentMonth.split('-')[0]!));
  const ref = useRef<HTMLDivElement>(null);

  const nowKey = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  })();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} className="relative w-full max-w-xs bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Year nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-800/50">
          <button
            onClick={() => setYear(y => y - 1)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-bold text-gray-100 text-base">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-2 p-3">
          {MONTHS_PT.map((abbr, idx) => {
            const key = `${year}-${String(idx + 1).padStart(2, '0')}`;
            const isSelected = key === currentMonth;
            const isNow = key === nowKey;
            const hasData = monthsWithData.has(key);

            return (
              <button
                key={key}
                title={MONTHS_FULL[idx]}
                onClick={() => { onSelect(key); onClose(); }}
                className={[
                  'relative py-2.5 rounded-xl text-sm font-medium transition-all',
                  isSelected
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : isNow
                    ? 'bg-gray-700 text-gray-100 ring-1 ring-emerald-500/50'
                    : hasData
                    ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                    : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300',
                ].join(' ')}
              >
                {abbr}
                {hasData && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 opacity-70" />
                )}
              </button>
            );
          })}
        </div>

        <div className="px-3 pb-3">
          <p className="text-center text-[10px] text-gray-600">
            • meses com dados salvos
          </p>
        </div>
      </div>
    </div>
  );
}
