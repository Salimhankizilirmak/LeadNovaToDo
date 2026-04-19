import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createClerkClient } from '@/utils/supabase/client';

/**
 * LeadNova B2B SaaS için özelleştirilmiş Supabase kancası.
 * Her çağrıldığında Clerk'ten taze bir JWT token alır ve
 * Supabase istemcisini bu taze token ile oluşturur.
 * Bu yapı 'JWT Expired' hatalarını kalıcı olarak önler.
 */
export function useSupabase() {
  const { getToken } = useAuth();

  const getSupabase = useCallback(async () => {
    // Clerk'ten Supabase için taze token al (skipCache: true ile bayat token riskini bitiriyoruz)
    const token = await getToken({ template: 'supabase', skipCache: true });
    
    if (!token) {
      throw new Error('Supabase oturum anahtarı (JWT) alınamadı. Lütfen oturumunuzu kontrol edin.');
    }

    // Taze token ile yetkilendirilmiş istemciyi oluştur ve döndür
    return createClerkClient(token);
  }, [getToken]);

  return { getSupabase };
}
