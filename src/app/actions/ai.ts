'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * AI için proje bağlamını (context) getirir.
 */
export async function getAIContextAction(projectId: string) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return { success: false, error: 'Oturum bulunamadı.' };

    // 1. Proje bilgisini çek
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.orgId, orgId)
      )
    });

    if (!project) return { success: false, error: 'Proje bulunamadı.' };

    // 2. Projeye ait görev özetlerini çek
    const projectTasks = await db.query.tasks.findMany({
      where: eq(tasks.projectId, projectId),
      columns: {
        title: true,
        status: true
      }
    });

    return { 
      success: true, 
      context: {
        name: project.name,
        tasks: projectTasks
      }
    };
  } catch (err: any) {
    console.error('AI CONTEXT ERROR:', err);
    return { success: false, error: err.message };
  }
}
