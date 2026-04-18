import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser (Client Component) tarafında kullanılacak Supabase istemcisi.
 * Yalnızca 'use client' direktifine sahip bileşenlerde çağrılmalıdır.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Eksik ortam değişkeni: NEXT_PUBLIC_SUPABASE_URL tanımlanmamış. '
    );
  }

  if (!supabaseKey) {
    throw new Error(
      'Eksik ortam değişkeni: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tanımlanmamış. '
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
