import { ChevronLeft, ChevronRight, Tag, CalendarDays } from 'lucide-react';
import { formatMonthLabel } from '../utils';

interface Props {
  currentMonth: string;
  onNavigate: (delta: number) => void;
  onOpenTags: () => void;
  onOpenPicker: () => void;
}

export default function Header({ currentMonth, onNavigate, onOpenTags, onOpenPicker }: Props) {
  return (
    <header className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur border-b border-gray-800/60">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-emerald-400 text-lg">💰</span>
          <span className="font-bold text-gray-100 text-sm hidden sm:block tracking-tight">Minhas Finanças</span>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onNavigate(-1)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={17} />
          </button>

          <button
            onClick={onOpenPicker}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-800 transition-colors group"
            title="Selecionar mês"
          >
            <span className="text-sm font-semibold text-gray-100 capitalize min-w-[130px] text-center">
              {formatMonthLabel(currentMonth)}
            </span>
            <CalendarDays size={13} className="text-gray-500 group-hover:text-emerald-400 transition-colors shrink-0" />
          </button>

          <button
            onClick={() => onNavigate(1)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Actions */}
        <button
          onClick={onOpenTags}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors shrink-0"
          title="Gerenciar categorias"
        >
          <Tag size={17} />
        </button>
      </div>
    </header>
  );
}
