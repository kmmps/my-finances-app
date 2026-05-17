import { useState } from 'react';
import { Eye, EyeOff, Key, LogOut, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';

interface Props {
  userEmail: string;
  onUpdatePassword: (newPassword: string) => Promise<boolean>;
  onLogout: () => Promise<void>;
  onClose: () => void;
}

export default function SettingsModal({ userEmail, onUpdatePassword, onLogout, onClose }: Props) {
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNew,   setShowNew]   = useState(false);
  const [showCnf,   setShowCnf]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPw.length < 6)    { setError('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    if (newPw !== confirmPw) { setError('As senhas não conferem.'); return; }
    setLoading(true);
    const ok = await onUpdatePassword(newPw);
    setLoading(false);
    if (ok) {
      setSuccess(true);
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setSuccess(false), 4000);
    } else {
      setError('Erro ao alterar a senha. Tente novamente.');
    }
  };

  const PwField = ({
    label, value, onChange, show, onToggle, placeholder, autoComplete,
  }: {
    label: string; value: string; onChange: (v: string) => void;
    show: boolean; onToggle: () => void; placeholder: string; autoComplete?: string;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => { onChange(e.target.value); setError(null); }}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 pr-10 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-0.5">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );

  return (
    <Modal title="Configurações" onClose={onClose}>
      <div className="space-y-4">

        {/* ── Conta ── */}
        <div className="bg-gray-800/50 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
            <Mail size={14} className="text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">Conta</p>
            <p className="text-sm text-gray-200 truncate">{userEmail}</p>
          </div>
        </div>

        {/* ── Trocar senha ── */}
        <div className="bg-gray-800/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-emerald-500/15 rounded-lg flex items-center justify-center">
              <Key size={14} className="text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">Trocar senha</h3>
          </div>

          <form onSubmit={handleChange} className="space-y-3">
            <PwField
              label="Nova senha" value={newPw} onChange={setNewPw}
              show={showNew} onToggle={() => setShowNew(v => !v)}
              placeholder="Mínimo 6 caracteres" autoComplete="new-password"
            />
            <PwField
              label="Confirmar nova senha" value={confirmPw} onChange={setConfirmPw}
              show={showCnf} onToggle={() => setShowCnf(v => !v)}
              placeholder="Repita a nova senha" autoComplete="new-password"
            />

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-400">Senha alterada com sucesso!</p>
              </div>
            )}

            <button type="submit" disabled={loading || !newPw || !confirmPw}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow shadow-emerald-500/20">
              {loading
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Alterando...</>
                : 'Trocar senha'}
            </button>
          </form>
        </div>

        {/* ── Sessão ── */}
        <div className="bg-gray-800/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center">
              <LogOut size={14} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">Sessão</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            A sessão persiste entre dispositivos. Para sair agora:
          </p>
          <button
            onClick={() => void onLogout()}
            className="w-full py-2.5 rounded-xl bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> Sair da conta
          </button>
        </div>

      </div>
    </Modal>
  );
}
