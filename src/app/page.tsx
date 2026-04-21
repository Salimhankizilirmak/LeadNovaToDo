'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Factory,
  Bot,
  ShieldCheck,
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';

/* ── Feature Cards Verisi ────────────────────────────────────── */
const features = [
  {
    icon: Factory,
    title: 'Fiziksel Dijital İkiz',
    description: 'Departmanları (Hücreleri) ve istasyonları (Blokları) haritalandırın. Tüm operasyon avcunuzun içinde.',
    bg: 'bg-blue-950/40',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    hoverGlow: 'from-blue-500/5',
    hoverBlur: 'bg-blue-500/10',
    delay: 0.1
  },
  {
    icon: Bot,
    title: 'Yapay Zeka Danışman',
    description: 'Sağ alt köşedeki asistanınız size "Sayın Yöneticim" diye hitap etsin, verilerinizi analiz edip öngörüler sunsun.',
    bg: 'bg-purple-950/40',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/20',
    hoverGlow: 'from-purple-500/5',
    hoverBlur: 'bg-purple-500/10',
    delay: 0.2
  },
  {
    icon: ShieldCheck,
    title: 'Katı Yetki (RBAC)',
    description: 'Herkes sadece görmesi gerekeni görsün. Güvenli hiyerarşi ile organizasyonel bütünlüğü sağlayın.',
    bg: 'bg-emerald-950/40',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    hoverGlow: 'from-emerald-500/5',
    hoverBlur: 'bg-emerald-500/10',
    delay: 0.3
  },
  {
    icon: FileSpreadsheet,
    title: 'Kurumsal Çıktılar',
    description: 'Tek tıkla PDF raporları ve Excel tabloları indirin. Yönetim toplantılarına daima hazır gidin.',
    bg: 'bg-amber-950/40',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    hoverGlow: 'from-amber-500/5',
    hoverBlur: 'bg-amber-500/10',
    delay: 0.4
  }
];

// framer-motion variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.2 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] font-[family-name:var(--font-geist-sans)] selection:bg-indigo-500/30 overflow-hidden">
      
      {/* ── Background Glow ──────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/20 blur-[150px] opacity-50 mix-blend-screen animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/20 blur-[150px] opacity-50 mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
      </div>

      {/* ── Navbar ────────────────────────────────────────────── */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 inset-x-0 z-50 bg-[#030712]/50 backdrop-blur-xl border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
             <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-500 rounded-xl" />
                <Image src="/logo.png" alt="LeadNova Logo" width={40} height={40} className="relative rounded-xl shadow-lg shadow-indigo-500/20" />
             </div>
            <span className="font-black text-white text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-500 group-hover:from-white group-hover:to-gray-300 transition-all">LeadNova</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:border-white/20 active:scale-95"
          >
            Sisteme Giriş
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 px-6 z-10 min-h-screen flex flex-col justify-center">
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto text-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-5 py-2 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            <span className="text-indigo-300 text-xs font-bold tracking-widest uppercase">
              Endüstriyel Başarı İçin
            </span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-6xl sm:text-8xl md:text-9xl font-black text-white leading-[1.05] tracking-tighter mb-8">
            <span className="bg-gradient-to-br from-gray-100 via-gray-300 to-gray-500 bg-clip-text text-transparent">Projeyi Yönet,</span><br />
            <span className="bg-gradient-to-br from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              Kafayı Yeme.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto mb-12 font-medium">
            LeadNova; fabrikanızı, projelerinizi ve ekibinizi tek bir dijital ikiz üzerinden yönetmenizi sağlayan <span className="text-gray-200">yapay zeka destekli</span> endüstriyel işletim sistemidir.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/dashboard"
              className="group relative flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all duration-300 active:scale-[0.98] w-full sm:w-auto justify-center overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-[0_0_40px_rgba(99,102,241,0.6)] transition-opacity duration-300" />
              <Sparkles className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-200" />
              <span className="relative z-10">Sisteme Giriş Yap</span>
            </Link>
            
            <a
              href="#ozellikler"
              className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold px-8 py-4 rounded-2xl text-base transition-all duration-300 active:scale-[0.98] w-full sm:w-auto justify-center"
            >
              Özellikleri Keşfet
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-white transition-all" />
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Bento Grid Section ──────────────────────────────────── */}
      <section id="ozellikler" className="py-32 px-6 relative z-10 bg-[#030712]/50 backdrop-blur-3xl overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-[#030712] before:to-transparent before:h-40">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
              Mükemmellik <span className="text-indigo-500">Standarttır.</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Operasyonlarınızı saniyesi saniyesine izleyin, raporlayın ve yönetin. <br className="hidden sm:block"/> Bırakın LeadNova gerisini halletsin.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: feat.delay }}
                className={`group relative bg-[#0a0a0b] bg-opacity-[0.8] backdrop-blur-3xl rounded-[2.5rem] border ${feat.borderColor} p-10 hover:-translate-y-2 transition-all duration-500 overflow-hidden shadow-2xl`}
              >
                {/* Hover Glow */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${feat.hoverGlow} to-transparent transition-opacity duration-500`} />
                <div className={`absolute -top-32 -right-32 w-64 h-64 ${feat.hoverBlur} rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                
                <div className={`${feat.bg} w-20 h-20 rounded-3xl flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative z-10 shadow-xl backdrop-blur-md`}>
                  <feat.icon className={`${feat.iconColor} w-10 h-10`} />
                </div>
                
                <h3 className="text-3xl font-black text-white mb-4 relative z-10 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">{feat.title}</h3>
                <p className="text-gray-400 text-lg leading-relaxed relative z-10 group-hover:text-gray-300 transition-colors font-medium">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Line / Separator ───────────────────────────── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="py-12 px-6 relative z-10 bg-[#030712]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
             <Image src="/logo.png" alt="LeadNova Logo" width={28} height={28} className="grayscale hover:grayscale-0 transition-all" />
            <span className="font-bold text-gray-400 hover:text-white text-sm tracking-widest uppercase transition-colors">LeadNova System</span>
          </div>
          <p className="text-gray-600 text-xs font-medium">
            © {new Date().getFullYear()} LeadNova Inc. Tüm hakları gizlilikle saklıdır. Platform Güvenliği Aktif.
          </p>
        </div>
      </footer>
    </div>
  );
}
