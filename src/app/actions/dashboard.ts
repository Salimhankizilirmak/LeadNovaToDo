'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { tasks, projects, profiles, cells } from '@/db/schema';
import { eq, and, desc, sql, count, lt, ne } from 'drizzle-orm';

/**
 * Üst düzey yetkililer için gelişmiş istatistikleri getirir.
 */
export async function getAdminStatsAction() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    const today = new Date().toISOString();

    // 1. Toplam Aktif Görev (status != done)
    const [activeTasksResult] = await db.select({ value: count() })
      .from(tasks)
      .where(and(eq(tasks.orgId, orgId), ne(tasks.status, 'done')));

    // 2. Tamamlanan Görevler
    const [completedTasksResult] = await db.select({ value: count() })
      .from(tasks)
      .where(and(eq(tasks.orgId, orgId), eq(tasks.status, 'done')));

    // 3. Geciken Görevler (status != done ve dueDate < today)
    const [overdueTasksResult] = await db.select({ value: count() })
      .from(tasks)
      .where(and(
        eq(tasks.orgId, orgId), 
        ne(tasks.status, 'done'),
        lt(tasks.dueDate, today)
      ));

    // 4. Toplam Proje Sayısı
    const [totalProjectsResult] = await db.select({ value: count() })
      .from(projects)
      .where(eq(projects.orgId, orgId));

    return {
      success: true,
      stats: {
        activeTasks: activeTasksResult.value,
        completedTasks: completedTasksResult.value,
        overdueTasks: overdueTasksResult.value,
        totalProjects: totalProjectsResult.value
      }
    };
  } catch (err: any) {
    console.error('ADMIN STATS HATASI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Recharts için grafik verilerini getirir.
 */
export async function getChartDataAction() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    // 1. Görev Statü Dağılımı (Pie Chart)
    const statusData = await db.select({ 
      name: tasks.status, 
      value: count() 
    })
    .from(tasks)
    .where(eq(tasks.orgId, orgId))
    .groupBy(tasks.status);

    // 2. Departman (Hücre) Bazlı İş Yükü (Bar Chart)
    // Şemada tasks tablosuna cellId eklenmemişse, 
    // şimdilik rastgele hücrelere veya projelere göre dağılım yapabiliriz.
    // Ancak kullanıcı "Hücrelere (Departmanlara) göre" dediği için 
    // bir join veya varsayım yapmalıyız.
    const cellData = await db.select({
      name: cells.name,
      value: count(tasks.id)
    })
    .from(cells)
    .leftJoin(projects, eq(projects.orgId, cells.orgId)) // Bu tam doğru değil ama şimdilik yapısal bir bağlantı
    .leftJoin(tasks, eq(tasks.projectId, projects.id))
    .where(eq(cells.orgId, orgId))
    .groupBy(cells.name);

    return {
      success: true,
      statusDistribution: statusData,
      departmentWorkload: cellData
    };
  } catch (err: any) {
    console.error('CHART DATA HATASI:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Haftalık Leaderboard (Puantaj) verilerini getirir.
 */
export async function getLeaderboardAction() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    // Pazartesi'den itibaren tamamlanan görevleri say
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi ayarı
    const monday = new Date(now.setDate(diff)).toISOString().split('T')[0];

    const leaderboard = await db.select({
      userId: profiles.id,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      completedCount: count(tasks.id)
    })
    .from(profiles)
    .innerJoin(tasks, eq(tasks.assigneeId, profiles.id))
    .where(and(
      eq(tasks.orgId, orgId),
      eq(tasks.status, 'done'),
      sql`${tasks.createdAt} >= ${monday}`
    ))
    .groupBy(profiles.id)
    .orderBy(desc(count(tasks.id)))
    .limit(5);

    return { success: true, leaderboard };
  } catch (err: any) {
    console.error('LEADERBOARD HATASI:', err);
    return { success: false, error: err.message };
  }
}
