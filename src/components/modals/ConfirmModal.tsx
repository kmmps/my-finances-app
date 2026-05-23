import { useEffect } from 'react';

interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ title, message, onConfirm, onCancel }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full sm:max-w-sm bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-800 shadow-2xl animate-slideup sm:animate-none">
        <div className="px-5 pt-5 pb-2">
          <h3 className="text-base font-semibold text-gray-100">{title}</h3>
          <p className="mt-2 text-sm text-gray-400">{message}</p>
        </div>
        <div className="flex gap-2 px-5 py-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-red-500 text-white font-medium hover:bg-red-400 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
