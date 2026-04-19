'use client';

import { useEffect } from 'react';
import { syncProfile } from '@/app/actions/users';

/**
 * Kullanıcı sisteme girdiğinde profilini Supabase ile senkronize eder.
 * Sadece client tarafında bir kez çalışması yeterlidir.
 */
export default function UserSyncTrigger() {
  useEffect(() => {
    const sync = async () => {
      try {
        await syncProfile();
      } catch (err) {
        console.error('Profil senkronizasyonu başarısız:', err);
      }
    };
    
    sync();
  }, []);

  return null;
}
