import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Korumalı rotalar — giriş yapılmamışsa Clerk otomatik olarak
 * /sign-in adresine yönlendirir.
 */
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api(.*)',
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const userEmail = (sessionClaims?.email as string) || "";
  
  // Süper Admin Listesini Al
  const superAdmins = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(',') || [];
  const isSuperAdmin = superAdmins.includes(userEmail);

  // 1. Admin Rotası Kontrolü
  if (isAdminRoute(req)) {
    if (!userId || !isSuperAdmin) {
      return Response.redirect(new URL('/', req.url));
    }
  }

  // 2. Genel Korumalı Rotalar
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    /*
     * Aşağıdaki ön-eklerle başlayan yollar HARİÇ tüm istekleri eşleştir:
     * - _next/static  (statik dosyalar)
     * - _next/image   (görsel optimizasyon)
     * - favicon.ico, robots.txt, sitemap.xml vb.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/(api|trpc)(.*)',
  ],
};

