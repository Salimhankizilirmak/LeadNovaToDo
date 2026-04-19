'use server';

import { auth, currentUser, clerkClient as getClerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { profiles, organizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

import { UserRole } from '@/types/task';

/**
 * Kullanıcının Clerk bilgilerini Turso 'profiles' tablosuna senkronize eder.
 */
export async function syncProfile() {
  try {
    const { userId, orgId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return { success: false, error: 'Oturum bulunamadı' };

    // 1. Organizasyon Bilgisini Garantile
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

    // 2. Mevcut Profili Sorgula (Rol Koruması İçin)
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });

    // 3. Rol Belirleme Mantığı
    let finalRole: UserRole = (user.publicMetadata?.role as UserRole);
    
    if (!finalRole) {
      if (existingProfile?.role) {
        finalRole = existingProfile.role as UserRole;
      } else {
        finalRole = 'Personel';
      }
    }

    // 4. Organizasyon ID Belirleme
    const finalOrgId = targetOrgId || existingProfile?.orgId || null;
    const full_name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'Kullanıcı';

    console.log('[Sync] Drizzle Upsert işlemi başlatılıyor...', { userId, finalOrgId, finalRole });

    // 5. Drizzle Upsert
    const [updatedProfile] = await db.insert(profiles).values({
      id: userId,
      fullName: full_name,
      email: user.emailAddresses[0]?.emailAddress || '',
      avatarUrl: user.imageUrl,
      role: finalRole,
      orgId: finalOrgId,
      updatedAt: new Date().toISOString()
    }).onConflictDoUpdate({
      target: profiles.id,
      set: {
        fullName: full_name,
        email: user.emailAddresses[0]?.emailAddress || '',
        avatarUrl: user.imageUrl,
        role: finalRole,
        orgId: finalOrgId,
        updatedAt: new Date().toISOString()
      }
    }).returning();

    console.log('[Sync] Başarılı! Profil güncellendi. Rol:', updatedProfile.role, 'Org:', updatedProfile.orgId);
    return { success: true, profile: updatedProfile };
  } catch (err: any) {
    console.error('PROFIL SENKRONIZASYON HATASI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Üye davet etme
 */
export async function inviteMemberWithRoleAction(emailAddress: string, role: UserRole) {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) return { success: false, error: 'Oturum veya organizasyon bulunamadı.' };

    const clerk = await getClerkClient();
    
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
    
    let myRole = user?.publicMetadata?.role as UserRole;
    
    if (!myRole) {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
      });
      if (profile?.role) {
        myRole = profile.role as UserRole;
      }
    }
    
    const targetUser = await clerk.users.getUser(targetUserId);
    const targetRole = targetUser.publicMetadata?.role as UserRole;

    // Yetki Kontrolü
    if (myRole === 'Patron') {
      if (targetRole === 'Patron' && userId !== targetUserId) {
        return { success: false, error: 'Diğer patronların yetkilerini değiştiremezsiniz.' };
      }
    } else if (myRole === 'Genel Müdür') {
      if (targetRole === 'Patron' || targetRole === 'Genel Müdür') {
        return { success: false, error: 'Üst düzey yöneticilerin yetkilerini değiştirme izniniz yok.' };
      }
    } else if (myRole !== 'Admin') {
      return { success: false, error: 'Bu işlem için yetkiniz yok.' };
    }

    // 1. Clerk Metadata Güncelleme
    await clerk.users.updateUserMetadata(targetUserId, {
      publicMetadata: { role: newRole }
    });

    // 2. Drizzle Profiles Güncelleme
    await db.update(profiles)
      .set({ 
        role: newRole,
        updatedAt: new Date().toISOString()
      })
      .where(eq(profiles.id, targetUserId));

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
    // Burada da auth kontrolü yapmalıyız
    const { orgId: currentOrgId } = await auth();
    if (currentOrgId !== orgId) {
      return { success: false, error: 'Yetkisiz organizasyon erişimi.' };
    }

    const data = await db.query.profiles.findMany({
      where: eq(profiles.orgId, orgId),
    });

    return { success: true, profiles: data };
  } catch (err: any) {
    console.error('PROFILLER GETIRILEMEDI:', err);
    return { success: false, error: err.message };
  }
}
