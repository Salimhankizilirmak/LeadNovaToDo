'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { blocks, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Yeni bir fiziksel Blok (İstasyon) oluşturur.
 */
export async function createBlockAction(params: { name: string, cellId: string }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    // RBAC Kontrolü: Sadece Patron, Genel Müdür ve Admin blok yönetebilir.
    const userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });

    const isAuthorized = userProfile && ['Patron', 'Genel Müdür', 'Admin'].includes(userProfile.role);
    if (!isAuthorized) {
      return { success: false, error: 'Blok oluşturmak için yönetici yetkisi gereklidir.', status: 403 };
    }

    const blockId = crypto.randomUUID();
    const [newBlock] = await db.insert(blocks).values({
      id: blockId,
      name: params.name,
      cellId: params.cellId,
      orgId: orgId,
      createdBy: userId,
    }).returning();

    revalidatePath('/dashboard/cells');
    return { success: true, block: newBlock };
  } catch (err: any) {
    console.error('BLOK OLUSTURMA HATASI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Belirli bir hücreye ait blokları ve aktif görevlerini getirir.
 */
export async function getBlocksByCellAction(cellId: string) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const data = await db.query.blocks.findMany({
      where: and(
        eq(blocks.cellId, cellId),
        eq(blocks.orgId, orgId)
      ),
      with: {
        tasks: {
          where: (tasks, { ne }) => ne(tasks.status, 'done'),
          with: {
            assignee: true,
          }
        },
        creator: true
      }
    });

    return { success: true, blocks: data };
  } catch (err: any) {
    console.error('BLOKLAR GETIRILEMEDI:', err);
    return { success: false, error: err.message };
  }
}
