'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { projects, tasks, profiles, cells, taskHistory, blocks } from '@/db/schema';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';

/**
 * Raporlar sayfası için yetki bazlı analitik verileri getirir.
 */
export async function getAnalyticsAction() {
  try {
    const { userId, orgId } = await auth();
    const user = await currentUser();

    if (!userId || !orgId || !user) {
      return { success: false, error: 'Oturum bulunamadı.' };
    }

    const myRole = user.publicMetadata?.role as string || 'Personel';
    const isBoss = ['Patron', 'Genel Müdür', 'Admin'].includes(myRole);
    
    // 1. Özet İstatistikler (Yetkiye Göre Filtrelenmiş)
    // -------------------------------------------------------
    let statsQuery;
    if (isBoss) {
        // Tüm organizasyon
        statsQuery = db.select({
            status: tasks.status,
            count: sql<number>`count(*)`
        }).from(tasks).where(eq(tasks.orgId, orgId)).groupBy(tasks.status);
    } else if (myRole === 'Proje Yöneticisi') {
        // Sadece yönettiği projelerdeki görevler
        const myProjects = await db.select({ id: projects.id }).from(projects).where(eq(projects.managerId, userId));
        const projectIds = myProjects.map(p => p.id);
        
        if (projectIds.length > 0) {
            statsQuery = db.select({
                status: tasks.status,
                count: sql<number>`count(*)`
            }).from(tasks).where(
                and(
                    eq(tasks.orgId, orgId),
                    sql`${tasks.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`
                )
            ).groupBy(tasks.status);
        }
    } else {
        // Personel: Sadece kendi görevleri
        statsQuery = db.select({
            status: tasks.status,
            count: sql<number>`count(*)`
        }).from(tasks).where(and(eq(tasks.orgId, orgId), eq(tasks.assigneeId, userId))).groupBy(tasks.status);
    }

    const taskStats = statsQuery ? await statsQuery : [];

    // 2. Hücre Bazlı Performans (Sadece Patron/GM görebilir)
    // -------------------------------------------------------
    let cellPerformance: any[] = [];
    if (isBoss) {
        const cellsData = await db.query.cells.findMany({
            where: eq(cells.orgId, orgId),
            with: {
                projects: {
                    with: {
                        tasks: true
                    }
                }
            }
        });

        cellPerformance = cellsData.map(c => {
            const allTasks = c.projects.flatMap(p => p.tasks);
            const doneCount = allTasks.filter(t => t.status === 'done').length;
            return {
                name: c.name,
                total: allTasks.length,
                completed: doneCount,
                efficiency: allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0
            };
        });
    }

    // 3. Bütçe Dağılımı (Sadece Patron/GM/PM)
    // -------------------------------------------------------
    let budgetData: any[] = [];
    if (isBoss || myRole === 'Proje Yöneticisi') {
        const projectsData = await db.query.projects.findMany({
            where: isBoss ? eq(projects.orgId, orgId) : and(eq(projects.orgId, orgId), eq(projects.managerId, userId)),
            columns: {
                name: true,
                budget: true
            }
        });
        budgetData = projectsData.map(p => ({
            name: p.name,
            value: (p.budget || 0) / 100 // TRY formatı
        })).filter(p => p.value > 0);
    }

    return {
      success: true,
      role: myRole,
      data: {
        taskStats,
        cellPerformance,
        budgetData
      }
    };

  } catch (err: any) {
    console.error('ANALYTICS ERROR:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Excel Dışa Aktarım (Kurumsal) için detaylı görev verilerini getirir.
 * Patron ve yöneticiler operasyonun tüm detaylarını (bütçe, tamamlanma zamanı vb.) görür.
 */
export async function getExcelDataAction() {
    try {
        const { userId, orgId } = await auth();
        const user = await currentUser();

        if (!userId || !orgId || !user) {
            return { success: false, error: 'Oturum bulunamadı.' };
        }

        const myRole = user.publicMetadata?.role as string || 'Personel';
        const isBoss = ['Patron', 'Genel Müdür', 'Admin'].includes(myRole);

        if (!isBoss) {
            return { success: false, error: 'Excel raporu oluşturma yetkiniz bulunmamaktadır.' };
        }

        const rawTasks = await db.query.tasks.findMany({
            where: eq(tasks.orgId, orgId),
            with: {
                project: {
                   with: { cell: true }
                },
                assignee: true,
                block: true
            }
        });

        // Tamamlanma tarihi için task_history'den 'done' durumuna geçtiği anı bul
        const doneTaskIds = rawTasks.filter(t => t.status === 'done').map(t => t.id);
        const completionDates: Record<string, string> = {};
        
        if (doneTaskIds.length > 0) {
            const histories = await db.query.taskHistory.findMany({
                 where: and(
                    inArray(taskHistory.taskId, doneTaskIds),
                    eq(taskHistory.newStatus, 'done')
                 )
            });
            histories.forEach(h => {
                if (!completionDates[h.taskId] || new Date(h.createdAt || 0) > new Date(completionDates[h.taskId])) {
                    completionDates[h.taskId] = h.createdAt ? new Date(h.createdAt).toLocaleString('tr-TR') : '-';
                }
            });
        }

        const formattedData = rawTasks.map(t => ({
            "Görev Başlığı": t.title,
            "Atanan Personel": t.assignee?.fullName || 'Atanmamış',
            "Departman (Hücre)": t.project?.cell?.name || 'Tanımsız',
            "İş İstasyonu (Blok)": t.block?.name || 'Genel',
            "Durum": t.status === 'todo' ? 'Yapılacak' : t.status === 'in_progress' ? 'Devam Eden' : t.status === 'review' ? 'İnceleme' : 'Tamamlandı',
            "Öncelik": t.priority === 'low' ? 'Düşük' : t.priority === 'medium' ? 'Orta' : 'Yüksek',
            "Proje Bütçesi (TRY)": t.project?.budget ? t.project.budget / 100 : 0,
            "Oluşturulma Tarihi": t.createdAt ? new Date(t.createdAt).toLocaleString('tr-TR') : '-',
            "Tamamlanma Tarihi": t.status === 'done' ? (completionDates[t.id] || 'Bilinmiyor') : '-'
        }));

        return { success: true, data: formattedData };
    } catch(err: any) {
        console.error('EXCEL EXPORT ERROR:', err);
        return { success: false, error: err.message };
    }
}
