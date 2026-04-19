'use client';

import { useState, useMemo } from 'react';
import { 
  Boxes, 
  Plus, 
  Users, 
  ClipboardList, 
  ChevronRight, 
  Search,
  Settings2,
  PieChart,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { createCellAction } from '@/app/actions/projects';

interface Cell {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  member_count?: number;
  task_stats?: {
    total: number;
    active: number;
    done: number;
  }
}

export default function CellsView({ initialCells }: { initialCells: Cell[] }) {
  const { user } = useUser();
  const [cells, setCells] = useState<Cell[]>(initialCells);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const canManage = useMemo(() => {
    const role = user?.publicMetadata?.role as string;
    return ['Patron', 'Genel Müdür', 'Admin'].includes(role);
  }, [user]);

  const filteredCells = cells.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCell = async () => {
    const name = prompt('Hücre (Departman) Adı:');
    if (!name) return;

    setCreating(true);
    try {
      const result = await createCellAction(name);
      if (result.success && result.cell) {
        toast.success('Hücre başarıyla oluşturuldu.');
        setCells(prev => [{
          ...result.cell,
          member_count: 0,
          task_stats: { total: 0, active: 0, done: 0 }
        } as any, ...prev]);
      } else {
        toast.error(result.error || 'Hücre oluşturulamadı.');
      }
    } catch (err) {
      toast.error('Beklenmedik bir hata oluştu.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
             <Boxes className="text-indigo-600" size={36} />
             Hücre Sistemi
          </h1>
          <p className="text-gray-500 font-medium mt-2">
             Organizasyonunuzu departmanlara (hücrelere) ayırarak iş akışını ve personeli yönetin.
          </p>
        </div>
        {canManage && (
          <button 
            onClick={handleCreateCell}
            disabled={creating}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-[1.5rem] text-sm font-black shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {creating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            YENİ HÜCRE EKLE
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Hücrelerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-gray-50/50 border-0 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-6 px-4">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Toplam Hücre</span>
              <span className="text-xl font-black text-gray-900">{cells.length}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCells.map((cell) => (
          <div key={cell.id} className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all overflow-hidden flex flex-col">
            <div className="p-8 space-y-6 flex-1">
              <div className="flex items-start justify-between">
                <div className="p-4 bg-indigo-50 rounded-[1.5rem] text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                   <Boxes size={24} />
                </div>
                <button className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                  <Settings2 size={18} />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{cell.name}</h3>
                <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                  {cell.description || 'Bu departman için henüz bir açıklama girilmedi.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Personel</p>
                   <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                      <Users size={14} className="text-indigo-500" />
                      {cell.member_count}
                   </div>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Aktif İş</p>
                   <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                      <ClipboardList size={14} className="text-amber-500" />
                      {cell.task_stats?.active}
                   </div>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Biten</p>
                   <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                      <PieChart size={14} className="text-emerald-500" />
                      {cell.task_stats?.done}
                   </div>
                </div>
              </div>
            </div>

            <button className="w-full py-5 bg-gray-50 border-t border-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
               Detayları Gör <ChevronRight size={14} />
            </button>
          </div>
        ))}

        {filteredCells.length === 0 && (
          <div className="col-span-full py-32 border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center gap-4">
             <div className="p-6 bg-gray-50 rounded-full text-gray-200">
                <Boxes size={48} />
             </div>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Hücre Bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}
