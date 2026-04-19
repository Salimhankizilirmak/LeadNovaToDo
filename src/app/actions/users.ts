'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkClient } from '@/utils/supabase/server';
import { UserRole } from '@/types/task';

/**
 * Kullanıcının Clerk bilgilerini Supabase 'profiles' tablosuna senkronize eder.
 * Bu sayede veritabanında user_id yerine gerçek isimleri görebiliriz.
 */
import { createClient } from '@supabase/supabase-js';

export async function syncProfile() {
  try {
    const { userId, orgId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return { success: false, error: 'Oturum bulunamadı' };

    // Sunucu tarafında tam yetkili Supabase istemcisi oluşturuluyor (RLS atlanıyor)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Clerk metadata'dan veya varsayılan rolleri al
    const role = (user.publicMetadata?.role as UserRole) || 'Personel';
    const full_name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'Kullanıcı';

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name,
        email: user.emailAddresses[0]?.emailAddress || '',
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
