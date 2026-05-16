import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import type { Bill, Tag } from '../../types';
import { generateId } from '../../utils';

interface Props {
  bill: Bill | null;
  tags: Tag[];
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

export default function BillModal({ bill, tags, onSave, onDelete, onClose }: Props) {
  const isNew = !bill;
  const [form, setForm] = useState<Bill>(bill ?? { ...EMPTY_BILL, id: generateId() });

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

  const handleDelete = () => {
    if (bill && confirm(`Excluir "${bill.name}"?`)) {
      onDelete(bill.id);
      onClose();
    }
  };

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors';
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

  return (
    <Modal
      title={isNew ? 'Nova conta' : 'Editar conta'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {!isNew && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 size={14} /> Excluir
            </button>
          )}
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
            Cancelar
          </button>
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
            <label className={labelCls}>Dia de vencimento</label>
            <input
              type="number"
              value={form.dueDay}
              onChange={e => set('dueDay', Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
              min="1"
              max="31"
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
  );
}
