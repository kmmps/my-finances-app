import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, CheckCircle2, Mail, Lock, UserPlus } from 'lucide-react';

type Mode = 'login' | 'register' | 'forgot' | 'emailSent' | 'recovery';

interface Props {
  isRecovery: boolean;
  error: string | null;
  onSignUp:           (email: string, password: string) => Promise<boolean>;
  onLogin:            (email: string, password: string) => Promise<boolean>;
  onForgotPassword:   (email: string) => Promise<boolean>;
  onUpdatePassword:   (newPassword: string) => Promise<boolean>;
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
    >
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );
}

function Field({
  label, value, onChange, type = 'text', placeholder, autoComplete, autoFocus,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoComplete?: string; autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={isPw && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
          style={isPw ? { paddingRight: '2.75rem' } : undefined}
        />
        {isPw && <EyeToggle show={show} onToggle={() => setShow(v => !v)} />}
      </div>
    </div>
  );
}

export default function LoginScreen({ isRecovery, error: authError, onSignUp, onLogin, onForgotPassword, onUpdatePassword }: Props) {
  const [mode,     setMode]     = useState<Mode>(isRecovery ? 'recovery' : 'login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const displayError = error ?? authError;

  const clearForm = () => { setEmail(''); setPassword(''); setConfirm(''); setError(null); };

  const goTo = (m: Mode) => { clearForm(); setMode(m); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null); setLoading(true);
    const ok = await onLogin(email, password);
    setLoading(false);
    if (!ok) setError(authError ?? 'Erro ao entrar.');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm)  { setError('As senhas não conferem.'); return; }
    setError(null); setLoading(true);
    const ok = await onSignUp(email, password);
    setLoading(false);
    if (ok) setMode('emailSent');
    else    setError(authError ?? 'Erro ao criar conta.');
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null); setLoading(true);
    const ok = await onForgotPassword(email);
    setLoading(false);
    if (ok) setMode('emailSent');
    else    setError('Erro ao enviar email. Tente novamente.');
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm)  { setError('As senhas não conferem.'); return; }
    setError(null); setLoading(true);
    const ok = await onUpdatePassword(password);
    setLoading(false);
    if (!ok) setError('Erro ao salvar nova senha. Tente novamente.');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
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

        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">

          {/* ── LOGIN ─────────────────────────────────────────────────── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div className="text-center mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 rounded-xl mb-3">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <h2 className="text-base font-semibold text-gray-100">Bem-vinda de volta!</h2>
                <p className="text-xs text-gray-500 mt-1">Entre com seu email e senha</p>
              </div>

              <Field label="Email" value={email} onChange={e => { setEmail(e); setError(null); }}
                type="email" placeholder="seu@email.com" autoComplete="email" autoFocus />
              <Field label="Senha" value={password} onChange={e => { setPassword(e); setError(null); }}
                type="password" placeholder="••••••••" autoComplete="current-password" />

              {displayError && <ErrorBox message={displayError} />}

              <button type="submit" disabled={loading || !email || !password}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                {loading ? <Spinner text="Entrando..." /> : 'Entrar'}
              </button>

              <div className="flex flex-col items-center gap-2 pt-1">
                <button type="button" onClick={() => goTo('forgot')}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  Esqueceu a senha?
                </button>
                <button type="button" onClick={() => goTo('register')}
                  className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors font-medium">
                  Criar conta
                </button>
              </div>
            </form>
          )}

          {/* ── REGISTER ──────────────────────────────────────────────── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div className="text-center mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 rounded-xl mb-3">
                  <UserPlus size={20} className="text-emerald-400" />
                </div>
                <h2 className="text-base font-semibold text-gray-100">Criar conta</h2>
                <p className="text-xs text-gray-500 mt-1">Seus dados ficam salvos na nuvem</p>
              </div>

              <Field label="Email" value={email} onChange={e => { setEmail(e); setError(null); }}
                type="email" placeholder="seu@email.com" autoComplete="email" autoFocus />
              <Field label="Senha" value={password} onChange={e => { setPassword(e); setError(null); }}
                type="password" placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
              <Field label="Confirmar senha" value={confirm} onChange={e => { setConfirm(e); setError(null); }}
                type="password" placeholder="Repita a senha" autoComplete="new-password" />

              {displayError && <ErrorBox message={displayError} />}

              <button type="submit" disabled={loading || !email || !password || !confirm}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                {loading ? <Spinner text="Criando conta..." /> : 'Criar conta'}
              </button>

              <button type="button" onClick={() => goTo('login')}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Já tenho conta — entrar
              </button>
            </form>
          )}

          {/* ── FORGOT PASSWORD ────────────────────────────────────────── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="p-6 space-y-4">
              <div className="text-center mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 rounded-xl mb-3">
                  <Mail size={20} className="text-blue-400" />
                </div>
                <h2 className="text-base font-semibold text-gray-100">Recuperar senha</h2>
                <p className="text-xs text-gray-500 mt-1">Enviaremos um link para seu email</p>
              </div>

              <Field label="Email" value={email} onChange={e => { setEmail(e); setError(null); }}
                type="email" placeholder="seu@email.com" autoComplete="email" autoFocus />

              {displayError && <ErrorBox message={displayError} />}

              <button type="submit" disabled={loading || !email}
                className="w-full py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {loading ? <Spinner text="Enviando..." /> : 'Enviar link de recuperação'}
              </button>

              <button type="button" onClick={() => goTo('login')}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors">
                ← Voltar para o login
              </button>
            </form>
          )}

          {/* ── EMAIL SENT ────────────────────────────────────────────── */}
          {mode === 'emailSent' && (
            <div className="p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <CheckCircle2 size={22} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-100">Email enviado!</h2>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Verifique sua caixa de entrada e clique no link para continuar.
                  Pode cair no spam.
                </p>
              </div>
              <button onClick={() => goTo('login')}
                className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors font-medium">
                ← Voltar para o login
              </button>
            </div>
          )}

          {/* ── RECOVERY (new password after reset link) ───────────────── */}
          {mode === 'recovery' && (
            <form onSubmit={handleRecovery} className="p-6 space-y-4">
              <div className="text-center mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 rounded-xl mb-3">
                  <Lock size={20} className="text-emerald-400" />
                </div>
                <h2 className="text-base font-semibold text-gray-100">Nova senha</h2>
                <p className="text-xs text-gray-500 mt-1">Digite a nova senha para sua conta</p>
              </div>

              <Field label="Nova senha" value={password} onChange={e => { setPassword(e); setError(null); }}
                type="password" placeholder="Mínimo 6 caracteres" autoComplete="new-password" autoFocus />
              <Field label="Confirmar nova senha" value={confirm} onChange={e => { setConfirm(e); setError(null); }}
                type="password" placeholder="Repita a senha" autoComplete="new-password" />

              {displayError && <ErrorBox message={displayError} />}

              <button type="submit" disabled={loading || !password || !confirm}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {loading ? <Spinner text="Salvando..." /> : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 mt-5">
          🔒 Dados sincronizados com segurança na nuvem
        </p>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
      <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
      <p className="text-xs text-red-400 leading-relaxed">{message}</p>
    </div>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <>
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {text}
    </>
  );
}
