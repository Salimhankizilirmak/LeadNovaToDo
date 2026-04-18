'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Globe } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useUserStore } from '@/store/useUserStore';

/* ── Zod Şeması ─────────────────────────────────────────────── */
const authSchema = z.object({
  email: z
    .string()
    .min(1, 'E-posta zorunludur')
    .email('Geçerli bir e-posta adresi girin'),
  password: z
    .string()
    .min(6, 'Şifre en az 6 karakter olmalıdır'),
});

type AuthFormValues = z.infer<typeof authSchema>;

/* ── Türkçe Hata Mesajları ──────────────────────────────────── */
function mapSupabaseError(message: string): string {
  if (message.includes('Invalid login credentials'))
    return 'E-posta veya şifre hatalı. Lütfen tekrar deneyin.';
  if (message.includes('User already registered'))
    return 'Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.';
  if (message.includes('Email not confirmed'))
    return 'E-postanızı doğrulamadınız. Gelen kutunuzu kontrol edin.';
  if (message.includes('Password should be'))
    return 'Şifre en az 6 karakter olmalıdır.';
  if (message.includes('rate limit'))
    return 'Çok fazla deneme yapıldı. Lütfen biraz bekleyin.';
  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

/* ── Bileşen ────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
  });

  const isLogin = mode === 'login';

  function toggleMode() {
    setMode(isLogin ? 'register' : 'login');
    reset();
  }

  async function onSubmit(values: AuthFormValues) {
    setLoading(true);
    try {
      const supabase = createClient();

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) {
          toast.error(mapSupabaseError(error.message));
          return;
        }

        setUser(data.user);
        toast.success('Giriş başarılı ✓');
        router.push('/');
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });

        if (error) {
          toast.error(mapSupabaseError(error.message));
          return;
        }

        // Supabase e-posta doğrulaması aktifse user oturumu hemen açılmaz
        if (data.session) {
          setUser(data.user);
          toast.success('Hesap oluşturuldu, giriş yapıldı ✓');
          router.push('/');
          router.refresh();
        } else {
          toast.success(
            'Hesap oluşturuldu! Gelen kutunuzu doğrulama için kontrol edin.',
            { duration: 6000 }
          );
        }
      }
    } catch {
      toast.error('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '40px 36px',
          boxShadow:
            '0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 40px -4px rgba(99,102,241,0.12)',
          border: '1px solid #E5E7EB',
        }}
      >
        {/* Başlık */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
              marginBottom: '16px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 10V3L4 14h7v7l9-11h-7z"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#6366F1',
              margin: '0 0 4px',
              letterSpacing: '-0.5px',
            }}
          >
            LeadNova
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* E-posta */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              E-posta
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '13px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="ornek@email.com"
                {...register('email')}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px 11px 38px',
                  fontSize: '14px',
                  borderRadius: '10px',
                  border: errors.email
                    ? '1.5px solid #EF4444'
                    : '1.5px solid #D1D5DB',
                  outline: 'none',
                  backgroundColor: '#F9FAFB',
                  color: '#111827',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => {
                  if (!errors.email)
                    e.currentTarget.style.borderColor = '#6366F1';
                }}
                onBlur={(e) => {
                  if (!errors.email)
                    e.currentTarget.style.borderColor = '#D1D5DB';
                }}
              />
            </div>
            {errors.email && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#EF4444',
                  margin: '5px 0 0',
                }}
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Şifre */}
          <div style={{ marginBottom: '8px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Şifre
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '13px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                {...register('password')}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px 11px 38px',
                  fontSize: '14px',
                  borderRadius: '10px',
                  border: errors.password
                    ? '1.5px solid #EF4444'
                    : '1.5px solid #D1D5DB',
                  outline: 'none',
                  backgroundColor: '#F9FAFB',
                  color: '#111827',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => {
                  if (!errors.password)
                    e.currentTarget.style.borderColor = '#6366F1';
                }}
                onBlur={(e) => {
                  if (!errors.password)
                    e.currentTarget.style.borderColor = '#D1D5DB';
                }}
              />
            </div>
            {errors.password && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#EF4444',
                  margin: '5px 0 0',
                }}
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Şifremi Unuttum */}
          {isLogin && (
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() =>
                  toast.info('Yakında eklenecek', { description: 'Şifre sıfırlama özelliği hazırlanıyor.' })
                }
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  color: '#6366F1',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 500,
                }}
              >
                Şifremi unuttum
              </button>
            </div>
          )}

          {!isLogin && <div style={{ marginBottom: '20px' }} />}

          {/* Ana Buton */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '15px',
              fontWeight: 700,
              borderRadius: '12px',
              border: 'none',
              background: loading
                ? '#A5B4FC'
                : 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: loading
                ? 'none'
                : '0 4px 14px rgba(99,102,241,0.35)',
              transition: 'all 0.2s',
              letterSpacing: '0.1px',
            }}
          >
            {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
            {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
          </button>

          {/* Ayırıcı */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
            <span style={{ fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
              veya
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
          </div>

          {/* Google Butonu */}
          <button
            type="button"
            onClick={() =>
              toast.info('Yakında eklenecek', {
                description: 'Google ile giriş özelliği hazırlanıyor.',
              })
            }
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '12px',
              border: '1.5px solid #E5E7EB',
              backgroundColor: '#fff',
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background-color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.borderColor = '#D1D5DB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          >
            <Globe size={18} color="#EA4335" />
            Google ile Giriş Yap
          </button>
        </form>

        {/* Mod Geçişi */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '13px',
            color: '#6B7280',
            marginTop: '24px',
            marginBottom: 0,
          }}
        >
          {isLogin ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '13px',
              color: '#6366F1',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </p>
      </div>

      {/* Spinner animasyonu */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
