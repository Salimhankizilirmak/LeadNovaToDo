import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getOrgProfiles } from '@/app/actions/users';
import TeamView from '@/components/team/TeamView';
import { UserRole } from '@/types/task';

export default async function TeamPage() {
  const { userId, orgId, orgRole } = await auth();
  
  if (!userId) redirect('/sign-in');
  if (!orgId) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-xl font-bold text-gray-900">Organizasyon Seçilmedi</h1>
        <p className="text-gray-500 mt-2">Ekip listesini görmek için bir organizasyona dahil olmalısınız.</p>
      </div>
    );
  }

  const result = await getOrgProfiles(orgId);
  const profiles = result.success ? result.profiles : [];

  // Mevcut kullanıcının rolünü profiller içinden bulalım
  const myProfile = profiles?.find(p => p.id === userId);
  const myIndustrialRole = (myProfile?.role as UserRole) || 'Personel';

  // Yetki Kontrolü: Sadece Patron, GM, Admin ve PM görebilir.
  if (!['Patron', 'Genel Müdür', 'Admin', 'Proje Yöneticisi'].includes(myIndustrialRole)) {
    redirect('/dashboard');
  }

  const isAdmin = orgRole === 'org:admin' || ['Patron', 'Genel Müdür', 'Admin'].includes(myIndustrialRole);

  const formattedMembers = (profiles?.map(m => ({
    user_id: m.id,
    role: (m.role as UserRole) || 'Personel',
    email: m.email || '',
    display_name: m.fullName || 'İsimsiz Üye'
  }))) || [];

  return (
    <TeamView 
      initialMembers={formattedMembers} 
      myRole={myIndustrialRole} 
      isAdmin={isAdmin} 
    />
  );
}
