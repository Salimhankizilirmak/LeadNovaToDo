import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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
  // Anasayfaya yönlendirme kontrolü
  const { userId } = await auth();
  if (userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 1. Admin Rotası Kontrolü (Sadece giriş yapmış olmayı zorunlu tutar)
  if (isAdminRoute(req)) {

    await auth.protect();
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

