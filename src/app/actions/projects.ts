'use server';

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { projects, tasks, profiles, cells, cellMembers, projectAttachments, blocks } from '@/db/schema';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { sendProjectAttachmentNotificationEmail } from '@/lib/email';



/**
 * Tüm organizasyon projelerini getirir (RBAC Uygulanmış).
 */
export async function getProjectsAction(limit = 20) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId)
    });

    const isHighRole = userProfile && ['Patron', 'Genel Müdür', 'Admin'].includes(userProfile.role);

    let data;
    if (isHighRole) {
      data = await db.query.projects.findMany({
        where: eq(projects.orgId, orgId),
        limit: limit,
        orderBy: [desc(projects.createdAt)],
        with: {
          manager: true,
          creator: true
        }
      });
    } else {
      // Düşük roller: SADECE manager olduğu veya kendisine görev atandığı projeleri gör
      // Manuel SQL Join yaklaşımı ile ID'leri toplayalım
      const involved = await db.selectDistinct({ id: projects.id })
        .from(projects)
        .leftJoin(tasks, eq(projects.id, tasks.projectId))
        .where(
          and(
            eq(projects.orgId, orgId),
            or(
              eq(projects.managerId, userId),
              eq(tasks.assigneeId, userId)
            )
          )
        );

      const projectIds = involved.map(p => p.id);
      if (projectIds.length === 0) return { success: true, projects: [] };

      // Detaylı bilgileri fetch et
      data = await db.query.projects.findMany({
        where: sql`${projects.id} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`,
        limit: limit,
        orderBy: [desc(projects.createdAt)],
        with: {
          manager: true,
          creator: true
        }
      });
    }

    return { success: true, projects: data };
  } catch (err: any) {
    console.error('PROJELER GETIRILEMEDI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Tek bir proje detayını getirir (Yetki Kontrollü).
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
        },
        attachments: true,
        cell: true
      }
    });

    if (!project) return { success: false, error: 'Proje bulunamadı.' };

    // RBAC Kontrolü
    const userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId)
    });
    
    const isHighRole = userProfile && ['Patron', 'Genel Müdür', 'Admin'].includes(userProfile.role);
    
    if (!isHighRole) {
      const isManager = project.managerId === userId;
      const hasAssignedTask = project.tasks.some(t => t.assigneeId === userId);
      
      if (!isManager && !hasAssignedTask) {
        // Yetkisiz erişim
        return { success: false, error: 'Bu projeye erişim yetkiniz yok.', status: 403 };
      }
    }

    const orgBlocks = await db.query.blocks.findMany({
      where: eq(blocks.orgId, orgId)
    });

    return { success: true, project, blocks: orgBlocks };

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
  managerId?: string,
  budget?: number,
  cellId?: string, // Yeni: Hücre ID
  attachment?: { url: string, name: string, size?: number, type?: string }
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
      cellId: params.cellId, // Hücre ataması
      createdBy: userId,
      managerId: params.managerId || userId,
      budget: params.budget || 0,
      status: 'active'
    }).returning();

    // Eğer ek varsa kaydet
    if (params.attachment) {
      await db.insert(projectAttachments).values({
        id: crypto.randomUUID(),
        projectId: projectId,
        fileName: params.attachment.name,
        fileUrl: params.attachment.url,
        fileSize: params.attachment.size,
        fileType: params.attachment.type,
        createdBy: userId
      });
    }

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
        blocks: {
          with: {
            tasks: {
              where: (tasks, { ne }) => ne(tasks.status, 'done'),
              with: {
                assignee: true
              }
            }
          }
        },
        projects: {
          with: {
            tasks: {
              where: (tasks, { ne }) => ne(tasks.status, 'done'),
              with: {
                assignee: true
              }
            }
          }
        }
      }
    });


    // Verileri zenginleştir (istatistikler ve blok verileri)
    const enrichedCells = cellsWithStats.map(cell => {
      const allTasks = cell.blocks.flatMap(b => b.tasks);
      return {
        ...cell,
        member_count: cell.members.length,
        task_stats: {
          total: allTasks.length,
          active: allTasks.length,
          done: 0 // Done olanlar zaten yukarıda filtrelendi, detaya gerekirse ayrı çekilir
        }
      };
    });


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


/**
 * Proje Eklerini Kaydetme (UploadThing sonrası)
 */
export async function addProjectAttachmentAction(params: {
  projectId: string,
  fileName: string,
  fileUrl: string,
  fileSize?: number,
  fileType?: string
}) {
  try {
    const { userId, orgId } = await auth();
    const user = await currentUser();
    if (!userId || !orgId || !user) return { success: false, error: 'Oturum açılmamış.' };

    const attachmentId = crypto.randomUUID();
    const [attachment] = await db.insert(projectAttachments).values({
      id: attachmentId,
      projectId: params.projectId,
      fileName: params.fileName,
      fileUrl: params.fileUrl,
      fileSize: params.fileSize,
      fileType: params.fileType,
      createdBy: userId
    }).returning();

    // ── Email Bildirimi (Manager'a) ──
    try {
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, params.projectId)
        });

        if (project && project.managerId && project.managerId !== userId) {
            const client = await clerkClient();
            const manager = await client.users.getUser(project.managerId);
            const managerEmail = manager.emailAddresses[0]?.emailAddress;

            if (managerEmail) {
                sendProjectAttachmentNotificationEmail(
                    managerEmail,
                    manager.fullName || 'Sayın Yöneticimiz',
                    project.name,
                    params.fileName,
                    user.firstName || user.emailAddresses[0].emailAddress.split('@')[0]
                ).catch(e => console.error("PM NOTIF ERROR:", e));
            }
        }
    } catch (e) {
        console.error("ATTACHMENT MAIL PROCESS ERROR:", e);
    }

    return { success: true, attachment };
  } catch (err: any) {
    console.error('PROJE EKLERİ KAYIT HATASI:', err);
    return { success: false, error: err.message };
  }
}



