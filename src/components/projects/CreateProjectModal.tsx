'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Loader2, FolderPlus, Paperclip, FileCheck } from 'lucide-react';
import { useUser, useOrganization } from '@clerk/nextjs';
import { createProjectAction, getOrgMembersAction, getCellsAction } from '@/app/actions/projects';
import { UploadButton } from '@/utils/uploadthing';


/* ── Tipler ─────────────────────────────────────────────────── */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
  orgId: string;
  createdBy: string;
  createdAt: string;
}

/* ── Sabitler ───────────────────────────────────────────────── */
const COLOR_OPTIONS = [
  { hex: '#6366F1', label: 'Indigo' },
  { hex: '#10B981', label: 'Yeşil' },
  { hex: '#EF4444', label: 'Kırmızı' },
  { hex: '#F59E0B', label: 'Sarı' },
  { hex: '#8B5CF6', label: 'Mor' },
];

/* ── Zod Şeması ─────────────────────────────────────────────── */
const schema = z.object({
  name: z.string().min(3, 'Proje adı en az 3 karakter olmalıdır').max(80),
  description: z.string().max(300).optional(),
  managerId: z.string().optional().nullable(),
  cellId: z.string().min(1, 'Lütfen bir departman/hücre seçiniz'), // Zorunlu
  budget: z.number().optional().nullable(),
});
type FormValues = z.infer<typeof schema>;


/* ── Modal Bileşeni ─────────────────────────────────────────── */
interface CreateProjectModalProps {
  onClose: () => void;
  onCreated: (project: any) => void;
}

export default function CreateProjectModal({
  onClose,
  onCreated,
}: CreateProjectModalProps) {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].hex);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [cells, setCells] = useState<any[]>([]);
  const [attachment, setAttachment] = useState<{ url: string, name: string, size?: number, type?: string } | null>(null);


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      managerId: null,
      cellId: ''
    }
  });

  // Üyeleri ve Hücreleri yükle
  useEffect(() => {
    async function loadData() {
      const [membersRes, cellsRes] = await Promise.all([
        getOrgMembersAction(),
        getCellsAction()
      ]);
      
      if (membersRes.success && membersRes.members) {
        setMembers(membersRes.members);
      }
      if (cellsRes.success && cellsRes.cells) {
        setCells(cellsRes.cells);
      }
    }
    if (userId) loadData();
  }, [userId]);

  const onSubmit = async (values: FormValues) => {
    if (!userId) return;
    setSubmitting(true);

    try {
      const result = await createProjectAction({
        name: values.name,
        description: values.description,
        color: selectedColor,
        managerId: values.managerId || undefined,
        cellId: values.cellId,
        budget: values.budget ? Math.round(values.budget * 100) : 0,
        attachment: attachment || undefined
      });

      if (!result.success) throw new Error(result.error);

      toast.success('Proje başarıyla oluşturuldu ✓');
      onCreated(result.project);
      onClose();
    } catch (error: any) {
      toast.error(`Hata: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Yeni Proje</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 h-[70vh] overflow-y-auto">
          {/* Proje Adı */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Proje Adı <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="Örn: Q2 Pazarlama Kampanyası"
              className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition-colors focus:bg-white ${
                errors.name
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-gray-200 focus:border-indigo-400'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Bağlı Hücre/Departman */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Bağlı Olduğu Departman (Hücre) <span className="text-red-500">*</span>
            </label>
            <select
              {...register('cellId')}
              className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-gray-50 text-gray-900 outline-none transition-colors focus:bg-white cursor-pointer ${
                errors.cellId ? 'border-red-400' : 'border-gray-200 focus:border-indigo-400'
              }`}
            >
              <option value="">Hücre seçiniz...</option>
              {cells.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.cellId && (
              <p className="text-xs text-red-500 mt-1">{errors.cellId.message}</p>
            )}
          </div>

          {/* Sorumlu Personel */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Projeden Sorumlu Personel
            </label>
            <select
              {...register('managerId')}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none focus:border-indigo-400 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="">Sorumlu seçilmedi</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.email?.split('@')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Bütçe (TRY) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
               Proje Bütçesi (TRY)
            </label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₺</span>
                <input
                    type="number"
                    {...register('budget', { valueAsNumber: true })}
                    placeholder="Örn: 1.500.000"
                    className="w-full pl-8 pr-4 py-3 text-sm rounded-xl border border-gray-100 bg-gray-50 text-gray-900 placeholder-gray-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold"
                />
            </div>
            <p className="text-[10px] text-gray-400 font-medium ml-1 italic">* AI asistanı maliyet analizleri için bu veriyi kullanacaktır.</p>
          </div>


          {/* Açıklama */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Açıklama{' '}
              <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Bu proje hakkında kısa bir açıklama..."
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-300 outline-none focus:border-indigo-400 focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Dosya Eki (Brief) */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Paperclip size={16} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">Proje Dosyası / Brief</span>
                </div>
                {!attachment ? (
                    <UploadButton
                        endpoint="projectAttachment"
                        onClientUploadComplete={(res) => {
                            if (res) {
                                setAttachment({
                                    url: res[0].url,
                                    name: res[0].name,
                                    size: res[0].size,
                                    type: res[0].type
                                });
                                toast.success('Dosya hazır!');
                            }
                        }}
                        appearance={{
                            button: "text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all h-auto",
                            allowedContent: "hidden"
                        }}
                        content={{
                            button: ({ ready }) => ready ? "DOSYA SEÇ" : "..."
                        }}
                    />
                ) : (
                    <div className="flex items-center gap-2 text-emerald-600">
                        <FileCheck size={16} />
                        <span className="text-[10px] font-black uppercase">Yüklendi</span>
                        <button 
                            type="button"
                            onClick={() => setAttachment(null)}
                            className="text-[9px] text-red-500 font-bold hover:underline ml-1"
                        >
                            SİL
                        </button>
                    </div>
                )}
             </div>
             {attachment && (
                 <p className="mt-2 text-[10px] text-gray-400 font-medium truncate">{attachment.name}</p>
             )}
          </div>


          {/* Renk Seçici */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Proje Rengi
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onClick={() => setSelectedColor(c.hex)}
                  className="w-8 h-8 rounded-full transition-all focus:outline-none"
                  style={{
                    backgroundColor: c.hex,
                    boxShadow:
                      selectedColor === c.hex
                        ? `0 0 0 3px white, 0 0 0 5px ${c.hex}`
                        : 'none',
                    transform: selectedColor === c.hex ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-xl transition-colors shadow-sm"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Oluşturuluyor...' : 'Proje Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
