import { Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Unauthorized() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-[#0a0a0b]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-10 max-w-md w-full shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/10 rounded-full blur-[60px]" />
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                        <Lock className="w-10 h-10 text-red-400" />
                    </div>
                    
                    <h1 className="text-2xl font-black text-white mb-3 tracking-tight">Kısıtlı Erişim Katmanı</h1>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8">
                        Organizasyonel hiyerarşi ve mevcut rolleriniz gereği bu modüle erişim izniniz bulunmamaktadır.
                    </p>
                    
                    <Link href="/dashboard" className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all hover:border-gray-500 active:scale-95">
                        <ArrowLeft className="w-4 h-4 text-gray-400" />
                        Güvenli Bölgeye Dön
                    </Link>
                </div>
            </div>
        </div>
    );
}
