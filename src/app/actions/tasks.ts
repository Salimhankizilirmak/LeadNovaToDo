'use server';

import { db } from '@/db';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { tasks, projects, profiles, taskAttachments, taskHistory, cellMembers } from '@/db/schema';
import { eq, and, desc, or, inArray } from 'drizzle-orm';
import { sendTaskAssignmentEmail } from '@/lib/email';
import { getAuthContext, isBoss, getSupervisedCellIds } from '@/lib/auth-utils';

interface CreateTaskParams {
  title: string;
  description?: string;
  projectId: string;
  orgId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string | null;
  blockId?: string | null; // Yeni: Blok / İstasyon ID
  dueDate?: string | null;
  attachment?: { url: string, name: string, size?: number, type?: string };
}

/**
 * Görev oluşturma ve atanan kişiye bildirim gönderme (Server Action)
 */
export async function createTaskAction(params: CreateTaskParams) {
  try {
    const authCtx = await getAuthContext();
    if (!authCtx) return { success: false, error: 'Oturum bulunamadı.' };
    const { userId, orgId, role } = authCtx;

    // Güvenlik Kontrolü: Organizasyon ID eşleşmeli
    if (params.orgId !== orgId) {
      return { success: false, error: 'Yetkisiz organizasyon işlemi.' };
    }

    // RBAC: SADECE Patron, GM, Admin ve yetkili PM/Amir görev oluşturabilir.
    if (!isBoss(role)) {
        const project = await db.query.projects.findFirst({ where: eq(projects.id, params.projectId) });
        if (!project) return { success: false, error: 'Proje bulunamadı.' };

        const supervisedCellIds = await getSupervisedCellIds(userId);
        const isProjectManager = project.managerId === userId;
        const isCellSupervisor = project.cellId && supervisedCellIds.includes(project.cellId);

        if (!isProjectManager && !isCellSupervisor) {
            return { success: false, error: 'Bu projede görev oluşturma yetkiniz yok.' };
        }
    }

    // 1. Görevi veritabanına kaydet
    const taskId = crypto.randomUUID();
    const [task] = await db.insert(tasks).values({
      id: taskId,
      title: params.title,
      description: params.description || "",
      projectId: params.projectId,
      orgId: params.orgId,
      priority: params.priority,
      assigneeId: params.assigneeId || null,
      blockId: params.blockId || null,
      dueDate: params.dueDate || null,
      createdBy: userId,
      status: 'todo',
    }).returning();

    // 1a. Eğer ek varsa kaydet
    if (params.attachment) {
      await db.insert(taskAttachments).values({
        id: crypto.randomUUID(),
        taskId: taskId,
        fileName: params.attachment.name,
        fileUrl: params.attachment.url,
        fileSize: params.attachment.size,
        fileType: params.attachment.type,
        createdBy: userId
      });
    }

    // Proje bilgilerini join ile çek (E-posta için)

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, params.projectId)
    });

    // 2. Eğer birine atandıysa e-posta gönder
    if (params.assigneeId && params.assigneeId !== "") {
      try {
        console.log(`[DEBUG] E-posta süreci başlıyor. Atanan: ${params.assigneeId}`);
        const client = await clerkClient();
        const assigneeUser = await client.users.getUser(params.assigneeId);
        
        if (assigneeUser) {
          const toEmail = assigneeUser.emailAddresses[0]?.emailAddress;
          
          if (toEmail) {
            // Arka planda çalıştır (kullanıcıyı bekletme)
            sendTaskAssignmentEmail(
              toEmail,
              task.title,
              project?.name || 'Bilinmeyen Proje',
              assigneeUser.fullName || assigneeUser.username || 'Değerli Takım Arkadaşımız'
            ).catch(err => console.error("EMAIL ASYNC ERROR:", err));
          }
        }
      } catch (emailError: any) {
        console.error('[DEBUG] Bildirim gönderilirken hata oluştu:', emailError.message);
      }
    }


    return { success: true, task: { ...task, project } };
  } catch (globalError: any) {
    console.error('SERVER ACTION CRITICAL ERROR:', globalError);
    return { success: false, error: globalError.message || 'Sunucu tarafında beklenmedik bir hata oluştu.' };
  }
}

/**
 * Görev durumunu güncelleme (Server Action)
 */
