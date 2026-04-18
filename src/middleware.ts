import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Supabase session'ını cookie'lerden okuyarak günceller ve
 * yetkisiz kullanıcıları /login'e yönlendirir.
 *
 * Sonsuz yönlendirme (infinite redirect) riskini önlemek için:
 * - /login sayfası hiçbir zaman korumalı rota olarak değerlendirilmez.
 * - Matcher, _next/, api/, public statik dosyaları otomatik hariç tutar.
 */
export async function middleware(request: NextRequest) {
  // Çevre değişkenleri eksikse /login'e yönlendir (geliştirme ortamı güvenliği)
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    const { pathname } = request.nextUrl;
    if (pathname !== '/login') {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL!,
    SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Session yenileme — bu satır kritik, değiştirilmemeli
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Yetkisiz kullanıcıyı /login'e yönlendir
  if (!user && pathname !== '/login') {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Yetkili kullanıcı /login'e gelirse ana sayfaya yönlendir
  if (user && pathname === '/login') {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Aşağıdaki ön-eklerle başlayan yollar HARİÇ tüm istekleri eşleştir:
     * - _next/static  (statik dosyalar)
     * - _next/image   (görsel optimizasyon)
     * - favicon.ico, robots.txt, sitemap.xml vb.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
