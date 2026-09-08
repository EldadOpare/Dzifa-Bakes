import { supabase } from './supabase';

export async function uploadImage(file: File): Promise<string> {
  const session = (await supabase?.auth.getSession())?.data.session;
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/bakery/uploads', {
    method: 'POST',
    headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message ?? `Upload failed (${response.status})`);
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}
