import { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { AuthState } from '../hooks/useAuth';

interface Props {
  mode: Exclude<AuthState, 'loading' | 'authenticated'>;
  error: string | null;
  lockoutRemaining: number;
  onSetup: (password: string) => Promise<void>;
  onLogin: (password: string) => Promise<void>;
}

export default function LoginScreen({ mode, error, lockoutRemaining, onSetup, onLogin }: Props) {
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError,  setLocalError]  = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);

  const isSetup  = mode === 'setup';
  const isLocked = mode === 'locked';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (isSetup) {
      if (password.length < 6) { setLocalError('A senha deve ter pelo menos 6 caracteres.'); return; }
      if (password !== confirm) { setLocalError('As senhas não conferem.'); return; }
      setLoading(true);
      await onSetup(password);
      setLoading(false);
    } else {
      if (!password) return;
      setLoading(true);
      await onLogin(password);
      setLoading(false);
    }
  };

  const displayError = localError || error;
  const mm = String(Math.floor(lockoutRemaining / 60)).padStart(2, '0');
  const ss = String(lockoutRemaining % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[480px] h-[480px] rounded-full bg-emerald-500/6 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4 shadow-lg shadow-emerald-500/10">
            <span className="text-3xl select-none">💰</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Minhas Finanças</h1>
          <p className="text-gray-500 text-sm mt-1">Controle financeiro pessoal</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {isLocked ? (
            /* ── Locked state ── */
            <div className="p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl">
                <Lock size={22} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-100">Acesso bloqueado</h2>
                <p className="text-xs text-gray-500 mt-1">Muitas tentativas incorretas</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 inline-flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-2xl font-mono font-bold text-amber-400 tabular-nums">
                  {mm}:{ss}
                </span>
              </div>
              <p className="text-xs text-gray-600">Aguarde para tentar novamente</p>
            </div>
          ) : (
            /* ── Login / Setup form ── */
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Icon + heading */}
              <div className="text-center mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 rounded-xl mb-3">
                  {isSetup
                    ? <ShieldCheck size={20} className="text-emerald-400" />
                    : <Lock        size={20} className="text-gray-400" />}
                </div>
                <h2 className="text-base font-semibold text-gray-100">
                  {isSetup ? 'Crie sua senha' : 'Bem-vinda de volta!'}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {isSetup
                    ? 'Proteja o app com uma senha pessoal'
                    : 'Digite sua senha para continuar'}
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setLocalError(null); }}
                    placeholder={isSetup ? 'Mínimo 6 caracteres' : '••••••••'}
                    autoComplete={isSetup ? 'new-password' : 'current-password'}
                    autoFocus
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm (setup only) */}
              {isSetup && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirmar senha</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setLocalError(null); }}
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {displayError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                  <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 leading-relaxed">{displayError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !password || (isSetup && !confirm)}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isSetup ? 'Criando...' : 'Verificando...'}
                  </>
                ) : isSetup ? 'Criar senha e entrar' : 'Entrar'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 mt-5">
          🔒 Dados armazenados apenas neste dispositivo
        </p>
      </div>
    </div>
  );
}
