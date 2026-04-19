'use client';

import { useState } from 'react';
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  User, 
  Mail, 
  CheckCircle2,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import InviteMemberModal from '@/components/team/InviteMemberModal';
import { updateUserRoleAction } from '@/app/actions/users';
import { UserRole } from '@/types/task';

interface TeamMember {
  user_id: string;
  role: UserRole;
  email?: string;
  display_name?: string;
}

const roles: UserRole[] = [
  'Patron',
  'Genel Müdür',
  'Üretim Müdürü',
  'Satış Pazarlama',
  'Muhasebe',
  'Vardiya Amiri',
  'Personel'
];

function MemberAvatar({ name, email }: { name?: string | null; email: string }) {
  const initials = (name || email || '??')
    .split('@')[0]
    .substring(0, 2)
    .toUpperCase();
  
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs ring-2 ring-white shadow-sm shrink-0">
      {initials}
    </div>
  );
}

export default function TeamView({ 
  initialMembers, 
  myRole, 
  isAdmin 
}: { 
  initialMembers: TeamMember[], 
  myRole: UserRole, 
  isAdmin: boolean 
}) {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpdateRole = async (targetUserId: string, newRole: UserRole) => {
    setUpdatingRoleId(targetUserId);
    try {
      const result = await updateUserRoleAction(targetUserId, newRole);
      if (result.success) {
        toast.success('Rol başarıyla güncellendi.');
        setMembers(prev => prev.map(m => m.user_id === targetUserId ? { ...m, role: newRole } : m));
      } else {
        toast.error(result.error || 'Rol güncellenirken hata oluştu.');
      }
    } catch (err) {
      toast.error('Beklenmedik bir hata oluştu.');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Ekibim</h1>
          <p className="text-sm text-gray-500 mt-1">
             Projelere atama yapabileceğiniz çalışma arkadaşlarınız.
          </p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            <span>Üye Ekle</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
             Üye Listesi ({members.length})
           </span>
           <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
             <CheckCircle2 size={12} />
             Organizasyon Aktif
           </div>
        </div>

        <ul className="divide-y divide-gray-50">
          {members.map((member) => {
            const isMe = member.user_id === userId;
            const canIEditThisMember = 
              (myRole === 'Patron' && (member.role !== 'Patron' || isMe)) ||
              (myRole === 'Genel Müdür' && member.role !== 'Patron' && member.role !== 'Genel Müdür') ||
              (myRole === 'Admin');

            return (
              <li 
                key={member.user_id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 hover:bg-gray-50/30 transition-colors gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <MemberAvatar 
                    name={member.display_name} 
                    email={member.email || member.user_id} 
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                       <p className="text-sm font-bold text-gray-900 truncate">
                         {member.display_name || member.email?.split('@')[0] || member.user_id.substring(0, 8)}
                       </p>
                       {isMe && (
                         <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                           Sen
                         </span>
                       )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium truncate">
                       <Mail size={12} />
                       {member.email || member.user_id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-4">
                  {canIEditThisMember && !isMe ? (
                    <div className="relative">
                      <select
                        disabled={updatingRoleId === member.user_id}
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.user_id, e.target.value as UserRole)}
                        className={`flex items-center gap-1.5 pl-3 pr-8 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border outline-none cursor-pointer transition-all appearance-none ${
                          updatingRoleId === member.user_id ? 'opacity-50' : ''
                        } ${
                          member.role === 'Patron' || member.role === 'Admin' || member.role === 'Genel Müdür'
                            ? 'bg-amber-50 text-amber-600 border-amber-100' 
                            : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}
                      >
                        {roles.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-50">
                        {updatingRoleId === member.user_id ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} className="rotate-90" />}
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                      member.role === 'Patron' || member.role === 'Admin' || member.role === 'Genel Müdür'
                        ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {member.role === 'Patron' || member.role === 'Admin' ? <Shield size={12} /> : <User size={12} />}
                      {member.role}
                    </div>
                  )}

                  {isAdmin && !isMe ? (
                    <button
                      onClick={() => toast.info('Üye çıkarma işlemi Clerk paneli üzerinden yapılmalıdır.')}
                      className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <div className="w-9" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <InviteMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
