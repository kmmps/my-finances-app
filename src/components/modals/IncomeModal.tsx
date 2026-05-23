import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import ConfirmModal from './ConfirmModal';
import type { Income } from '../../types';
import { generateId } from '../../utils';

interface Props {
  income: Income | null;
  onSave: (income: Income) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function IncomeModal({ income, onSave, onDelete, onClose }: Props) {
  const isNew = !income;
  const [form, setForm] = useState<Income>(
    income ?? { id: generateId(), name: '', amount: 0, type: 'extra' }
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const set = <K extends keyof Income>(key: K, value: Income[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim() || form.amount <= 0) return;
    onSave(form);
    onClose();
  };

  const handleDeleteConfirmed = () => {
    if (income) { onDelete(income.id); onClose(); }
  };

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors';
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

  return (
    <>
      <Modal
        title={isNew ? 'Nova renda' : 'Editar renda'}
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
              placeholder="Ex: Salário"
              className={inputCls}
              autoFocus
            />
          </div>

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
            <label className={labelCls}>Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {(['base', 'extra'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set('type', type)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                    form.type === type
                      ? type === 'base'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {type === 'base' ? 'Salário base' : 'Extra / bônus'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {showConfirm && income && (
        <ConfirmModal
          title="Excluir renda"
          message={`Tem certeza que deseja excluir "${income.name}"?`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
