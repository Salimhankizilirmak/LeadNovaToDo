import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { profiles, cellMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { type LeadNovaRole, isBoss } from './auth-constants';

export { type LeadNovaRole, isBoss };

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
 * Projeye erişim yetkisi var mı? (Server-side)
 */
export function canAccessProject(userId: string, role: LeadNovaRole, project: any, supervisedCellIds: string[] = []) {
  if (isBoss(role)) return true;
  
  if (role === 'Vardiya Amiri') {
    // Kendi hücresine atanmış projeleri görebilir
    if (project.cellId && supervisedCellIds.includes(project.cellId)) return true;
  }
  
  if (role === 'Proje Yöneticisi' && project.managerId === userId) return true;
  
  return false; 
}

