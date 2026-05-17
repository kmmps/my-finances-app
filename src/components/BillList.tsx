import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import BillItem from './BillItem';
import SwipeableRow from './SwipeableRow';
import type { AttachTab, Bill, Tag, FilterType } from '../types';

interface Props {
  bills: Bill[];
  tags: Tag[];
  filter: FilterType;
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

export default function BillList({ bills, tags, filter, onTogglePaid, onEdit, onDelete, onOpenAttach, onReorder, onAdd }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor,  { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,    { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const filtered = applyFilter(bills, filter);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  };

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {filtered.map(bill => (
              <SwipeableRow
                key={bill.id}
                id={bill.id}
                onEdit={() => onEdit(bill)}
                onDelete={() => onDelete(bill.id)}
              >
                <BillItem
                  bill={bill}
                  tags={tags}
                  onTogglePaid={onTogglePaid}
                  onEdit={onEdit}
                  onOpenAttach={onOpenAttach}
                />
              </SwipeableRow>
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
