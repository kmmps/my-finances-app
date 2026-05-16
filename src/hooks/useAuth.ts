import { useState, useEffect, useCallback } from 'react';

const AUTH_KEY     = 'finances-auth-v1';
const LOCKOUT_KEY  = 'finances-lockout-v1';
const SESSION_KEY  = 'finances-session-v1';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 60_000;

interface AuthData    { hash: string; salt: string }
interface LockoutData { attempts: number; lockedUntil: number | null }

// ── Crypto helpers ────────────────────────────────────────────────────────────

function uint8ToB64(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf));
}
function b64ToUint8(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt.buffer as ArrayBuffer, iterations: 100_000 },
    key,
    256,
  );
  return uint8ToB64(new Uint8Array(bits));
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function getLockout(): LockoutData {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    return raw ? (JSON.parse(raw) as LockoutData) : { attempts: 0, lockedUntil: null };
  } catch { return { attempts: 0, lockedUntil: null }; }
}
function setLockout(data: LockoutData) {
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(data));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export type AuthState = 'loading' | 'setup' | 'unauthenticated' | 'locked' | 'authenticated';

export function useAuth() {
  const [authState,         setAuthState]         = useState<AuthState>('loading');
  const [error,             setError]             = useState<string | null>(null);
  const [lockoutRemaining,  setLockoutRemaining]  = useState(0);

  // Boot: resolve initial state
  useEffect(() => {
    const hasPassword = !!localStorage.getItem(AUTH_KEY);
    const hasSession  = !!sessionStorage.getItem(SESSION_KEY);

    if (!hasPassword) { setAuthState('setup'); return; }
    if (hasSession)   { setAuthState('authenticated'); return; }

    const lock = getLockout();
    if (lock.lockedUntil && lock.lockedUntil > Date.now()) {
      setLockoutRemaining(Math.ceil((lock.lockedUntil - Date.now()) / 1000));
      setAuthState('locked');
      return;
    }
    setAuthState('unauthenticated');
  }, []);

  // Lockout countdown ticker
  useEffect(() => {
    if (authState !== 'locked') return;
    const id = setInterval(() => {
      const lock = getLockout();
      if (!lock.lockedUntil || lock.lockedUntil <= Date.now()) {
        setLockout({ attempts: 0, lockedUntil: null });
        setAuthState('unauthenticated');
        clearInterval(id);
        return;
      }
      setLockoutRemaining(Math.ceil((lock.lockedUntil - Date.now()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [authState]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const setupPassword = useCallback(async (password: string) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await pbkdf2(password, salt);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ hash, salt: uint8ToB64(salt) } satisfies AuthData));
    setLockout({ attempts: 0, lockedUntil: null });
    sessionStorage.setItem(SESSION_KEY, '1');
    setAuthState('authenticated');
  }, []);

  const login = useCallback(async (password: string) => {
    setError(null);
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return;

    const lock = getLockout();
    if (lock.lockedUntil && lock.lockedUntil > Date.now()) { setAuthState('locked'); return; }

    const { hash, salt } = JSON.parse(raw) as AuthData;
    const attempt = await pbkdf2(password, b64ToUint8(salt));

    if (attempt === hash) {
      setLockout({ attempts: 0, lockedUntil: null });
      sessionStorage.setItem(SESSION_KEY, '1');
      setAuthState('authenticated');
    } else {
      const newAttempts = (lock.attempts ?? 0) + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_MS;
        setLockout({ attempts: newAttempts, lockedUntil });
        setLockoutRemaining(Math.ceil(LOCKOUT_MS / 1000));
        setAuthState('locked');
      } else {
        setLockout({ attempts: newAttempts, lockedUntil: null });
        const left = MAX_ATTEMPTS - newAttempts;
        setError(`Senha incorreta. ${left} tentativa${left !== 1 ? 's' : ''} restante${left !== 1 ? 's' : ''}.`);
      }
    }
  }, []);

  const changePassword = useCallback(async (current: string, next: string): Promise<boolean> => {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const { hash, salt } = JSON.parse(raw) as AuthData;
    const attempt = await pbkdf2(current, b64ToUint8(salt));
    if (attempt !== hash) return false;
    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    const newHash = await pbkdf2(next, newSalt);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ hash: newHash, salt: uint8ToB64(newSalt) } satisfies AuthData));
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthState('unauthenticated');
  }, []);

  return { authState, error, lockoutRemaining, setupPassword, login, changePassword, logout };
}
