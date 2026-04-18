import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Component, Server Action ve Route Handler tarafında kullanılacak
 * Supabase istemcisi. Cookie yönetimi Next.js `next/headers` üzerinden yapılır.
 */
export async function createClient() {
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

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
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
          // Oturum yenileme işlemi Middleware tarafından zaten yönetilmektedir.
        }
      },
    },
  });
}
