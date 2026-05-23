import { useState } from 'react';
import { Plus, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import BillItem from './BillItem';
import SwipeableRow from './SwipeableRow';
import { formatCurrency } from '../utils';
import type { AttachTab, Bill, Tag, FilterType } from '../types';

interface Props {
  bills: Bill[];
  tags: Tag[];
  filter: FilterType;
  currentMonth: string;
  onTogglePaid: (id: string) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (id: string) => void;
  onOpenAttach: (bill: Bill, tab: AttachTab) => void;
  onReorder: (activeId: string, overId: string) => void;
  onAdd: () => void;
}

function applyFilter(bills: Bill[], filter: FilterType): Bill[] {
  switch (filter) {
    case 'pending':    return bills.filter(b => !b.isPaid);
    case 'paid':       return bills.filter(b => b.isPaid);
    case 'auto-debit': return bills.filter(b => b.isAutoDebit);
    default:           return bills;
  }
}

export default function BillList({ bills, tags, filter, currentMonth, onTogglePaid, onEdit, onDelete, onOpenAttach, onReorder, onAdd }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor,  { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,    { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const filtered = applyFilter(bills, filter);
  const activeBill = activeId ? filtered.find(b => b.id === activeId) ?? null : null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  };

  const monthStr = currentMonth.split('-')[1] ?? '';

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-200">Contas</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/15 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={13} /> Nova conta
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-gray-600 text-sm">Nenhuma conta encontrada</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filtered.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {filtered.map(bill => (
              <SwipeableRow
                key={bill.id}
                id={bill.id}
                label={bill.name}
                onEdit={() => onEdit(bill)}
                onDelete={() => onDelete(bill.id)}
              >
                <BillItem
                  bill={bill}
                  tags={tags}
                  currentMonth={currentMonth}
                  onTogglePaid={onTogglePaid}
                  onOpenAttach={onOpenAttach}
                />
              </SwipeableRow>
            ))}
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeBill && (
              <div className="flex items-center gap-2 px-3 py-3 bg-gray-800 rounded-xl shadow-2xl ring-1 ring-gray-600/50 scale-[1.02] opacity-95 select-none">
                <div className="shrink-0 p-1 text-gray-600">
                  <GripVertical size={14} />
                </div>
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  activeBill.isPaid ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'
                }`}>
                  {activeBill.isPaid && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium leading-tight block ${activeBill.isPaid ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                    {activeBill.name}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {String(activeBill.dueDay).padStart(2, '0')}/{monthStr}
                  </span>
                </div>
                <span className={`text-sm font-bold tabular-nums shrink-0 ${activeBill.isPaid ? 'text-emerald-500' : 'text-gray-200'}`}>
                  {formatCurrency(activeBill.amount)}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
