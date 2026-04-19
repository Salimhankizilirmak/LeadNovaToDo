import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser (Client Component) tarafında kullanılacak Supabase istemcisi.
 * Yalnızca 'use client' direktifine sahip bileşenlerde çağrılmalıdır.
 */
/**
 * Browser (Client Component) tarafında kullanılacak Supabase istemcisi.
 * Yalnızca 'use client' direktifine sahip bileşenlerde çağrılmalıdır.
 */
export function createClient() {
  const { url, key } = getEnv();
  return createBrowserClient(url, key);
}

/**
 * Clerk JWT token'ı ile yetkilendirilmiş Supabase istemcisi.
 * Supabase RLS (Row Level Security) kurallarının Clerk ID üzerinden
 * çalışmasını sağlar.
 */
export function createClerkClient(clerkToken: string) {
  const { url, key } = getEnv();

  return createBrowserClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
  });
}

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error('Eksik ortam değişkenleri: Supabase URL veya Key bulunamadı.');
  }

  return { url, key };
}

