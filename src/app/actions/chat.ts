'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { projectMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Proje içine mesaj gönderir.
 */
export async function sendMessageAction(projectId: string, message: string) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const messageId = crypto.randomUUID();
    const [newMessage] = await db.insert(projectMessages).values({
      id: messageId,
      projectId,
      userId,
      message,
    }).returning();

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, message: newMessage };
  } catch (err: any) {
    console.error('MESAJ GONDERILEMEDI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Bir projenin tüm mesajlarını kullanıcı bilgileriyle birlikte getirir.
 */
export async function getMessagesAction(projectId: string) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const messages = await db.query.projectMessages.findMany({
      where: eq(projectMessages.projectId, projectId),
      orderBy: [desc(projectMessages.createdAt)],
      with: {
        user: true,
      },
      limit: 100,
    });

    return { success: true, messages: messages.reverse() };
  } catch (err: any) {
    console.error('MESAJLAR ALINAMADI:', err);
    return { success: false, error: err.message };
  }
}
