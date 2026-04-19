import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    const userEmail = (sessionClaims?.email as string) || "";

    // 1. Süper Admin yetki kontrolü
    const superAdmins = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(',') || [];
    const isSuperAdmin = superAdmins.includes(userEmail);

    if (!userId || !isSuperAdmin) {
      return NextResponse.json({ error: 'Yetkisiz işlem. Sadece Süper Adminler şirket oluşturabilir.' }, { status: 403 });
    }

    // 2. Body verilerini al
    const { organizationName, bossEmail } = await req.json();

    if (!organizationName || !bossEmail) {
      return NextResponse.json({ error: 'Şirket adı ve patron e-postası gereklidir.' }, { status: 400 });
    }

    const client = await clerkClient();

    // 3. Şirketi (Organization) oluştur
    const organization = await client.organizations.createOrganization({
      name: organizationName,
      slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
    });

    // 4. Patrona Davetiye (Invitation) gönder
    // Rolü 'admin' (veya kurumunuzdaki karşılığı) olarak belirliyoruz
    await client.organizations.createOrganizationInvitation({
      organizationId: organization.id,
      emailAddress: bossEmail,
      role: 'admin',
      inviterUserId: userId,
    });

    return NextResponse.json({ 
      success: true, 
      orgId: organization.id,
      message: `${organizationName} başarıyla oluşturuldu ve ${bossEmail} adresine davetiye gönderildi.` 
    });

  } catch (error: any) {
    console.error('Create Org Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Şirket oluşturulurken teknik bir hata oluştu.' 
    }, { status: 500 });
  }
}
