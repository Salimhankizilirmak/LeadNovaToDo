import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { organizations } from '@/db/schema';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    // Kullanıcının e-postasını güvenli bir şekilde al
    const userEmail = user?.emailAddresses?.find(
      (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress || user?.emailAddresses[0]?.emailAddress || "";

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
      createdBy: userId as string,
    });

    // 4. Turso Veritabanına Kaydet
    await db.insert(organizations).values({
      id: organization.id,
      name: organizationName,
      ownerId: userId as string,
      ownerEmail: bossEmail,
    });

    // 5. Patrona Davetiye (Invitation) gönder
    await client.organizations.createOrganizationInvitation({
      organizationId: organization.id,
      emailAddress: bossEmail,
      role: 'org:admin',
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
