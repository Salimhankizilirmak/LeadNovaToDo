'use server';

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { tasks, projects, profiles, taskAttachments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { sendTaskAssignmentEmail } from '@/lib/email';

interface CreateTaskParams {
  title: string;
  description?: string;
  projectId: string;
  orgId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string | null;
  dueDate?: string | null;
}

/**
 * Görev oluşturma ve atanan kişiye bildirim gönderme (Server Action)
 */
export async function createTaskAction(params: CreateTaskParams) {
  try {
    const { userId, orgId: currentOrgId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: 'Oturum açılmamış. Lütfen giriş yapın.' };
    }

    // Güvenlik Kontrolü: Organizasyon ID eşleşmeli
    if (params.orgId !== currentOrgId) {
      return { success: false, error: 'Yetkisiz organizasyon işlemi.' };
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
      dueDate: params.dueDate || null,
      createdBy: userId,
      status: 'todo',
    }).returning();

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
            await sendTaskAssignmentEmail(
              toEmail,
              task.title,
              project?.name || 'Bilinmeyen Proje',
              user.firstName || user.emailAddresses[0].emailAddress
            );
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
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum açılmamış.' };

    // Güvenlik: Sadece kendi organizasyonundaki görevi güncelleyebilir
    const [updatedTask] = await db.update(tasks)
      .set({ 
        status: newStatus as any
      })
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.orgId, orgId)
      ))
      .returning();

    if (!updatedTask) {
      return { success: false, error: 'Görev bulunamadı veya yetkiniz yok.' };
    }

    return { success: true, task: updatedTask };
  } catch (err: any) {
    console.error('Görev Statü Güncelleme Hatası:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Dashboard için özet verileri getirir.
 */
export async function getDashboardDataAction() {
  try {
    const { userId, orgId } = await auth();
    const user = await currentUser();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const myRole = user?.publicMetadata?.role as string;
    const isManager = ['Patron', 'Genel Müdür', 'Admin'].includes(myRole);

    // 1. Son Görevler
    const recentTasks = await db.query.tasks.findMany({
      where: isManager ? eq(tasks.orgId, orgId) : and(eq(tasks.orgId, orgId), eq(tasks.assigneeId, userId)),
      limit: 5,
      orderBy: [desc(tasks.createdAt)],
      with: {
        project: true,
        assignee: true
      }
    });

    // 2. İstatistikler
    const allOrgTasks = await db.query.tasks.findMany({
      where: isManager ? eq(tasks.orgId, orgId) : and(eq(tasks.orgId, orgId), eq(tasks.assigneeId, userId)),
      columns: {
        status: true,
        priority: true
      }
    });

    const stats = {
      total: allOrgTasks.length,
      completed: allOrgTasks.filter(t => t.status === 'done').length,
      pending: allOrgTasks.filter(t => t.status !== 'done').length,
      critical: allOrgTasks.filter(t => t.priority === 'critical').length,
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
