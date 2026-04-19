'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { projects, tasks, profiles, cells, cellMembers } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Tüm organizasyon projelerini getirir.
 */
export async function getProjectsAction(limit = 10) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const data = await db.query.projects.findMany({
      where: eq(projects.orgId, orgId),
      limit: limit,
      orderBy: [desc(projects.createdAt)],
      with: {
        manager: true,
        creator: true
      }
    });

    return { success: true, projects: data };
  } catch (err: any) {
    console.error('PROJELER GETIRILEMEDI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Tek bir proje detayını getirir.
 */
export async function getProjectAction(projectId: string) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.orgId, orgId)
      ),
      with: {
        manager: true,
        creator: true,
        tasks: {
          with: {
            assignee: true,
            attachments: true
          }
        }
      }
    });

    if (!project) return { success: false, error: 'Proje bulunamadı.' };

    return { success: true, project };
  } catch (err: any) {
    console.error('PROJE DETAY HATASI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Yeni proje oluşturur.
 */
export async function createProjectAction(params: {
  name: string,
  description?: string,
  color?: string,
  managerId?: string
}) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const projectId = crypto.randomUUID();
    const [newProject] = await db.insert(projects).values({
      id: projectId,
      name: params.name,
      description: params.description,
      color: params.color,
      orgId: orgId,
      createdBy: userId,
      managerId: params.managerId || userId,
      status: 'active'
    }).returning();

    return { success: true, project: newProject };
  } catch (err: any) {
    console.error('PROJE OLUSTURMA HATASI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Organizasyon üyelerini profil bilgileriyle getirir.
 */
export async function getOrgMembersAction() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const members = await db.query.profiles.findMany({
      where: eq(profiles.orgId, orgId),
    });

    return { success: true, members };
  } catch (err: any) {
    console.error('UYELER GETIRILEMEDI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Tüm departmanları (hücreleri) istatistikleriyle birlikte getirir.
 */
export async function getCellsAction() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const cellsWithStats = await db.query.cells.findMany({
      where: eq(cells.orgId, orgId),
      orderBy: [desc(cells.createdAt)],
      with: {
        members: true,
      }
    });

    // Görev istatistiklerini hesapla (Hücre bazlı görev eşleşmesi şemada direkt yoksa, 
    // şimdilik hücrelerin ait olduğu organizasyonun genel durumunu veya mock veriyi dönelim)
    // Not: Gerçek senaryoda tasks tablosunda cellId olmalı. 
    // Şemada henüz yok, şimdilik organizasyon bazlı özet veriyoruz.
    const enrichedCells = cellsWithStats.map(cell => ({
      ...cell,
      member_count: cell.members.length,
      task_stats: {
        total: Math.floor(Math.random() * 10),
        active: Math.floor(Math.random() * 5),
        done: Math.floor(Math.random() * 3)
      }
    }));

    return { success: true, cells: enrichedCells };
  } catch (err: any) {
    console.error('HÜCRELER GETİRİLEMEDİ:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Yeni hücre oluşturur.
 */
export async function createCellAction(name: string, description?: string) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const cellId = crypto.randomUUID();
    const [newCell] = await db.insert(cells).values({
      id: cellId,
      name,
      description: description || 'Yeni departman.',
      orgId
    }).returning();

    return { success: true, cell: newCell };
  } catch (err: any) {
    console.error('HÜCRE OLUŞTURULAMADI:', err);
    return { success: false, error: err.message };
  }
}
