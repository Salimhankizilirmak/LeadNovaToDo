'use client';

import { useEffect, useState } from 'react';
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  User, 
  Mail, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { createClerkClient } from '@/utils/supabase/client';
import { useUser, useAuth } from '@clerk/nextjs';
import AddMemberModal from '@/components/team/AddMemberModal';

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
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id ?? null;
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'member'>('member');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchOrgData = async () => {
      setLoading(true);
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) throw new Error('Oturum anahtarı alınamadı.');

        const supabase = createClerkClient(token);
        
        // 1. Organizasyonu ve kendi rolünü bul
        const { data: currentMember, error: orgError } = await supabase
          .from('org_members')
          .select('org_id, role')
          .eq('user_id', userId)
          .single();

        if (orgError || !currentMember) {
          toast.error('Organizasyon verisi bulunamadı.');
          return;
        }

        setOrgId(currentMember.org_id);
        setCurrentUserRole(currentMember.role);

        // 2. Tüm üyeleri ve user detaylarını çek (Join)
        const { data: memberList, error: listError } = await supabase
          .from('org_members')
          .select(`
            user_id,
            role,
            user:user_id (
              id,
              email,
              display_name
            )
          `)
          .eq('org_id', currentMember.org_id);

        if (listError) throw listError;
        const formattedMembers = (memberList?.map(m => ({
          ...m,
          user: Array.isArray(m.user) ? m.user[0] : m.user
        })) as TeamMember[]) || [];

        setMembers(formattedMembers);
      } catch {
        toast.error('Ekip listesi yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, [userId]);

  const handleRemoveMember = async (targetUserId: string) => {
    if (!orgId) return;
    if (targetUserId === userId) {
      toast.error('Kendinizi ekipten çıkaramazsınız.');
      return;
    }

    const previousMembers = [...members];
    
    // Optimistic Update
    setMembers(members.filter(m => m.user_id !== targetUserId));
    
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('Oturum anahtarı bulunamadı.');

      const supabase = createClerkClient(token);
      const { error } = await supabase
        .from('org_members')
        .delete()
        .eq('org_id', orgId)
        .eq('user_id', targetUserId);

      if (error) throw error;
      toast.success('Üye başarıyla çıkarıldı.');
    } catch {
      setMembers(previousMembers);
      toast.error('Üye çıkarılırken bir hata oluştu.');
    }
  };

  if (loading) return <TeamSkeleton />;

  const isAdmin = currentUserRole === 'admin';

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
            
            return (
              <li 
                key={member.user_id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 hover:bg-gray-50/30 transition-colors gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <MemberAvatar 
                    name={member.user.display_name} 
                    email={member.user.email} 
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                       <p className="text-sm font-bold text-gray-900 truncate">
                         {member.user.display_name || member.user.email.split('@')[0]}
                       </p>
                       {isMe && (
                         <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                           Sen
                         </span>
                       )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium truncate">
                       <Mail size={12} />
                       {member.user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-4">
                  {/* Role Badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    member.role === 'admin' 
                      ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                      : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {member.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                    {member.role}
                  </div>

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

      {/* Add Member Modal */}
      {orgId && (
        <AddMemberModal
          orgId={orgId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdded={(newMember) => setMembers([newMember, ...members])}
        />
      )}
    </div>
  );
}
