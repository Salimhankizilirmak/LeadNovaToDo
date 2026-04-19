'use client';

import { useState } from 'react';
import { 
  Building2, 
  UserPlus, 
  ShieldCheck, 
  Loader2, 
  Plus, 
  CheckCircle2,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const [submitting, setSubmitting] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [bossEmail, setBossEmail] = useState('');

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !bossEmail) {
      toast.error('Lütfen tüm alanları doldurun.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/create-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationName: orgName, bossEmail }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'İşlem başarısız');

      toast.success(data.message || 'Müşteri başarıyla kuruldu ✓');
      setOrgName('');
      setBossEmail('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-indigo-600">
           <ShieldCheck size={28} className="animate-pulse" />
           <span className="text-xs font-black uppercase tracking-[0.2em]">Süper Admin Paneli</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
          Yeni Müşteri <span className="text-gray-400">Kaydı</span>
        </h1>
        <p className="text-gray-500 font-medium">
          Sistem üzerine yeni bir şirket (B2B) tanımlayın ve yönetici atayın.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form Alanı */}
        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-500/5 space-y-8">
          <form onSubmit={handleCreateOrg} className="space-y-6">
            {/* Şirket Adı */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Müşteri (Şirket) Adı
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Örn: Global Tech A.Ş."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all placeholder:text-gray-300 font-medium"
                />
              </div>
            </div>

            {/* Patron E-postası */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Yönetici (Patron) E-postası
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={bossEmail}
                  onChange={(e) => setBossEmail(e.target.value)}
                  placeholder="patron@sirket.com"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all placeholder:text-gray-300 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:bg-indigo-300"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Plus size={20} />
                  Şirketi Kur ve Davet Gönder
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-gray-50 flex items-center gap-2 text-gray-400">
             <CheckCircle2 size={16} className="text-emerald-500" />
             <p className="text-[10px] font-bold uppercase tracking-wider italic">
               Clerk Organizations API üzerinden senkronize çalışır.
             </p>
          </div>
        </div>

        {/* Bilgi / Kılavuz Alanı */}
        <div className="flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Bu işlem ne yapar?</h3>
            <ul className="space-y-4">
              {[
                { icon: Building2, text: "Clerk üzerinde yeni bir 'Organization' kaydı oluşturulur." },
                { icon: UserPlus, text: "Belirtilen e-posta adresine Admin yetkisiyle bir davetiye gönderilir." },
                { icon: ShieldCheck, text: "Kullanıcı daveti kabul ettiğinde LeadNova altyapısına Patron olarak dahil olur." }
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <item.icon size={18} />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 dark:border-none">
             <p className="text-xs text-amber-800 leading-relaxed">
               <strong>Not:</strong> Oluşturulan şirketin slug bilgisi otomatik olarak şirket adından üretilir. Şirket ismi sistemde benzersiz olmalıdır.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
