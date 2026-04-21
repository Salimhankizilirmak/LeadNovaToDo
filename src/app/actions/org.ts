'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { organizations, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Organizasyon bilgilerini getirir.
 */
export async function getOrgSettingsAction() {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

        const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, orgId)
        });

        const userProfile = await db.query.profiles.findFirst({
            where: eq(profiles.id, userId)
        });

        return { 
            success: true, 
            org, 
            role: userProfile?.role 
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Organizasyon adını günceller (Sadece Patron/Admin).
 */
export async function updateOrgNameAction(newName: string) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

        // Yetki kontrolü (Drizzle üzerinden profile bakarak)
        const userProfile = await db.query.profiles.findFirst({
            where: eq(profiles.id, userId)
        });

        if (!userProfile || !['Patron', 'Genel Müdür', 'Admin'].includes(userProfile.role)) {
            return { success: false, error: 'Bu işlem için yetkiniz yok.' };
        }

        await db.update(organizations)
            .set({ name: newName })
            .where(eq(organizations.id, orgId));

        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
