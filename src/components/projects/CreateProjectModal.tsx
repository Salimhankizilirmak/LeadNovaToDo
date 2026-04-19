'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Loader2, FolderPlus } from 'lucide-react';
import { useUser, useOrganization } from '@clerk/nextjs';
import { useSupabase } from '@/hooks/use-supabase';

/* ── Tipler ─────────────────────────────────────────────────── */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
  org_id: string;
  created_by: string;
  created_at: string;
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
});
type FormValues = z.infer<typeof schema>;

/* ── Organizasyon Yardımcısı ────────────────────────────────── */
async function ensureOrgId(supabase: any, userId: string, clerkOrgId?: string | null): Promise<string> {
  // 1. Eğer Clerk üzerinde bir organizasyon seçiliyse, onu öncelikli kılalım
  if (clerkOrgId) {
    // Supabase'de bu organizasyon var mı kontrol et, yoksa kaydet
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', clerkOrgId)
      .single();

    if (!existingOrg) {
      await supabase.from('organizations').insert({
        id: clerkOrgId,
        name: 'Clerk Organizasyonu',
        owner_id: userId
      });
    }

    // Üyelik kaydı (org_members) kontrolü ve ekleme
    const { data: member } = await supabase
      .from('org_members')
      .select('id')
      .eq('org_id', clerkOrgId)
      .eq('user_id', userId)
      .single();

    if (!member) {
      await supabase.from('org_members').insert({
        org_id: clerkOrgId,
        user_id: userId,
        role: 'admin'
      });
    }

    return clerkOrgId;
  }

  // 2. Clerk organizasyonu yoksa (Kişisel Çalışma Alanı), mevcut bir tane ara
  const { data: personalMember } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (personalMember?.org_id) return personalMember.org_id;

  // 3. Hiç yoksa yeni bir tane oluştur (UUID de olabilir ama userId bazlı bir string de olabilir)
  // Dashboard'un orgId null iken kişisel olanları görmesi için burada org_id null bırakılabilir 
  // veya özel bir 'personal_' prefixli ID atanabilir. 
  // Şimdilik UUID ile devam edelim ama dashboard'u buna göre esneteceğiz.
  const { data: newOrg, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: 'Kişisel Çalışma Alanı', owner_id: userId })
    .select('id')
    .single();

  if (orgError || !newOrg) throw new Error('Organizasyon oluşturulamadı.');


  const { error: memberError } = await supabase
    .from('org_members')
    .insert({ org_id: newOrg.id, user_id: userId, role: 'admin' });

  if (memberError) throw new Error('Üyelik kaydı oluşturulamadı.');

  return newOrg.id;
}

/* ── Modal Bileşeni ─────────────────────────────────────────── */
interface CreateProjectModalProps {
  onClose: () => void;
  onCreated: (project: Project) => void;
}

export default function CreateProjectModal({
  onClose,
  onCreated,
}: CreateProjectModalProps) {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { getSupabase } = useSupabase();
  const userId = user?.id ?? null;
  const clerkOrgId = organization?.id ?? null;
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].hex);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (!userId) return;
    setSubmitting(true);

    try {
      const supabase = await getSupabase();
      
      console.log('--- Proje Oluşturma Başı ---');
      const orgId = await ensureOrgId(supabase, userId, clerkOrgId);
      console.log('Kullanılan OrgID:', orgId);

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: values.name,
          description: values.description ?? null,
          color: selectedColor,
          org_id: orgId,
          created_by: userId,
          status: 'active',
        })
        .select('id, name, description, color, status, org_id, created_by, created_at')
        .single();

      if (error) {
        console.error('Supabase Proje Insert Hatası:', error);
        throw error;
      }

      toast.success('Proje başarıyla oluşturuldu ✓');
      onCreated(data as Project);
      onClose();
    } catch (error: any) {
      console.error('Proje Oluşturma Teknik Detay:', error);
      const errorMessage = error.message || 'Bir sorun oluştu. Lütfen tekrar deneyin.';
      toast.error(`Hata: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* Backdrop */
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
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
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 focus:bg-white transition-colors resize-none"
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">
                {errors.description.message}
              </p>
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
