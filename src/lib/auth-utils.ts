import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { profiles, cellMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * LeadNova Yetki Hiyerarşisi
 */
export type LeadNovaRole = 'Patron' | 'Genel Müdür' | 'Admin' | 'Proje Yöneticisi' | 'Vardiya Amiri' | 'Personel';

export const ROLE_HIERARCHY: Record<LeadNovaRole, number> = {
  'Patron': 100,
  'Genel Müdür': 90,
  'Admin': 80,
  'Vardiya Amiri': 50,
  'Proje Yöneticisi': 40,
  'Personel': 10
};

/**
 * Kullanıcının mevcut rolünü ve organizasyon bilgisini döner.
 */
export async function getAuthContext() {
  const { userId, orgId } = await auth();
  const user = await currentUser();
  
  if (!userId || !orgId || !user) return null;

  const role = (user.publicMetadata?.role as LeadNovaRole) || 'Personel';
  
  return { userId, orgId, role };
}

/**
 * Patron, GM veya Admin olup olmadığını kontrol eder.
 */
export function isBoss(role: string) {
  return ['Patron', 'Genel Müdür', 'Admin'].includes(role);
}

/**
 * Kullanıcının bir hücrenin (departman) amiri olup olmadığını kontrol eder.
 */
export async function isCellSupervisor(userId: string, cellId: string) {
  const member = await db.query.cellMembers.findFirst({
    where: and(
        eq(cellMembers.userId, userId),
        eq(cellMembers.cellId, cellId),
        eq(cellMembers.isSupervisor, true)
    )
  });
  return !!member;
}

/**
 * Kullanıcının yönettiği hücrelerin listesini döner.
 */
export async function getSupervisedCellIds(userId: string) {
  const memberships = await db.query.cellMembers.findMany({
    where: and(
        eq(cellMembers.userId, userId),
        eq(cellMembers.isSupervisor, true)
    )
  });
  return memberships.map(m => m.cellId);
}

/**
 * Projeye erişim yetkisi var mı?
 */
export function canAccessProject(userId: string, role: LeadNovaRole, project: any, supervisedCellIds: string[] = []) {
  if (isBoss(role)) return true;
  
  if (role === 'Vardiya Amiri') {
    // Kendi hücresine atanmış projeleri görebilir
    if (project.cellId && supervisedCellIds.includes(project.cellId)) return true;
  }
  
  if (role === 'Proje Yöneticisi' && project.managerId === userId) return true;
  
  // Personel veya PM: Eğer projede bir görevi varsa görebilir (Bu mantık Action içinde DB query ile optimize edilecek)
  return false; 
}
