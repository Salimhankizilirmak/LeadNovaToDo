import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * /admin rotası için merkezi güvenlik kapısı.
 * Bu layout sunucu tarafında (Node.js runtime) çalıştığı için 
 * Edge kısıtlamalarına takılmadan güvenli yetki kontrolü yapar.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  
  // Birincil e-posta adresini al
  const userEmail = user?.emailAddresses?.find(
    (email) => email.id === user.primaryEmailAddressId
  )?.emailAddress || user?.emailAddresses[0]?.emailAddress || "";

  // Süper Admin Listesini Al
  const superAdmins = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(',') || [];
  const isSuperAdmin = superAdmins.includes(userEmail);

  // E-posta listede yoksa veya kullanıcı yoksa ana sayfaya postala
  if (!isSuperAdmin) {
    redirect('/');
  }

  return <>{children}</>;
}
