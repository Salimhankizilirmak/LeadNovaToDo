import Link from 'next/link';
import {
  Zap,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

/* ── Feature Cards Verisi ────────────────────────────────────── */
const features = [
  {
    icon: Zap,
    title: 'Yapay Zeka Destekli',
    description:
      'Akıllı öneri motoru görevlerinizi analiz eder, öncelikleri otomatik belirler ve ekibinizin verimliliğini artırır.',
    gradient: 'from-violet-500 to-indigo-600',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    icon: Users,
    title: 'Ekip Odaklı',
    description:
      'Rol tabanlı yetki sistemi, gerçek zamanlı işbirliği ve şeffaf görev takibi ile ekipler uyum içinde çalışır.',
    gradient: 'from-sky-500 to-cyan-600',
    bg: 'bg-sky-50',
    iconColor: 'text-sky-600',
  },
  {
    icon: BarChart3,
    title: 'Güçlü Analizler',
    description:
      'Proje ilerlemesini anlık raporlar ve görsel paneller üzerinden takip edin. Gecikmeleri proaktif olarak önleyin.',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
];

const highlights = [
  'Sınırsız proje ve görev yönetimi',
  'Kurumsal düzeyde güvenlik (SOC 2)',
  'Gelişmiş yapay zeka asistanı',
  'Gerçek zamanlı bildirimler',
];

/* ── Sayfa ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FF] font-[family-name:var(--font-geist-sans)]">

      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">LeadNova</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-200 active:scale-95"
          >
            Giriş Yap
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-indigo-100/80 via-violet-50/60 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
          <div className="absolute top-40 left-0 w-64 h-64 bg-sky-200/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-indigo-700 text-xs font-semibold tracking-wide uppercase">
              Yapay Zeka Destekli B2B Platform
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.08] tracking-tight mb-6">
            Projeyi Yönet,{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              Kafayı Yeme.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10">
            Ekipleriniz için geliştirilmiş yeni nesil,{' '}
            <span className="text-gray-700 font-medium">yapay zeka destekli</span>{' '}
            görev yönetim platformu. Daha az toplantı, daha fazla iş.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              id="hero-cta-button"
              className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all duration-200 hover:shadow-2xl hover:shadow-indigo-300/50 active:scale-[0.98] w-full sm:w-auto justify-center"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
              Hemen Başla
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold px-6 py-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-white transition-all duration-200 text-sm w-full sm:w-auto justify-center"
            >
              Özellikleri Gör
            </a>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10">
            {highlights.map((h) => (
              <div key={h} className="flex items-center gap-1.5 text-gray-400 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xl shadow-indigo-100/50 overflow-hidden">
            {/* Mockup Titlebar */}
            <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <div className="ml-4 flex-1 bg-white rounded-lg h-6 border border-gray-100 px-3 flex items-center max-w-xs">
                <span className="text-gray-400 text-[10px]">app.leadnova.io/dashboard</span>
              </div>
            </div>
            {/* Mockup Content */}
            <div className="p-8">
              <div className="flex gap-6">
                {/* Sidebar mock */}
                <div className="hidden sm:flex flex-col gap-2 w-40 shrink-0">
                  {['Genel Bakış', 'Projeler', 'Ekip', 'Raporlar'].map((item, i) => (
                    <div
                      key={item}
                      className={`h-8 rounded-lg px-3 flex items-center text-xs font-medium ${
                        i === 0
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                {/* Content mock */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Aktif Proje', val: '12', color: 'text-indigo-600' },
                      { label: 'Tamamlanan', val: '48', color: 'text-emerald-600' },
                      { label: 'Geciken', val: '3', color: 'text-red-500' },
                    ].map((c) => (
                      <div key={c.label} className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] text-gray-400 font-medium">{c.label}</p>
                        <p className={`text-2xl font-black ${c.color} mt-1`}>{c.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    {[85, 60, 40].map((w, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                        <div className="h-2.5 bg-gray-200 rounded-full flex-1">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                            style={{ width: `${w}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 w-8 text-right">{w}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-indigo-300/20 blur-2xl rounded-full -z-10" />
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 text-sm font-bold uppercase tracking-widest mb-3">
              Özellikler
            </p>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">
              Ekibinizin ihtiyacı olan her şey
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Tek bir platformda görev yönetimi, ekip koordinasyonu ve yapay zeka destekli içgörüler.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="group bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-gray-100/80 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`${feat.bg} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                  <feat.icon className={`${feat.iconColor} w-7 h-7`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feat.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-12 text-center overflow-hidden">
            {/* Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white/90 text-xs font-semibold tracking-wide">
                  Ücretsiz başlayın
                </span>
              </div>
              <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
                Ekibinizi bugün LeadNova&apos;ya taşıyın
              </h2>
              <p className="text-white/70 mb-8 text-base max-w-lg mx-auto">
                Kurulum gerektirmez. Dakikalar içinde çalışmaya başlayın ve ekibinizin verimliliğini ikiye katlayın.
              </p>
              <Link
                href="/dashboard"
                id="cta-section-button"
                className="inline-flex items-center gap-3 bg-white hover:bg-gray-50 text-indigo-700 font-bold px-8 py-4 rounded-2xl text-base transition-all duration-200 hover:shadow-2xl active:scale-[0.98]"
              >
                <Sparkles className="w-5 h-5" />
                Hemen Başla — Ücretsiz
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-gray-700 text-sm">LeadNova</span>
          </div>
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} LeadNova. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
