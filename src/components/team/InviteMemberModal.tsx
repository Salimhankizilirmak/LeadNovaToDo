'use client';

import { useState } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { toast } from 'sonner';
import { X, Loader2, UserPlus, Mail, Shield, User } from 'lucide-react';
import { UserRole } from '@/types/task';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import { inviteMemberWithRoleAction } from '@/app/actions/users';

export default function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
  const { organization, isLoaded } = useOrganization();
  const [emailAddress, setEmailAddress] = useState('');
  const [role, setRole] = useState<UserRole>('Personel');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !isLoaded) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    setSubmitting(true);
    try {
      const result = await inviteMemberWithRoleAction(emailAddress, role);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast.success(`${emailAddress} adresine ${role} rolüyle davet gönderildi!`);
      setEmailAddress('');
      onClose();
    } catch (err: any) {
      console.error('Davet Hatası:', err);
      toast.error(err.message || 'Davet gönderilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const roles: UserRole[] = [
    'Patron',
    'Genel Müdür',
    'Üretim Müdürü',
    'Satış Pazarlama',
    'Muhasebe',
    'Vardiya Amiri',
    'Personel'
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
               <UserPlus size={18} />
            </div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Yeni Üye Davet Et</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleInvite} className="p-6 space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">E-posta Adresi</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                required
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="is@sirket.com"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-indigo-400 transition-all font-medium"
              />
            </div>
          </div>

          {/* Role Choice */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Fabrika Rolü</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-100 bg-gray-50 outline-none focus:bg-white focus:border-indigo-400 transition-all font-bold appearance-none cursor-pointer"
              >
                {roles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors">
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-2 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-2xl transition-colors shadow-lg shadow-indigo-500/20"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Davet Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
