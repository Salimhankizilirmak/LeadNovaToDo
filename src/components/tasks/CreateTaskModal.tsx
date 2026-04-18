'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Loader2, ClipboardCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useUserStore } from '@/store/useUserStore';

/* ── Zod Şeması ─────────────────────────────────────────────── */
const schema = z.object({
  title: z.string().min(1, 'Görev başlığı zorunludur').max(120),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assignee_id: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

/* ── Props ──────────────────────────────────────────────────── */
interface CreateTaskModalProps {
  projectId: string;
  members: any[];
  isOpen: boolean;
  onClose: () => void;
  onCreated: (task: any) => void;
}

export default function CreateTaskModal({
  projectId,
  members,
  isOpen,
  onClose,
  onCreated,
}: CreateTaskModalProps) {
  const user = useUserStore((s) => s.user);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
      assignee_id: null,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: values.title,
          priority: values.priority,
          project_id: projectId,
          assignee_id: values.assignee_id || null,
          status: 'todo',
        })
        .select('*, assignee:assignee_id(id, email, display_name)')
        .single();

      if (error) throw error;

      toast.success('Görev başarıyla eklendi ✓');
      onCreated(data);
      onClose();
    } catch {
      toast.error('Görev eklenirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Yeni Görev</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Görev Başlığı */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Görev Başlığı
            </label>
            <input
              {...register('title')}
              autoFocus
              placeholder="Örn: Landing page tasarımı yapılacak"
              className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-indigo-500/10 ${
                errors.title
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-gray-200 focus:border-indigo-500'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1.5 ml-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Öncelik */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Öncelik
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'low', label: 'Düşük', color: 'bg-gray-100 text-gray-600 border-gray-200' },
                { id: 'medium', label: 'Orta', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                { id: 'high', label: 'Yüksek', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                { id: 'critical', label: 'Kritik', color: 'bg-red-100 text-red-700 border-red-200' },
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
                  <div className={`w-full h-full flex items-center justify-center text-xs font-bold rounded-xl border-2 peer-checked:ring-4 peer-checked:ring-indigo-500/10 bg-white border-gray-100 text-gray-400 peer-checked:border-indigo-500 peer-checked:text-indigo-600 peer-checked:bg-indigo-50 transition-all`}>
                    {p.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Atanan Kişi */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Atanan Kişi (Opsiyonel)
            </label>
            <select
              {...register('assignee_id')}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-indigo-400 transition-all outline-none"
            >
              <option value="">Atanmamış</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.display_name || member.email.split('@')[0]} ({member.email})
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-3 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
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
