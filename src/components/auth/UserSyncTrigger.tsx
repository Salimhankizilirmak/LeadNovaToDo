import { useEffect } from 'react';
import { useUser, useOrganization } from '@clerk/nextjs';
import { syncProfile } from '@/app/actions/users';

export default function UserSyncTrigger() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { organization } = useOrganization();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const sync = async () => {
      try {
        console.log('[Auth] Profil senkronizasyonu başlatılıyor... (User:', user?.id, 'Org:', organization?.id, ')');
        const result = await syncProfile();
        if (result.success) {
          console.log('[Auth] Profil başarıyla senkronize edildi.');
        } else {
          console.error('[Auth] Senkronizasyon hatası:', result.error);
          if (result.error === 'ACCESS_DENIED') {
            // Yetkisiz kullanıcıyı dışarı at veya hata sayfasına yönlendir
            window.location.href = '/?error=access_denied';
          }
        }
      } catch (err) {
        console.error('[Auth] Kritik senkronizasyon hatası:', err);
      }
    };
    
    sync();
  }, [isLoaded, isSignedIn, user?.id, organization?.id]);

  return null;
}
