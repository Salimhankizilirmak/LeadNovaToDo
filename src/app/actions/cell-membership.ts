import { db } from '@/db';
import { cellMembers, profiles, cells } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthContext, isBoss } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

/**
 * Bir üyeyi hücreye ekler veya rolünü (amirlik) günceller.
 */
export async function manageCellMemberAction(params: {
  cellId: string,
  profileId: string,
  isSupervisor: boolean,
  action: 'add' | 'update' | 'remove'
}) {
  try {
    const authCtx = await getAuthContext();
    if (!authCtx) return { success: false, error: 'Oturum bulunamadı.' };
    const { role, orgId } = authCtx;

    // Yetki Kontrolü: Sadece Patron, GM ve Admin hücre üyeliğini yönetebilir.
    if (!isBoss(role)) {
      return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
    }

    if (params.action === 'remove') {
      await db.delete(cellMembers)
        .where(and(
          eq(cellMembers.cellId, params.cellId),
          eq(cellMembers.userId, params.profileId)
        ));
    } else if (params.action === 'add') {
       // Önce zaten ekli mi kontrol et
       const existing = await db.query.cellMembers.findFirst({
         where: and(
           eq(cellMembers.cellId, params.cellId),
           eq(cellMembers.userId, params.profileId)
         )
       });

       if (existing) {
         await db.update(cellMembers)
           .set({ isSupervisor: params.isSupervisor })
           .where(and(
             eq(cellMembers.cellId, params.cellId),
             eq(cellMembers.userId, params.profileId)
           ));
       } else {
         await db.insert(cellMembers).values({
           cellId: params.cellId,
           userId: params.profileId,
           isSupervisor: params.isSupervisor
         });
       }
    } else if (params.action === 'update') {
        await db.update(cellMembers)
          .set({ isSupervisor: params.isSupervisor })
          .where(and(
            eq(cellMembers.cellId, params.cellId),
            eq(cellMembers.userId, params.profileId)
          ));
    }

    revalidatePath('/dashboard/cells');
    return { success: true };

  } catch (err: any) {
    console.error('HÜCRE ÜYESİ YÖNETİM HATASI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Belirli bir hücrenin üyelerini getirir.
 */
export async function getCellMembersAction(cellId: string) {
    try {
        const data = await db.query.cellMembers.findMany({
            where: eq(cellMembers.cellId, cellId),
            with: {
                user: true
            }
        });
        return { success: true, members: data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
