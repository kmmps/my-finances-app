import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AuthState = 'loading' | 'unauthenticated' | 'authenticated' | 'recovery';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user,      setUser]      = useState<User | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthState(session ? 'authenticated' : 'unauthenticated');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthState('recovery');
      } else {
        setUser(session?.user ?? null);
        setAuthState(session ? 'authenticated' : 'unauthenticated');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(translateError(error.message)); return false; }
    return true;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(translateError(error.message)); return false; }
    return true;
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return !error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<boolean> => {
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setError(translateError(error.message)); return false; }
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { authState, user, error, signUp, login, sendPasswordReset, updatePassword, logout };
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials'))    return 'Email ou senha incorretos.';
  if (msg.includes('Email not confirmed'))           return 'Confirme seu email antes de entrar.';
  if (msg.includes('User already registered'))       return 'Este email já está cadastrado.';
  if (msg.includes('Password should be'))            return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('rate limit') || msg.includes('Too many')) return 'Muitas tentativas. Aguarde alguns minutos.';
  return 'Ocorreu um erro. Tente novamente.';
}
