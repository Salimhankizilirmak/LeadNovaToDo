import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { syncProfile } from '@/app/actions/users';

export default function UserSyncTrigger() {
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const sync = async () => {
      try {
        console.log('[Auth] Profil senkronizasyonu başlatılıyor...');
        const result = await syncProfile();
        if (result.success) {
          console.log('[Auth] Profil başarıyla senkronize edildi.');
        } else {
          console.error('[Auth] Senkronizasyon hatası:', result.error);
        }
      } catch (err) {
        console.error('[Auth] Kritik senkronizasyon hatası:', err);
      }
    };
    
    sync();
  }, [isLoaded, isSignedIn]);

  return null;
}
