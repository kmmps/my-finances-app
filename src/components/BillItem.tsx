import { Zap, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatCurrency } from '../utils';
import Badge from './ui/Badge';
import type { AttachTab, Bill, Tag } from '../types';

interface Props {
  bill:          Bill;
  tags:          Tag[];
  currentMonth:  string;
  onTogglePaid:  (id: string) => void;
  onOpenAttach:  (bill: Bill, tab: AttachTab) => void;
}

export default function BillItem({ bill, tags, currentMonth, onTogglePaid, onOpenAttach }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bill.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const billTags       = tags.filter(t => bill.tagIds.includes(t.id));
  const hasBoleto      = !!(bill.boleto.pixCode || bill.boleto.file);
  const hasComprovante = bill.comprovantes.length > 0;

  const monthStr = currentMonth.split('-')[1] ?? '';
  const dueDateDisplay = `${String(bill.dueDay).padStart(2, '0')}/${monthStr}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-center gap-2 px-3 py-3 border-b border-gray-800/40 last:border-0 select-none',
        isDragging ? 'opacity-0' : '',
        !isDragging && bill.isPaid ? 'opacity-60' : '',
      ].join(' ')}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Arrastar para reordenar"
        className="shrink-0 p-1 text-gray-700 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none transition-colors"
      >
        <GripVertical size={14} />
      </button>

      {/* Checkbox */}
      <button
        onClick={() => onTogglePaid(bill.id)}
        className={[
          'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
          bill.isPaid
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-gray-600 hover:border-emerald-500',
        ].join(' ')}
      >
        {bill.isPaid && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Content — tapping opens attachments modal */}
      <button
        onClick={() => onOpenAttach(bill, 'boleto')}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-sm font-medium leading-tight ${bill.isPaid ? 'line-through text-gray-500' : 'text-gray-100'}`}>
            {bill.name}
          </span>
          {bill.isAutoDebit && (
            <span title="Débito automático"><Zap size={11} className="text-amber-400 shrink-0" /></span>
          )}
          {hasBoleto && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" title="Boleto/Pix anexado" />
          )}
          {hasComprovante && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Comprovante anexado" />
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[11px] text-gray-500">{dueDateDisplay}</span>
          {billTags.map(tag => <Badge key={tag.id} tag={tag} small />)}
          {bill.note && (
            <span className="text-[11px] text-gray-600 italic truncate max-w-[120px]">{bill.note}</span>
          )}
        </div>
      </button>

      {/* Amount */}
      <span className={`text-sm font-bold tabular-nums shrink-0 ${bill.isPaid ? 'text-emerald-500' : 'text-gray-200'}`}>
        {formatCurrency(bill.amount)}
      </span>
    </div>
  );
}
