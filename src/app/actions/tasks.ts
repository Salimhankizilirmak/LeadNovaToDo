'use server';

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { createClerkClient } from '@/utils/supabase/server';
import { sendTaskAssignmentEmail } from '@/lib/email';

interface CreateTaskParams {
  title: string;
  description?: string;
  projectId: string;
  orgId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string | null;
}

/**
 * Görev oluşturma ve atanan kişiye bildirim gönderme (Server Action)
 */
export async function createTaskAction(params: CreateTaskParams) {
  const { getToken, userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error('Oturum açılmamış.');
  }

  const token = await getToken({ template: 'supabase' });
  if (!token) {
    throw new Error('Supabase erişim anahtarı alınamadı.');
  }

  const supabase = await createClerkClient(token);

  // 1. Görevi veritabanına kaydet
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title: params.title,
      description: params.description || "",
      project_id: params.projectId,
      org_id: params.orgId || null,
      priority: params.priority,
      assignee_id: params.assigneeId || null,
      created_by: userId,
      status: 'todo',
    })
    .select('*, project:project_id(name)')
    .single();

  if (error) {
    console.error('Görev Kayıt Hatası:', error);
    throw new Error(error.message);
  }

  // 2. Eğer birine atandıysa ve atanan kişi ben değilsem e-posta gönder
  if (params.assigneeId && params.assigneeId !== userId) {
    try {
      const client = await clerkClient();
      const assigneeUser = await client.users.getUser(params.assigneeId);
      const toEmail = assigneeUser.emailAddresses[0]?.emailAddress;

      if (toEmail) {
        await sendTaskAssignmentEmail(
          toEmail,
          task.title,
          task.project?.name || 'Bilinmeyen Proje',
          user.firstName || user.emailAddresses[0].emailAddress
        );
      }
    } catch (emailError) {
      console.error('Bildirim gönderilirken hata oluştu (Görev oluştu):', emailError);
      // E-posta hatası kritik değil, görev oluştu sonuçta.
    }
  }

  return { success: true, task };
}
