import { Zap, Pencil, FileText, FileCheck2, ScanLine, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatCurrency } from '../utils';
import Badge from './ui/Badge';
import type { AttachTab, Bill, Tag } from '../types';

interface Props {
  bill: Bill;
  tags: Tag[];
  onTogglePaid: (id: string) => void;
  onEdit: (bill: Bill) => void;
  onOpenAttach: (bill: Bill, tab: AttachTab) => void;
}

export default function BillItem({ bill, tags, onTogglePaid, onEdit, onOpenAttach }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const billTags = tags.filter(t => bill.tagIds.includes(t.id));
  const hasBoleto     = !!(bill.boleto.pixCode || bill.boleto.file);
  const hasComprovante = bill.comprovantes.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group flex items-center gap-2 px-3 py-3 border-b border-gray-800/40 last:border-0 transition-colors',
        isDragging ? 'bg-gray-800 shadow-xl opacity-80 z-10' : 'hover:bg-gray-800/30',
        bill.isPaid ? 'opacity-60' : '',
      ].join(' ')}
    >
      {/* ── Drag handle ── */}
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Arrastar para reordenar"
        className="shrink-0 p-1 text-gray-700 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none transition-colors"
      >
        <GripVertical size={14} />
      </button>

      {/* ── Checkbox ── */}
      <button
        onClick={() => onTogglePaid(bill.id)}
        className={[
          'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
          bill.isPaid ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600 hover:border-emerald-500',
        ].join(' ')}
      >
        {bill.isPaid && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-sm font-medium leading-tight ${bill.isPaid ? 'line-through text-gray-500' : 'text-gray-100'}`}>
            {bill.name}
          </span>
          {bill.isAutoDebit && <span title="Débito automático"><Zap size={11} className="text-amber-400 shrink-0" /></span>}
        </div>

        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[11px] text-gray-500">dia {bill.dueDay}</span>

          {billTags.map(tag => <Badge key={tag.id} tag={tag} small />)}

          {bill.note && (
            <span className="text-[11px] text-gray-600 italic truncate max-w-[100px]">{bill.note}</span>
          )}

          {/* Boleto status badge */}
          {hasBoleto && (
            <button
              onClick={() => onOpenAttach(bill, 'boleto')}
              title="Boleto/Pix — clique para abrir"
              className="flex items-center gap-0.5 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-1.5 py-0.5 hover:bg-blue-500/20 transition-colors"
            >
              {bill.boleto.pixCode && !bill.boleto.file ? <ScanLine size={9} /> : <FileText size={9} />}
              Bol.
            </button>
          )}

          {/* Comprovante status badge */}
          {hasComprovante && (
            <button
              onClick={() => onOpenAttach(bill, 'comprovante')}
              title={`${bill.comprovantes.length} comprovante(s)`}
              className="flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-1.5 py-0.5 hover:bg-emerald-500/20 transition-colors"
            >
              <FileCheck2 size={9} />
              Comp.{bill.comprovantes.length > 1 ? ` ${bill.comprovantes.length}` : ''}
            </button>
          )}
        </div>
      </div>

      {/* ── Amount + actions ── */}
      <div className="flex items-center gap-1 shrink-0">
        <span className={`text-sm font-bold tabular-nums ${bill.isPaid ? 'text-emerald-500' : 'text-gray-200'}`}>
          {formatCurrency(bill.amount)}
        </span>

        <button
          onClick={() => onOpenAttach(bill, 'boleto')}
          className="p-1.5 rounded-lg text-gray-600 opacity-0 group-hover:opacity-100 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
          title="Anexos"
        >
          <FileText size={13} />
        </button>

        <button
          onClick={() => onEdit(bill)}
          className="p-1.5 rounded-lg text-gray-600 opacity-0 group-hover:opacity-100 hover:text-gray-100 hover:bg-gray-700 transition-all"
          title="Editar"
        >
          <Pencil size={13} />
        </button>
      </div>
    </div>
  );
}
