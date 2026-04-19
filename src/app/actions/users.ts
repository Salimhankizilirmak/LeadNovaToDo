'use server';

import { auth, currentUser, clerkClient as getClerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { profiles, organizations, orgMembers } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

import { UserRole } from '@/types/task';

/**
 * Kullanıcının Clerk bilgilerini Turso 'profiles' tablosuna senkronize eder.
 */
export async function syncProfile() {
  try {
    const { userId, orgId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return { success: false, error: 'Oturum bulunamadı' };

    // 1. Kullanıcı Bilgilerini ve E-postasını Al
    const userEmail = user.emailAddresses[0]?.emailAddress || "";
    const superAdmins = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(',') || [];
    const isSuperAdmin = superAdmins.includes(userEmail);
    
    // 2. Patron Tanıma Mantığı (Admin Panel Kaydı ile Eşleştirme)
    const ownedOrg = await db.query.organizations.findFirst({
      where: eq(organizations.ownerEmail, userEmail)
    });

    let targetOrgId = orgId;
    let finalRole: UserRole = 'Personel';
    let isAuthorized = false;

    // 2a. Eğer Kullanıcı bir Patron ise
    if (ownedOrg) {
      targetOrgId = ownedOrg.id;
      finalRole = 'Patron';
      isAuthorized = true;
      console.log('[Sync] Kullanıcı Patron olarak tanındı:', ownedOrg.name);
    } 
    // 2b. Eğer Süper Admin ise - Süper Adminlerin HER ŞEYE yetkisi olmalı
    else if (isSuperAdmin) {
      finalRole = 'Patron';
      isAuthorized = true;
      console.log('[Sync] Kullanıcı Süper Admin olarak tanındı.');
    }

    // 3. Organizasyon Bilgisini Garantile (Eğer Patron/Süper Admin değilse üyelik bak)
    const clerk = await getClerkClient();
    if (!targetOrgId) {
      const memberships = await clerk.users.getOrganizationMembershipList({ userId });
      if (memberships.data && memberships.data.length > 0) {
        targetOrgId = memberships.data[0].organization.id;
        isAuthorized = true;
      }
    } else {
      isAuthorized = true; // Zaten bir orgId varsa (session/patron/superadmin) yetkilidir
    }

    // 3a. Erişim Kontrolü (Gatekeeper) - Ne Patron ne de Üye ise engelle
    if (!isAuthorized) {
      console.warn('[Sync] Yetkisiz Erişim Denemesi:', userEmail);
      // Burada bir hata fırlatabiliriz veya success false dönebiliriz. 
      // Layout tarafı bunu handle etmeli.
      return { success: false, error: 'ACCESS_DENIED', message: 'Herhangi bir organizasyon davetiniz bulunmuyor.' };
    }

    // 4. Organizations Tablosunu Önceden Besle (FK Kalkanı)
    if (targetOrgId) {
      console.log('[Sync] Organizasyon detayları Clerk\'ten çekiliyor...', targetOrgId);
      try {
        const orgDetail = await clerk.organizations.getOrganization({ organizationId: targetOrgId });
        await db.insert(organizations).values({
          id: targetOrgId,
          name: orgDetail.name,
          ownerId: orgDetail.createdBy || userId,
          ownerEmail: ownedOrg?.ownerEmail || "" 
        }).onConflictDoUpdate({
          target: organizations.id,
          set: {
            name: orgDetail.name,
            ownerId: orgDetail.createdBy || userId,
            // ownerEmail değişmez
          }
        });
        console.log('[Sync] Organizations tablosu güncellendi.');
      } catch (orgErr) {
        console.error('[Sync] Organizations upsert hatası:', orgErr);
      }
    }

    // 5. Mevcut Profili Sorgula (Rol Koruması İçin)
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });

    // Rol Belirleme Mantığı (Eğer Patron/SuperAdmin değilse metadata veya mevcut profil bak)
    if (finalRole !== 'Patron') {
      finalRole = (user.publicMetadata?.role as UserRole) || (existingProfile?.role as UserRole) || 'Personel';
    }

    const full_name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || userEmail || 'Kullanıcı';

    console.log('[Sync] Drizzle Upsert işlemi başlatılıyor...', { userId, targetOrgId, finalRole });

    // 6. Drizzle Profiles Upsert
    const [updatedProfile] = await db.insert(profiles).values({
      id: userId,
      fullName: full_name,
      email: userEmail,
      avatarUrl: user.imageUrl,
      role: finalRole,
      orgId: targetOrgId,
      updatedAt: new Date().toISOString()
    }).onConflictDoUpdate({
      target: profiles.id,
      set: {
        fullName: full_name,
        email: userEmail,
        avatarUrl: user.imageUrl,
        role: finalRole,
        orgId: targetOrgId,
        updatedAt: new Date().toISOString()
      }
    }).returning();

    console.log('[Sync] Başarılı! Profil güncellendi. Rol:', updatedProfile.role, 'Org:', updatedProfile.orgId);

    // 7. Organizasyon Bağını Garantile (Multi-tenant Sync - Manuel Upsert)
    if (targetOrgId) {
      console.log('[Sync] OrgMembers bağı kontrol ediliyor...', { userId, targetOrgId });
      
      const existingMember = await db.query.orgMembers.findFirst({
        where: and(
          eq(orgMembers.orgId, targetOrgId),
          eq(orgMembers.userId, userId)
        )
      });

      if (existingMember) {
        await db.update(orgMembers)
          .set({ role: finalRole })
          .where(and(
            eq(orgMembers.orgId, targetOrgId),
            eq(orgMembers.userId, userId)
          ));
      } else {
        await db.insert(orgMembers).values({
          orgId: targetOrgId,
          userId: userId,
          role: finalRole
        });
      }
      console.log('[Sync] OrgMembers bağı başarıyla kuruldu/güncellendi.');
    }

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

    const data = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        avatarUrl: profiles.avatarUrl,
        role: orgMembers.role, // Organizasyondaki gerçek rolü çek
        updatedAt: profiles.updatedAt
      })
      .from(orgMembers)
      .innerJoin(profiles, eq(orgMembers.userId, profiles.id))
      .where(eq(orgMembers.orgId, orgId));

    return { success: true, profiles: data };
  } catch (err: any) {
    console.error('PROFILLER GETIRILEMEDI:', err);
    return { success: false, error: err.message };
  }
}
