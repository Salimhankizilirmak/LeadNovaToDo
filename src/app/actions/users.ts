'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkClient } from '@/utils/supabase/server';
import { UserRole } from '@/types/task';

/**
 * Kullanıcının Clerk bilgilerini Supabase 'profiles' tablosuna senkronize eder.
 * Bu sayede veritabanında user_id yerine gerçek isimleri görebiliriz.
 */
export async function syncProfile() {
  try {
    const { userId, getToken, orgId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return { success: false, error: 'Oturum bulunamadı' };

    const token = await getToken({ template: 'supabase' });
    if (!token) return { success: false, error: 'Supabase token alınamadı' };

    const supabase = await createClerkClient(token);

    // Clerk metadata'dan veya varsayılan rolleri al
    const role = (user.publicMetadata?.role as UserRole) || 'Personel';
    const full_name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0].emailAddress;

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name,
        email: user.emailAddresses[0].emailAddress,
        avatar_url: user.imageUrl,
        role: role,
        org_id: orgId || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return { success: true, profile: data };
  } catch (err: any) {
    console.error('PROFIL SENKRONIZASYON HATASI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Belirli bir organizasyondaki tüm üyelerin profil bilgilerini getirir.
 */
export async function getOrgProfiles(orgId: string) {
  try {
    const { getToken } = await auth();
    const token = await getToken({ template: 'supabase' });
    if (!token) throw new Error('Oturum anahtarı yok');

    const supabase = await createClerkClient(token);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('org_id', orgId);

    if (error) throw error;
    return { success: true, profiles: data };
  } catch (err: any) {
    console.error('PROFILLER GETIRILEMEDI:', err);
    return { success: false, error: err.message };
  }
}
