import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Sparkles,
  Factory,
  Bot,
  LayoutGrid,
  Activity
} from 'lucide-react';

/* ── Feature Cards Verisi ────────────────────────────────────── */
const features = [
  {
    icon: Factory,
    title: 'Dijital İkiz (Hücreler)',
    description: 'Fabrikanızın departmanlarını ve iş hücrelerini dijitalleştirin. İş zekası ve şeffaflık bir arada.',
    bg: 'bg-indigo-950/40',
    iconColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/20'
  },
  {
    icon: Bot,
    title: 'AI Danışman (Zekal)',
    description: 'Yapay zeka asistanınız verimliliğinizi anlık izler, görev önceliklendirmesinde stratejik destek sunar.',
    bg: 'bg-purple-950/40',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/20'
  },
  {
    icon: LayoutGrid,
    title: 'Blok & Görev Yönetimi',
    description: 'Fiziksel çalışma bloklarını ve alt görevleri Kanban hassasiyetiyle anında görselleştirin.',
    bg: 'bg-emerald-950/40',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20'
  },
  {
    icon: Activity,
    title: 'Gerçek Zamanlı Analitik',
    description: 'Bütçe yakım oranları ve üretim performansını dinamik paneller ve kurumsal PDF/Excel raporlarıyla analiz edin.',
    bg: 'bg-slate-800/40',
    iconColor: 'text-slate-300',
    borderColor: 'border-slate-500/20'
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] font-[family-name:var(--font-geist-sans)] selection:bg-indigo-500/30">

      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Image src="/logo.png" alt="LeadNova Logo" width={40} height={40} className="rounded-xl shadow-lg shadow-indigo-500/20" />
            <span className="font-black text-white text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-500">LeadNova</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(79,70,229,0.2)] active:scale-95"
          >
            Sisteme Giriş
            <ArrowRight className="w-4 h-4 text-indigo-400" />
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        {/* Dark Premium Background Glows */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            <span className="text-indigo-300 text-xs font-bold tracking-widest uppercase">
              Endüstriyel SaaS Platformu
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black text-white leading-[1.1] tracking-tighter mb-8">
            Operasyonel Görünürlükte<br />
            <span className="bg-gradient-to-br from-indigo-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Dijital İkiz Devrimi.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto mb-12 font-medium">
            Fabrikanızın departmanlarını, hücrelerini ve bütçesini tek bir noktadan yönetin. 
            Yapay zeka asistanı ve kurumsal düzeyde analitik ile karanlıkta kalan hiçbir süreç olmasın.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="group flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all duration-300 hover:shadow-[0_0_40px_rgba(79,70,229,0.3)] active:scale-[0.98] w-full sm:w-auto justify-center border border-indigo-500/30"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
              Operasyonu Başlat
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </div>

        {/* Abstract UI Mockup / Art */}
        <div className="max-w-6xl mx-auto mt-24 relative perspective-[2000px]">
           <div className="w-full h-48 sm:h-96 bg-gradient-to-b from-gray-900/80 to-black rounded-t-[3rem] border-t border-x border-white/5 shadow-[0_-20px_80px_rgba(79,70,229,0.15)] flex flex-col items-center justify-end overflow-hidden rotate-x-12 scale-105 transition-transform duration-1000 hover:rotate-x-0">
               <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)]" />
               <div className="w-full max-w-4xl h-3/4 bg-[#0a0a0a] rounded-t-3xl border-t border-x border-indigo-500/20 shadow-[0_-10px_40px_rgba(79,70,229,0.2)] p-6 flex flex-col gap-4 relative z-10">
                   <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-500/80" />
                       <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                       <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                   </div>
                   <div className="flex gap-4 opacity-50">
                       <div className="w-1/4 h-24 rounded-lg bg-white/5 border border-white/5" />
                       <div className="flex-1 space-y-4">
                           <div className="w-full h-8 rounded-lg bg-white/5 border border-white/5" />
                           <div className="w-3/4 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20" />
                       </div>
                   </div>
               </div>
           </div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-white/5 relative bg-[#030712]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Endüstriyel Derinlik.
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              LeadNova, bir görev yöneticisinden çok daha fazlasıdır. Organizasyonunuzun sinir ağını yönetir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat) => (
              <div
                key={feat.title}
                className={`group bg-[#0a0a0a] rounded-[2rem] border ${feat.borderColor} p-8 hover:bg-[#111] hover:-translate-y-2 transition-all duration-500 hover:shadow-[0_0_30px_rgba(79,70,229,0.1)]`}
              >
                <div className={`${feat.bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                  <feat.icon className={`${feat.iconColor} w-8 h-8`} />
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-4">{feat.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#030712]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <Image src="/logo.png" alt="LeadNova Logo" width={24} height={24} className="opacity-70 grayscale" />
            <span className="font-bold text-gray-500 text-sm tracking-widest uppercase">LeadNova System</span>
          </div>
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} LeadNova Inc. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