export async function updateTaskStatusAction(taskId: string, newStatus: string) {
  try {
    const authCtx = await getAuthContext();
    if (!authCtx) return { success: false, error: 'Oturum bulunamadı.' };
    const { userId, orgId, role } = authCtx;

    // 0. Eski statüyü al (Geçmiş için)
    const existingTask = await db.query.tasks.findFirst({
        where: and(eq(tasks.id, taskId), eq(tasks.orgId, orgId)),
        with: { project: true }
    });

    if (!existingTask) {
        return { success: false, error: 'Görev bulunamadı.' };
    }

    // RBAC: Personel sadece kendi görevini güncelleyebilir.
    if (!isBoss(role)) {
        const supervisedCellIds = await getSupervisedCellIds(userId);
        const isAssignee = existingTask.assigneeId === userId;
        const isProjectManager = existingTask.project?.managerId === userId;
        const isCellSupervisor = existingTask.project?.cellId && supervisedCellIds.includes(existingTask.project.cellId);

        if (!isAssignee && !isProjectManager && !isCellSupervisor) {
            return { success: false, error: 'Bu görevi güncelleme yetkiniz yok.' };
        }
    }

    // Statüyü güncelle
    const [updatedTask] = await db.update(tasks)
      .set({ 
        status: newStatus as any
      })
      .where(eq(tasks.id, taskId))
      .returning();

    if (!updatedTask) {
      return { success: false, error: 'Görev bulunamadı veya yetkiniz yok.' };
    }

    // 1. Geçmişe (Logs) kaydet
    await db.insert(taskHistory).values({
        id: crypto.randomUUID(),
        taskId,
        changedBy: userId,
        actionType: 'status_change',
        oldStatus: existingTask.status,
        newStatus: newStatus
    });

    return { success: true, task: updatedTask };
  } catch (err: any) {
    console.error('Görev Statü Güncelleme Hatası:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Görev detaylarını (başlık, açıklama, öncelik, atanan kişi vb.) günceller ve geçmişe yazar.
 */
export async function updateTaskDetailsAction(taskId: string, params: {
  title?: string,
  description?: string,
  priority?: string,
  assigneeId?: string | null,
  dueDate?: string | null
}) {
  try {
    const authCtx = await getAuthContext();
    if (!authCtx) return { success: false, error: 'Oturum bulunamadı.' };
    const { userId, orgId, role } = authCtx;
    
    const existingTask = await db.query.tasks.findFirst({
        where: and(eq(tasks.id, taskId), eq(tasks.orgId, orgId)),
        with: { project: true }
    });

    if (!existingTask) return { success: false, error: 'Görev bulunamadı.' };

    if (!isBoss(role)) {
        const supervisedCellIds = await getSupervisedCellIds(userId);
        const isAssignee = existingTask.assigneeId === userId;
        const isProjectManager = existingTask.project?.managerId === userId;
        const isCellSupervisor = existingTask.project?.cellId && supervisedCellIds.includes(existingTask.project.cellId);

        if (!isAssignee && !isProjectManager && !isCellSupervisor) {
            return { success: false, error: 'Bu görevi güncelleme yetkiniz yok.' };
        }
    }

    const changes: any[] = [];
    if (params.title !== undefined && params.title !== existingTask.title) {
        changes.push({ actionType: 'update_details', details: `Başlık değiştirildi: ${params.title}` });
    }
    if (params.priority !== undefined && params.priority !== existingTask.priority) {
        changes.push({ actionType: 'priority_change', oldStatus: existingTask.priority, newStatus: params.priority });
    }
    if (params.assigneeId !== undefined && params.assigneeId !== existingTask.assigneeId) {
        changes.push({ actionType: 'assignee_change', oldStatus: existingTask.assigneeId || 'Yok', newStatus: params.assigneeId || 'Yok' });
    }

    const [updatedTask] = await db.update(tasks)
      .set({ 
        title: params.title !== undefined ? params.title : existingTask.title,
        description: params.description !== undefined ? params.description : existingTask.description,
        priority: params.priority !== undefined ? (params.priority as any) : existingTask.priority,
        assigneeId: params.assigneeId !== undefined ? params.assigneeId : existingTask.assigneeId,
        dueDate: params.dueDate !== undefined ? params.dueDate : existingTask.dueDate,
      })
      .where(eq(tasks.id, taskId))
      .returning();

    for (const change of changes) {
        await db.insert(taskHistory).values({
            id: crypto.randomUUID(),
            taskId,
            changedBy: userId,
            actionType: change.actionType,
            oldStatus: change.oldStatus,
            newStatus: change.newStatus,
            details: change.details
        });
    }

    return { success: true, task: updatedTask };

    return { success: true, task: updatedTask };
  } catch (err: any) {
    console.error('Görev Statü Güncelleme Hatası:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Bir görevin tüm değişim geçmişini getirir.
 */
export async function getTaskHistoryAction(taskId: string) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

        const history = await db.query.taskHistory.findMany({
            where: eq(taskHistory.taskId, taskId),
            with: {
                user: true
            },
            orderBy: [desc(taskHistory.createdAt)]
        });

        return { success: true, history };
    } catch (err: any) {
        console.error('GEÇMİŞ GETİRİLEMEDİ:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Dashboard için özet verileri getirir.
 */
export async function getDashboardDataAction() {
  try {
    const authCtx = await getAuthContext();
    if (!authCtx) return { success: false, error: 'Oturum bulunamadı.' };
    const { userId, orgId, role } = authCtx;

    const isGlobalManager = isBoss(role);
    const supervisedCellIds = await getSupervisedCellIds(userId);
    
    // Filtreleme mantığı
    let whereClause;
    if (isGlobalManager) {
        whereClause = eq(tasks.orgId, orgId);
    } else if (role === 'Vardiya Amiri') {
        const cellProjects = await db.select({ id: projects.id }).from(projects).where(inArray(projects.cellId, supervisedCellIds));
        const projectIds = cellProjects.map((p: any) => p.id);
        whereClause = and(eq(tasks.orgId, orgId), or(eq(tasks.assigneeId, userId), projectIds.length > 0 ? inArray(tasks.projectId, projectIds) : undefined));
    } else if (role === 'Proje Yöneticisi') {
        const managedProjects = await db.select({ id: projects.id }).from(projects).where(eq(projects.managerId, userId));
        const projectIds = managedProjects.map((p: any) => p.id);
        whereClause = and(eq(tasks.orgId, orgId), or(eq(tasks.assigneeId, userId), projectIds.length > 0 ? inArray(tasks.projectId, projectIds) : undefined));
    } else {
        whereClause = and(eq(tasks.orgId, orgId), eq(tasks.assigneeId, userId));
    }

    // 1. Son Görevler
    const recentTasks = await db.query.tasks.findMany({
      where: whereClause,
      limit: 5,
      orderBy: [desc(tasks.createdAt)],
      with: {
        project: true,
        assignee: true
      }
    });

    // 2. İstatistikler
    const allFilteredTasks = await db.query.tasks.findMany({
      where: whereClause,
      columns: {
        status: true,
        priority: true
      }
    });

    const stats = {
      total: allFilteredTasks.length,
      completed: allFilteredTasks.filter((t: any) => t.status === 'done').length,
      pending: allFilteredTasks.filter((t: any) => t.status !== 'done').length,
      critical: allFilteredTasks.filter((t: any) => t.priority === 'critical').length,
    };

    return { success: true, tasks: recentTasks, stats };
  } catch (err: any) {
    console.error('DASHBOARD DATA ERROR:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Görev Eklerini Kaydetme (UploadThing sonrası)
 */
export async function addTaskAttachmentAction(taskId: string, fileName: string, fileUrl: string, fileSize?: number, fileType?: string) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum açılmamış.' };

    const attachmentId = crypto.randomUUID();
    const [attachment] = await db.insert(taskAttachments).values({
      id: attachmentId,
      taskId,
      fileName,
      fileUrl,
      fileSize,
      fileType,
      createdBy: userId
    }).returning();

    // 1. Geçmişe (Logs) kaydet: Dosya Yüklendi
    await db.insert(taskHistory).values({
        id: crypto.randomUUID(),
        taskId,
        changedBy: userId,
        actionType: 'attachment_added',
        details: `Dosya yüklendi: ${fileName}`
    });

    return { success: true, attachment };
  } catch (err: any) {
    console.error('EKLER KAYIT HATASI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mevcut kullanıcıya atanan tüm görevleri projesiyle birlikte getirir.
 */
export async function getMyTasksAction() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const data = await db.query.tasks.findMany({
      where: and(
        eq(tasks.assigneeId, userId),
        eq(tasks.orgId, orgId)
      ),
      with: {
        project: true
      },
      orderBy: [desc(tasks.createdAt)]
    });

    return { success: true, tasks: data };
  } catch (err: any) {
    console.error('TAKIVM GÖREV HATASI:', err);
    return { success: false, error: err.message };
  }
}
