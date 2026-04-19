'use client';

import { useEffect, useState } from 'react';
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  User, 
  Mail, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser, useOrganization } from '@clerk/nextjs';
import { useSupabase } from '@/hooks/use-supabase';
import InviteMemberModal from '@/components/team/InviteMemberModal';
import { updateUserRoleAction } from '@/app/actions/users';
import { UserRole } from '@/types/task';

/* ── Tipler ─────────────────────────────────────────────────── */
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

/* ── Yardımcı Bileşenler ────────────────────────────────────── */
function MemberAvatar({ name, email }: { name?: string | null; email: string }) {
  const initials = (name || email)
    .split('@')[0]
    .substring(0, 2)
    .toUpperCase();
  
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs ring-2 ring-white shadow-sm">
      {initials}
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────── */
function TeamSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-100 rounded-xl w-40" />
        <div className="h-10 bg-gray-200 rounded-xl w-32" />
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <div className="w-10 h-10 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded-lg w-1/4" />
              <div className="h-3 bg-gray-50 rounded-lg w-1/3" />
            </div>
            <div className="h-8 bg-gray-100 rounded-lg w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Ana Sayfa ───────────────────────────────────────────── */
export default function TeamPage() {
  const { user } = useUser();
  const { organization, membership } = useOrganization();
  const { getSupabase } = useSupabase();
  const userId = user?.id ?? null;
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mevcut kullanıcının endüstriyel rolü
  const myIndustrialRole = user?.publicMetadata?.role as UserRole;
  const canEditRoles = myIndustrialRole === 'Patron' || myIndustrialRole === 'Genel Müdür' || myIndustrialRole === 'Admin';

  const fetchMembers = async () => {
    if (!organization) return;
    try {
      const supabase = await getSupabase();
      
      // Tüm üyeleri profiles tablosundan çek (org_id üzerinden filtrele)
      const { data: memberList, error: listError } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', organization.id);

      if (listError) throw listError;
      
      const formattedMembers = (memberList?.map(m => ({
        user_id: m.id,
        role: m.role || 'Personel',
        email: m.email || '',
        display_name: m.full_name || 'İsimsiz Üye'
      })) as TeamMember[]) || [];

      setMembers(formattedMembers);
    } catch (err) {
      console.error(err);
      toast.error('Ekip listesi yüklenirken bir hata oluştu.');
    }
  };

  useEffect(() => {
    if (!userId || !organization) return;

    const init = async () => {
      setLoading(true);
      await fetchMembers();
      setLoading(false);
    };

    init();
  }, [userId, organization, getSupabase]);

  const handleUpdateRole = async (targetUserId: string, newRole: UserRole) => {
    setUpdatingRoleId(targetUserId);
    try {
      const result = await updateUserRoleAction(targetUserId, newRole);
      if (result.success) {
        toast.success('Rol başarıyla güncellendi.');
        await fetchMembers();
      } else {
        toast.error(result.error || 'Rol güncellenirken hata oluştu.');
      }
    } catch (err) {
      toast.error('Beklenmedik bir hata oluştu.');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    toast.info('Üye çıkarma işlemi Clerk arayüzü üzerinden yapılmalıdır.', {
      description: 'Lütfen Clerk Organizasyon paneline gidin.'
    });
  };

  if (loading) return <TeamSkeleton />;

  const isAdmin = membership?.role === 'org:admin' || canEditRoles;

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Members Box */}
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
            
            // Hiyerarşik Düzenleme İzni
            const canIEditThisMember = 
              (myIndustrialRole === 'Patron' && (member.role !== 'Patron' || isMe)) ||
              (myIndustrialRole === 'Genel Müdür' && member.role !== 'Patron' && member.role !== 'Genel Müdür') ||
              (myIndustrialRole === 'Admin');

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
                  {/* Role Selector or Badge */}
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

                  {/* Delete Button (Only for Admins, and not for themselves) */}
                  {isAdmin && !isMe ? (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Ekibden Çıkar"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <div className="w-9" /> // Placeholder to keep alignment
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {members.length === 0 && !loading && (
          <div className="py-20 text-center flex flex-col items-center gap-3">
             <AlertCircle size={40} className="text-gray-200" />
             <p className="text-sm font-bold text-gray-400">Henüz ekip üyesi yok.</p>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
