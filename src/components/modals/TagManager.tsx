import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import type { Tag } from '../../types';
import { generateId } from '../../utils';

type TagColor = Tag['color'];

interface Props {
  tags: Tag[];
  tagUsageCounts: Record<string, number>;
  onSave: (tag: Tag) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const COLOR_OPTIONS: TagColor[] = ['blue', 'purple', 'green', 'yellow', 'pink', 'red', 'orange', 'teal', 'indigo', 'gray'];

const colorDot: Record<TagColor, string> = {
  blue:   'bg-blue-500',
  purple: 'bg-purple-500',
  green:  'bg-green-500',
  yellow: 'bg-yellow-500',
  pink:   'bg-pink-500',
  red:    'bg-red-500',
  orange: 'bg-orange-500',
  teal:   'bg-teal-500',
  indigo: 'bg-indigo-500',
  gray:   'bg-gray-500',
};

const colorRing: Record<TagColor, string> = {
  blue:   'ring-blue-400',
  purple: 'ring-purple-400',
  green:  'ring-green-400',
  yellow: 'ring-yellow-400',
  pink:   'ring-pink-400',
  red:    'ring-red-400',
  orange: 'ring-orange-400',
  teal:   'ring-teal-400',
  indigo: 'ring-indigo-400',
  gray:   'ring-gray-400',
};

const PRESET_EMOJIS = [
  '🏠', '🚗', '💳', '❤️', '🛡️', '📋', '👤', '💡', '🏢', '📱',
  '🎓', '🍽️', '✈️', '💊', '🎮', '🛒', '💰', '📊', '🎯', '🔧',
  '📦', '🏋️', '🎵', '🐾', '🌱', '🔑', '⚡', '🧾', '🏦', '📺',
];

interface EditState { tag: Tag; isNew: boolean }

export default function TagManager({ tags, tagUsageCounts, onSave, onDelete, onClose }: Props) {
  const [editing, setEditing] = useState<EditState | null>(null);

  const startNew = () => setEditing({
    tag: { id: generateId(), name: '', color: 'blue', emoji: '🏷️' },
    isNew: true,
  });

  const commitEdit = () => {
    if (!editing || !editing.tag.name.trim()) return;
    onSave(editing.tag);
    setEditing(null);
  };

  const handleDelete = (tag: Tag) => {
    const count = tagUsageCounts[tag.id] ?? 0;
    if (count > 0) return; // button is disabled; shouldn't reach here
    if (confirm(`Excluir categoria "${tag.name}"?`)) {
      onDelete(tag.id);
    }
  };

  return (
    <Modal title="Categorias" onClose={onClose}>
      <div className="space-y-2">
        {tags.map(tag => {
          const count = tagUsageCounts[tag.id] ?? 0;
          const isEditing = editing?.tag.id === tag.id;

          if (isEditing) {
            return (
              <EditForm
                key={tag.id}
                tag={editing!.tag}
                onChange={t => setEditing({ ...editing!, tag: t })}
                onCommit={commitEdit}
                onCancel={() => setEditing(null)}
              />
            );
          }

          return (
            <div key={tag.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-800/60 rounded-xl group hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                {/* Emoji circle */}
                <div className={`w-9 h-9 rounded-xl ${colorDot[tag.color]} bg-opacity-20 flex items-center justify-center text-lg shrink-0`}>
                  {tag.emoji}
                </div>
                {/* Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">{tag.name}</span>
                    <span className={`w-2 h-2 rounded-full ${colorDot[tag.color]} shrink-0`} />
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {count === 0 ? 'Sem contas' : `${count} conta${count !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditing({ tag: { ...tag }, isNew: false })}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-blue-400/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(tag)}
                  disabled={count > 0}
                  title={count > 0 ? `Não pode excluir: ${count} conta(s) vinculada(s)` : 'Excluir categoria'}
                  className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                    count > 0
                      ? 'text-gray-700 cursor-not-allowed'
                      : 'text-gray-600 hover:text-red-400 hover:bg-red-400/10'
                  }`}
                >
                  {count > 0 ? <AlertCircle size={14} /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          );
        })}

        {/* New tag form */}
        {editing?.isNew && (
          <EditForm
            tag={editing.tag}
            onChange={t => setEditing({ ...editing, tag: t })}
            onCommit={commitEdit}
            onCancel={() => setEditing(null)}
          />
        )}

        {/* Add button */}
        {!editing && (
          <button
            onClick={startNew}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-700 rounded-xl text-sm text-gray-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
          >
            <Plus size={16} /> Nova categoria
          </button>
        )}
      </div>
    </Modal>
  );
}

function EditForm({
  tag, onChange, onCommit, onCancel,
}: {
  tag: Tag;
  onChange: (t: Tag) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const [emojiInput, setEmojiInput] = useState(tag.emoji);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const setEmoji = (e: string) => {
    setEmojiInput(e);
    onChange({ ...tag, emoji: e });
    setShowEmojiPicker(false);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-3 border border-gray-700">
      {/* Emoji + Name row */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(v => !v)}
          className="w-11 h-11 rounded-xl bg-gray-700 hover:bg-gray-600 text-2xl flex items-center justify-center shrink-0 transition-colors"
          title="Escolher emoji"
        >
          {tag.emoji}
        </button>
        <input
          type="text"
          value={tag.name}
          onChange={e => onChange({ ...tag, name: e.target.value })}
          onKeyDown={e => { if (e.key === 'Enter') onCommit(); if (e.key === 'Escape') onCancel(); }}
          placeholder="Nome da categoria"
          className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          autoFocus
        />
      </div>

      {/* Emoji picker grid */}
      {showEmojiPicker && (
        <div className="bg-gray-700 rounded-xl p-2">
          <div className="flex gap-1 mb-2">
            <input
              type="text"
              value={emojiInput}
              onChange={e => { setEmojiInput(e.target.value); if ([...e.target.value].length === 1) setEmoji(e.target.value); }}
              placeholder="Ou digite um emoji..."
              className="flex-1 bg-gray-600 border border-gray-500 rounded-lg px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-10 gap-0.5">
            {PRESET_EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`text-lg p-1 rounded-lg hover:bg-gray-600 transition-colors ${tag.emoji === e ? 'bg-gray-600' : ''}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color picker */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Cor</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...tag, color: c })}
              className={`w-7 h-7 rounded-full ${colorDot[c]} transition-all ${
                tag.color === c
                  ? `ring-2 ring-offset-2 ring-offset-gray-800 ${colorRing[c]} scale-110`
                  : 'opacity-50 hover:opacity-90'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2 py-2 px-3 bg-gray-700 rounded-xl">
        <span className="text-xs text-gray-400">Pré-visualização:</span>
        <span className={`tag-${tag.color} rounded-full text-xs px-2 py-0.5 flex items-center gap-1`}>
          <span>{tag.emoji}</span>
          <span>{tag.name || 'Nome'}</span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors">
          <X size={13} /> Cancelar
        </button>
        <button
          onClick={onCommit}
          disabled={!tag.name.trim()}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40 transition-colors"
        >
          <Check size={13} /> Salvar
        </button>
      </div>
    </div>
  );
}
