import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import ConfirmModal from './ConfirmModal';
import type { Bill, Tag } from '../../types';
import { generateId } from '../../utils';

interface Props {
  bill: Bill | null;
  tags: Tag[];
  currentMonth: string;
  onSave: (bill: Bill) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const EMPTY_BILL: Omit<Bill, 'id'> = {
  name: '',
  amount: 0,
  dueDay: 1,
  tagIds: [],
  isPaid: false,
  isAutoDebit: false,
  boleto: { pixCode: '', file: null },
  comprovantes: [],
  note: '',
};

export default function BillModal({ bill, tags, currentMonth, onSave, onDelete, onClose }: Props) {
  const isNew = !bill;
  const [form, setForm] = useState<Bill>(bill ?? { ...EMPTY_BILL, id: generateId() });
  const [showConfirm, setShowConfirm] = useState(false);

  const set = <K extends keyof Bill>(key: K, value: Bill[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const toggleTag = (tagId: string) => {
    setForm(f => ({
      ...f,
      tagIds: f.tagIds.includes(tagId)
        ? f.tagIds.filter(id => id !== tagId)
        : [...f.tagIds, tagId],
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim() || form.amount <= 0) return;
    onSave(form);
    onClose();
  };

  const handleDeleteConfirmed = () => {
    if (bill) { onDelete(bill.id); onClose(); }
  };

  // Compute a valid date value for the current month + dueDay
  const [year, monthNum] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year!, monthNum!, 0).getDate();
  const clampedDay = Math.min(form.dueDay, daysInMonth);
  const dateValue = `${currentMonth}-${String(clampedDay).padStart(2, '0')}`;

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors';
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

  return (
    <>
      <Modal
        title={isNew ? 'Nova conta' : 'Editar conta'}
        onClose={onClose}
        footer={
          <div className="flex gap-2">
            {!isNew && (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 size={14} /> Excluir
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || form.amount <= 0}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-emerald-500 text-white font-medium hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Salvar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ex: Aluguel"
              className={inputCls}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Valor (R$) *</label>
              <input
                type="number"
                value={form.amount || ''}
                onChange={e => set('amount', parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                min="0"
                step="0.01"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Vencimento</label>
              <input
                type="date"
                value={dateValue}
                onChange={e => {
                  const parts = e.target.value.split('-');
                  const day = parseInt(parts[2] ?? '1') || 1;
                  set('dueDay', Math.min(31, Math.max(1, day)));
                }}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`tag-${tag.color} rounded-full text-xs px-3 py-1 transition-all flex items-center gap-1 ${
                    form.tagIds.includes(tag.id)
                      ? 'ring-2 ring-offset-1 ring-offset-gray-900 ring-current'
                      : 'opacity-50'
                  }`}
                >
                  <span>{tag.emoji}</span>{tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => set('isAutoDebit', !form.isAutoDebit)}
                className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center px-0.5 ${
                  form.isAutoDebit ? 'bg-amber-500' : 'bg-gray-700'
                }`}
                style={{ height: '22px' }}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isAutoDebit ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm text-gray-300">Débito automático</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => set('isPaid', !form.isPaid)}
                className={`w-10 rounded-full transition-colors relative flex items-center px-0.5 ${
                  form.isPaid ? 'bg-emerald-500' : 'bg-gray-700'
                }`}
                style={{ height: '22px' }}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isPaid ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm text-gray-300">Paga</span>
            </label>
          </div>

          <div>
            <label className={labelCls}>Observação</label>
            <input
              type="text"
              value={form.note}
              onChange={e => set('note', e.target.value)}
              placeholder="Opcional..."
              className={inputCls}
            />
          </div>
        </div>
      </Modal>

      {showConfirm && bill && (
        <ConfirmModal
          title="Excluir conta"
          message={`Tem certeza que deseja excluir "${bill.name}"?`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
