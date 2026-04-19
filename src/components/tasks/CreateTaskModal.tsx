'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Loader2, ClipboardCheck } from 'lucide-react';
import { createClerkClient } from '@/utils/supabase/client';
import { useUser, useAuth } from '@clerk/nextjs';

/* ── Zod Şeması ─────────────────────────────────────────────── */
const schema = z.object({
  title: z.string().min(1, 'Görev başlığı zorunludur').max(120),
  description: z.string().max(500).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assignee_id: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

/* ── Tipler ─────────────────────────────────────────────────── */
interface Member {
  id: string;
  email?: string;
  display_name?: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string | null;
  project_id: string;
  assignee_id: string | null;
  created_by: string;
  org_id: string;
}

/* ── Props ──────────────────────────────────────────────────── */
interface CreateTaskModalProps {
  projectId: string;
  orgId: string;
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export default function CreateTaskModal({
  projectId,
  orgId,
  members,
  isOpen,
  onClose,
  onCreated,
}: CreateTaskModalProps) {
  // TODO Sprint 2: Clerk userId → Supabase user_id mapping eklenecek
  const { user } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id ?? null;
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
      assignee_id: null,
      description: '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: FormValues) => {
    if (!userId) return;
    setSubmitting(true);

    try {
      const token = await getToken({ template: 'supabase' });
      console.log("CLERK TOKEN DURUMU (Task):", token ? "Token Başarıyla Alındı ✓" : "TOKEN BOŞ! ❌");
      if (!token) throw new Error('Oturum anahtarı alınamadı.');
      
      const supabase = createClerkClient(token);
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: values.title,
          description: values.description || "", // Boş string garantisi (400 Hatası Fix)
          priority: values.priority,
          project_id: projectId,
          org_id: orgId,
          assignee_id: values.assignee_id || null,
          created_by: userId,
          status: 'todo',
        })
        .select('*')
        .single();

      if (error) throw error;

      toast.success('Görev başarıyla eklendi ✓');
      onCreated(data);
      onClose();
    } catch (err: any) {
      console.error('GÖREV OLUŞTURMA HATASI:', err);
      const errorMessage = err.message || 'Görev eklenirken bir hata oluştu.';
      const detail = err.details ? ` (${err.details})` : '';
      toast.error(`${errorMessage}${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
               <ClipboardCheck size={18} />
            </div>
            <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">Yeni Görev</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-7 space-y-6">
          {/* Görev Başlığı */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Görev Başlığı
            </label>
            <input
              {...register('title')}
              autoFocus
              placeholder="Örn: Tasarım yapılacak"
              className={`w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-300 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-indigo-500/5 ${
                errors.title
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-gray-100 focus:border-indigo-400'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1 ml-1 font-medium">
                {errors.title.message}
              </p>
            )}
          </div>
          
          {/* Açıklama */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              {...register('description')}
              placeholder="Görev detayı ekleyin..."
              rows={3}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-100 bg-gray-50 text-gray-900 placeholder-gray-300 outline-none transition-all focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 resize-none"
            />
          </div>

          {/* Öncelik */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Öncelik
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'low', label: 'Düşük' },
                { id: 'medium', label: 'Orta' },
                { id: 'high', label: 'Yüksek' },
                { id: 'critical', label: 'Kritik' },
              ].map((p) => (
                <label
                  key={p.id}
                  className="relative flex items-center justify-center h-10 cursor-pointer rounded-xl transition-all"
                >
                  <input
                    type="radio"
                    value={p.id}
                    {...register('priority')}
                    className="peer sr-only"
                  />
                  <div className={`w-full h-full flex items-center justify-center text-[10px] font-black rounded-xl border bg-white border-gray-100 text-gray-400 peer-checked:border-indigo-600 peer-checked:text-indigo-600 peer-checked:bg-indigo-50 transition-all shadow-sm peer-checked:shadow-none uppercase tracking-tighter`}>
                    {p.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Atanan Kişi */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Atanan Kişi (Opsiyonel)
            </label>
            <select
              {...register('assignee_id')}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-100 bg-gray-50 text-gray-900 focus:bg-white focus:border-indigo-400 transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="">Atanmamış</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.display_name || member.email?.split('@')[0] || `Kullanıcı (${member.id.substring(0, 5)})`}
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-2 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-2xl transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                'Görev Ekle'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
