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
  try {
    const { getToken, userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: 'Oturum açılmamış. Lütfen giriş yapın.' };
    }

    const token = await getToken({ template: 'supabase' });
    if (!token) {
      return { success: false, error: 'Supabase erişim anahtarı alınamadı.' };
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
      .select('*, project:projects(name, color)')
      .single();

    if (error) {
      console.error('Görev Kayıt Hatası:', error);
      return { success: false, error: `Veritabanı Hatası: ${error.message}` };
    }

    // 2. Eğer birine atandıysa e-posta gönder
    if (params.assigneeId && params.assigneeId !== "") {
      try {
        console.log(`[DEBUG] E-posta süreci başlıyor. Atanan: ${params.assigneeId}`);
        const client = await clerkClient();
        const assigneeUser = await client.users.getUser(params.assigneeId);
        
        if (assigneeUser) {
          const toEmail = assigneeUser.emailAddresses[0]?.emailAddress;
          console.log(`[DEBUG] Alıcı e-postası bulundu: ${toEmail}`);

          if (toEmail) {
            const emailResult = await sendTaskAssignmentEmail(
              toEmail,
              task.title,
              task.project?.name || 'Bilinmeyen Proje',
              user.firstName || user.emailAddresses[0].emailAddress
            );
            console.log(`[DEBUG] E-posta gönderim sonucu:`, emailResult.success ? 'Başarılı' : 'Başarısız');
          } else {
            console.warn('[DEBUG] Alıcının e-posta adresi bulunamadı.');
          }
        } else {
          console.warn('[DEBUG] Atanan kullanıcı Clerk üzerinde bulunamadı.');
        }
      } catch (emailError: any) {
        console.error('[DEBUG] Bildirim gönderilirken hata oluştu:', emailError.message);
      }
    }

    return { success: true, task };
  } catch (globalError: any) {
    console.error('SERVER ACTION CRITICAL ERROR:', globalError);
    return { success: false, error: globalError.message || 'Sunucu tarafında beklenmedik bir hata oluştu.' };
  }
}
