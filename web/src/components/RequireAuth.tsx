import type { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { supabase } from '../lib/supabase';
import { useSession } from '../lib/use-session';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();

  // Until staff login is actually set up, the gate stays open rather than
  // locking everyone out of the admin pages with no way back in.
  if (!supabase) {
    return <>{children}</>;
  }
  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!session) {
    return <Redirect to="/login" />;
  }
  return <>{children}</>;
}
