'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Loader2, ClipboardCheck, Paperclip, FileCheck } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { createTaskAction } from '@/app/actions/tasks';
import { Task, Member } from '@/types/task';
import { UploadButton } from '@/utils/uploadthing';


/* ── Zod Şeması ─────────────────────────────────────────────── */
const schema = z.object({
  title: z.string().min(1, 'Görev başlığı zorunludur').max(120),
  description: z.string().max(500).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assigneeId: z.string().optional().nullable(),
  blockId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

/* ── Props ──────────────────────────────────────────────────── */
interface CreateTaskModalProps {
  projectId: string;
  orgId: string;
  members: Member[];
  blocks?: any[];
  isOpen: boolean;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export default function CreateTaskModal({
  projectId,
  orgId,
  members,
  blocks = [],
  isOpen,
  onClose,
  onCreated,
}: CreateTaskModalProps) {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const [submitting, setSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string, name: string, size?: number, type?: string } | null>(null);


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
      assigneeId: null,
      description: '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: FormValues) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      const result = await createTaskAction({
        title: values.title,
        description: values.description,
        priority: values.priority,
        projectId: projectId,
        orgId: orgId,
        assigneeId: values.assigneeId,
        blockId: values.blockId,
        dueDate: values.dueDate,
        attachment: attachment || undefined
      });


      if (!result.success) throw new Error(result.error || 'Görev oluşturulamadı');

      toast.success('Görev başarıyla eklendi ve bildirim gönderildi ✓');
      onCreated(result.task as any);
      onClose();
    } catch (err: any) {
      console.error('GÖREV OLUŞTURMA HATASI:', err);
      toast.error(err.message || 'Görev eklenirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full h-full sm:h-auto sm:max-w-md bg-white sm:rounded-[2rem] rounded-none shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-7 space-y-6 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Görev Başlığı
            </label>
            <input
              {...register('title')}
              autoFocus
              placeholder="Örn: Tasarım yapılacak"
              className={`w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-300 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-indigo-500/5 ${errors.title
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Atanan Kişi (Opsiyonel)
              </label>
              <select
                {...register('assigneeId')}
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-100 bg-gray-50 text-gray-900 focus:bg-white focus:border-indigo-400 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">Atanmamış</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.display_name || member.full_name || member.email?.split('@')[0]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Blok/İstasyon (Opsiyonel)
              </label>
              <select
                {...register('blockId')}
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-100 bg-gray-50 text-gray-900 focus:bg-white focus:border-indigo-400 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">İstasyonsuz</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Bitiş Tarihi (Opsiyonel)
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-100 bg-gray-50 text-gray-900 focus:bg-white focus:border-indigo-400 transition-all outline-none cursor-pointer"
            />
          </div>

          {/* Görev Eki (Optional) */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip size={14} className="text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Görev Materyali</span>
              </div>
              {!attachment ? (
                <UploadButton
                  endpoint="taskAttachment"
                  onClientUploadComplete={(res) => {
                    if (res) {
                      setAttachment({
                        url: res[0].url,
                        name: res[0].name,
                        size: res[0].size,
                        type: res[0].type
                      });
                      toast.success('Materyal yüklendi!');
                    }
                  }}
                  appearance={{
                    button: "text-[10px] font-black bg-white text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-all h-auto",
                    allowedContent: "hidden"
                  }}
                  content={{
                    button: ({ ready }) => ready ? "YÜKLE" : "..."
                  }}
                />
              ) : (
                <div className="flex items-center gap-2 text-emerald-600">
                  <FileCheck size={14} />
                  <span className="text-[9px] font-black uppercase">Tamam</span>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-[9px] text-red-500 font-bold hover:underline"
                  >
                    SİL
                  </button>
                </div>
              )}
            </div>
            {attachment && (
              <p className="mt-2 text-[9px] text-gray-400 font-bold truncate tracking-tight">{attachment.name}</p>
            )}
          </div>


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
