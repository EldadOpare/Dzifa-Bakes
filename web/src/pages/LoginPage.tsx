import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '../lib/supabase';
import logo from '@assets/logo.png';

export function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setError('Staff login isn’t set up yet.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError('That email and password don’t match. Try again.');
      return;
    }
    navigate('/admin');
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-5 py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <img src={logo} alt="Dzilicious Bakery & More" className="mx-auto h-28 w-28 object-contain mix-blend-multiply" />
        <h1 className="mt-6 text-center font-display font-medium text-3xl tracking-[-.03em]">Staff sign in</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">This area is for the studio team only.</p>

        {!supabase && (
          <p className="mt-6 rounded-md border border-border bg-muted p-3 text-center text-xs text-muted-foreground" data-testid="text-auth-not-configured">
            Staff login isn’t set up yet. Ask whoever manages the site to add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
          </p>
        )}

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block text-xs font-semibold">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
              data-testid="input-login-email"
            />
          </label>
          <label className="block text-xs font-semibold">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
              data-testid="input-login-password"
            />
          </label>
          {error && <p className="text-xs text-destructive" data-testid="text-login-error">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            data-testid="button-login-submit"
          >
            <LogIn size={15} /> {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
