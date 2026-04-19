'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Loader2, UserPlus, Mail } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

/* ── Zod Şeması ─────────────────────────────────────────────── */
const schema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz').toLowerCase(),
});

type FormValues = z.infer<typeof schema>;

/* ── Tipler ─────────────────────────────────────────────────── */
interface TeamMember {
  user_id: string;
  role: 'admin' | 'member';
  user: {
    id: string;
    email: string;
    display_name: string | null;
  };
}

/* ── Props ──────────────────────────────────────────────────── */
interface AddMemberModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded: (newMember: TeamMember) => void;
}

export default function AddMemberModal({
  orgId,
  isOpen,
  onClose,
  onAdded,
}: AddMemberModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    const supabase = createClient();

    try {
      // 1. Kullanıcıyı profiles tablosunda ara
      const { data: targetUser, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', values.email)
        .single();

      if (fetchError || !targetUser) {
        toast.error('Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı. Lütfen önce LeadNova\'ya kayıt olmasını isteyin.');
        return;
      }

      // 2. Halihazırda üye mi kontrol et
      const { data: existingMember } = await supabase
        .from('org_members')
        .select('user_id')
        .eq('org_id', orgId)
        .eq('user_id', targetUser.id)
        .maybeSingle();

      if (existingMember) {
        toast.error('Bu kullanıcı zaten ekibinizde bulunuyor.');
        return;
      }

      // 3. Ekibe ekle
      const { error: insertError } = await supabase
        .from('org_members')
        .insert({
          org_id: orgId,
          user_id: targetUser.id,
          role: 'member'
        });

      if (insertError) throw insertError;

      toast.success('Kullanıcı ekibe katıldı ✓');
      const newMember: TeamMember = {
        user_id: targetUser.id,
        role: 'member',
        user: {
          id: targetUser.id,
          email: targetUser.email,
          display_name: targetUser.full_name
        }
      };
      onAdded(newMember);
      reset();
      onClose();
    } catch {
      toast.error('Kullanıcı eklenirken teknik bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-all"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
               <UserPlus size={18} />
            </div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Üye Ekle</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
              E-posta Adresi
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                {...register('email')}
                autoFocus
                placeholder="arkadas@leadnova.com"
                className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border bg-gray-50 text-gray-900 placeholder:text-gray-300 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-indigo-500/5 ${
                  errors.email
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-gray-100 focus:border-indigo-400'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1 ml-1 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-2 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-2xl transition-colors shadow-lg shadow-indigo-500/20"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                'Ekibe Ekle'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
