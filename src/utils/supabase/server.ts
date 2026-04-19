import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Component, Server Action ve Route Handler tarafında kullanılacak
 * Supabase istemcisi. Cookie yönetimi Next.js `next/headers` üzerinden yapılır.
 */
/**
 * Server Component, Server Action ve Route Handler tarafında kullanılacak
 * Supabase istemcisi. Cookie yönetimi Next.js `next/headers` üzerinden yapılır.
 */
export async function createClient() {
  const { url, key } = getEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component içinden set çağrıldığında bu hata görmezden gelinebilir.
        }
      },
    },
  });
}

/**
 * Server tarafında Clerk JWT token'ı ile yetkilendirilmiş Supabase istemcisi.
 */
export async function createClerkClient(clerkToken: string) {
  const { url, key } = getEnv();

  return createServerClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
    // Server-to-server iletişiminde genellikle cookie yönetimine gerek kalmaz
    // çünkü yetkilendirme Header üzerinden (Clerk JWT) yapılır.
    cookies: {
      getAll() { return []; },
      setAll() {}
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

