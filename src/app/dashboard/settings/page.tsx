'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  Shield, 
  Fingerprint, 
  Save, 
  Loader2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { getOrgSettingsAction, updateOrgNameAction } from '@/app/actions/org';

export default function SettingsPage() {
  const [org, setOrg] = useState<any>(null);
  const [role, setRole] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getOrgSettingsAction();
      if (res.success) {
        setOrg(res.org);
        setRole(res.role || 'Personel');
        setNewName(res.org?.name || '');
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === org?.name) return;

    setUpdating(true);
    const res = await updateOrgNameAction(newName);
    if (res.success) {
        toast.success('Organizasyon adı güncellendi ✓');
        setOrg({ ...org, name: newName });
    } else {
        toast.error(res.error || 'Güncelleme başarısız.');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Sistem Ayarları Yükleniyor...</p>
      </div>
    );
  }

  const isBoss = ['Patron', 'Genel Müdür', 'Admin'].includes(role);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-gray-100 pb-10">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
           <Settings className="text-indigo-600" size={48} />
           Sistem Ayarları
        </h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
           Organizasyonel Yapılandırma ve Kurumsal Kimlik
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        
        {/* Organizasyon Profili */}
        <section className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden">
           <div className="p-8 sm:p-12 space-y-10">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600">
                    <Building2 size={40} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900">Kurumsal Profil</h2>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">LeadNova Üzerindeki Kimliğiniz</p>
                 </div>
              </div>

              <div className="space-y-6">
                 {/* Firma Adı */}
                 <div className="space-y-3">
                    <label className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Firma Adı</label>
                    <div className="flex gap-4">
                       <input 
                         type="text"
                         value={newName}
                         onChange={(e) => setNewName(e.target.value)}
                         disabled={!isBoss}
                         className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-400 transition-all disabled:opacity-50"
                         placeholder="Firma adını giriniz..."
                       />
                       {isBoss && (
                         <button 
                           onClick={handleUpdateName}
                           disabled={updating || !newName.trim() || newName === org?.name}
                           className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                         >
                           {updating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                           KAYDET
                         </button>
                       )}
                    </div>
                    {!isBoss && (
                      <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-tighter">
                         <Info size={12} />
                         Yalnızca yöneticiler firma adını değiştirebilir.
                      </p>
                    )}
                 </div>

                 {/* Org ID & Details */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-50 space-y-2">
                       <div className="flex items-center gap-2 text-gray-400">
                          <Fingerprint size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Organizasyon ID</span>
                       </div>
                       <p className="text-xs font-mono font-bold text-gray-600 select-all">{org?.id}</p>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-50 space-y-2">
                       <div className="flex items-center gap-2 text-gray-400">
                          <Shield size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Erişim Rolünüz</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-indigo-500" />
                          <p className="text-sm font-black text-gray-900">{role}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Footer Info */}
           <div className="bg-gray-50/50 p-8 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
                 * Organizasyon ayarları fabrika genelindeki tüm birimleri etkiler. <br/>
                 Hassas değişiklikler yaparken lütfen diğer yöneticilerle koordine olunuz.
              </p>
           </div>
        </section>

      </div>
    </div>
  );
}
