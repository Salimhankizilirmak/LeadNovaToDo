'use server';

import { auth, currentUser, clerkClient as getClerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/types/task';

/**
 * Kullanıcının Clerk bilgilerini Supabase 'profiles' tablosuna senkronize eder.
 * Token bazlı yetkilendirme ve organizasyon otomatik eşleme içerir.
 */
import { createClerkClient } from '@/utils/supabase/server';

export async function syncProfile() {
  try {
    const { userId, orgId, getToken } = await auth();
    const user = await currentUser();

    if (!userId || !user) return { success: false, error: 'Oturum bulunamadı' };

    // 1. Clerk-Supabase Token Al (RLS için kritik)
    const token = await getToken({ template: 'supabase' });
    if (!token) {
      console.warn('[Sync] Supabase token alınamadı, anonim erişim denenecek (Service role eksikse fail edebilir)');
    }

    // 2. Yetkili Supabase İstemcisi Oluştur
    const supabase = await createClerkClient(token || '');

    // 3. Organizasyon Bilgisini Garantile
    let targetOrgId = orgId;
    
    if (!targetOrgId) {
      const clerk = await getClerkClient();
      console.log('[Sync] OrgID oturumda yok, Clerk üyelerinden sorgulanıyor...');
      const memberships = await clerk.users.getOrganizationMembershipList({ userId });
      
      if (memberships.data && memberships.data.length > 0) {
        targetOrgId = memberships.data[0].organization.id;
        console.log('[Sync] Kullanıcının üye olduğu organizasyon bulundu:', targetOrgId);
      }
    }

    // 4. Mevcut Profili Sorgula (Rol Koruması İçin)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', userId)
      .maybeSingle();

    // 5. Rol Belirleme Mantığı (Hiyerarşi: Clerk Metadata > Mevcut DB > Varsayılan)
    let finalRole: UserRole = (user.publicMetadata?.role as UserRole);
    
    if (!finalRole) {
      if (existingProfile?.role) {
        finalRole = existingProfile.role as UserRole;
        console.log('[Sync] Mevcut DB rolü korunuyor:', finalRole);
      } else {
        finalRole = 'Personel';
        console.log('[Sync] Yeni kullanıcı için varsayılan rol atanıyor: Personel');
      }
    } else {
      console.log('[Sync] Clerk Metadata rolü uygulanıyor:', finalRole);
    }

    // 6. Organizasyon ID Belirleme (Hiyerarşi: Oturum > Mevcut DB > Clerk API)
    let finalOrgId = targetOrgId || existingProfile?.org_id;

    const full_name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'Kullanıcı';

    console.log('[Sync] Veritabanı işlemi başlatılıyor...', { userId, finalOrgId, finalRole });

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name,
        email: user.emailAddresses[0]?.emailAddress || '',
        avatar_url: user.imageUrl,
        role: finalRole,
        org_id: finalOrgId || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[Sync] Supabase Upsert Hatası:', error);
      throw error;
    }

    console.log('[Sync] Başarılı! Profil güncellendi. Rol:', data.role, 'Org:', data.org_id);
    return { success: true, profile: data };
  } catch (err: any) {
    console.error('PROFIL SENKRONIZASYON HATASI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Üye davet etme (Backend API ile özel rol atar)
 */
export async function inviteMemberWithRoleAction(emailAddress: string, role: UserRole) {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) return { success: false, error: 'Oturum veya organizasyon bulunamadı.' };

    const clerk = await getClerkClient();
    
    // Clerk Invitations API ile davet gönder ve metadata'ya rolü işle
    await clerk.organizations.createOrganizationInvitation({
      organizationId: orgId,
      inviterUserId: userId,
      emailAddress,
      role: role === 'Patron' || role === 'Genel Müdür' ? 'org:admin' : 'org:member',
      publicMetadata: { role }
    });

    return { success: true };
  } catch (err: any) {
    console.error('INVITE ACTION ERROR:', err);
    return { success: false, error: err.message || 'Davet gönderilemedi.' };
  }
}

/**
 * Mevcut üyenin rolünü güncelleme
 */
export async function updateUserRoleAction(targetUserId: string, newRole: UserRole) {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) return { success: false, error: 'Yetki bulunamadı.' };

    const clerk = await getClerkClient();
    const user = await currentUser();
    
    const myRole = user?.publicMetadata?.role as UserRole;
    
    // Hedef kullanıcının mevcut rollerini al
    const targetUser = await clerk.users.getUser(targetUserId);
    const targetRole = targetUser.publicMetadata?.role as UserRole;

    // Hiyerarşik Yetki Kontrolü
    if (myRole === 'Patron') {
      // Patron sadece kendisi dışındaki diğer Patronları değiştiremez (isteğe bağlı)
      if (targetRole === 'Patron' && userId !== targetUserId) {
        return { success: false, error: 'Diğer patronların yetkilerini değiştiremezsiniz.' };
      }
    } else if (myRole === 'Genel Müdür') {
      // Genel Müdür sadece Patron ve diğer Genel Müdürler dışındakileri değiştirebilir
      if (targetRole === 'Patron' || targetRole === 'Genel Müdür') {
        return { success: false, error: 'Üst düzey yöneticilerin yetkilerini değiştirme izniniz yok.' };
      }
    } else if (myRole !== 'Admin') {
      return { success: false, error: 'Bu işlem için yetkiniz yok.' };
    }

    // 1. Clerk publicMetadata Güncelleme
    await clerk.users.updateUserMetadata(targetUserId, {
      publicMetadata: { role: newRole }
    });

    // 2. Supabase Profiles Güncelleme
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: sbError } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId);

    if (sbError) throw sbError;

    return { success: true };
  } catch (err: any) {
    console.error('UPDATE ROLE ACTION ERROR:', err);
    return { success: false, error: err.message || 'Rol güncellenemedi.' };
  }
}

/**
 * Belirli bir organizasyondaki tüm üyelerin profil bilgilerini getirir.
 */
export async function getOrgProfiles(orgId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
