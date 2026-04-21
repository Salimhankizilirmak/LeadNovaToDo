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
  Loader2,
  Layout,
  Activity,
  User,
  Flag,
  ArrowRight,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { createCellAction } from '@/app/actions/projects';
import { createBlockAction } from '@/app/actions/blocks';

interface Task {
  id: string;
  title: string;
  priority: string;
  assignee?: {
    fullName: string;
    avatarUrl?: string;
  } | null;
}

interface Block {
  id: string;
  name: string;
  tasks: Task[];
}

interface Project {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
}

interface Cell {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  member_count?: number;
  blocks: Block[];
  projects: Project[]; // Yeni: Hücreye atanmış projeler
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
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState<string | null>(null); // cellId
  const [newBlockName, setNewBlockName] = useState('');

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
          blocks: [],
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

  const handleCreateBlock = async (cellId: string) => {
    if (!newBlockName.trim()) return;

    try {
      const result = await createBlockAction({ name: newBlockName, cellId });
      if (result.success && result.block) {
        toast.success('İstasyon (Blok) başarıyla oluşturuldu.');
        setCells(prev => prev.map(c => 
          c.id === cellId 
            ? { ...c, blocks: [...c.blocks, { ...result.block, tasks: [] } as any] } 
            : c
        ));
        setNewBlockName('');
        setIsAddingBlock(null);
      } else {
        toast.error(result.error || 'Blok oluşturulamadı.');
      }
    } catch (err) {
      toast.error('Hata oluştu.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-rose-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
             <Layout className="text-indigo-600" size={36} />
             Hücre Sistemi
          </h1>
          <p className="text-gray-500 font-medium mt-2">
             Fiziksel istasyonları (blokları) ve anlık iş akışını gerçek zamanlı izleyin.
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

      {/* Search and Stats */}
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
      </div>

      {/* Cells Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {filteredCells.map((cell) => (
          <div key={cell.id} className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col border-b-8 border-b-indigo-500/10">
            {/* Cell Header */}
            <div className="p-8 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-indigo-50 rounded-[1.5rem] text-indigo-600">
                    <Boxes size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 leading-none">{cell.name}</h3>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         <Activity size={12} className="text-emerald-500" />
                         {cell.blocks.length} İSTASYON
                       </span>
                       <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         <Users size={12} className="text-indigo-500" />
                         {cell.member_count} PERSONEL
                       </span>
                    </div>
                  </div>
                </div>
                {canManage && (
                   <button 
                    onClick={() => setIsAddingBlock(cell.id)}
                    className="p-3 bg-gray-50 hover:bg-indigo-600 hover:text-white text-gray-400 rounded-2xl transition-all"
                   >
                     <Plus size={20} />
                   </button>
                )}
              </div>

              {/* Block Creation Inline */}
              {isAddingBlock === cell.id && (
                <div className="mb-6 flex animate-in slide-in-from-top-4 duration-300">
                  <input 
                    type="text"
                    autoFocus
                    placeholder="Blok (İstasyon) Adı..."
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                    className="flex-1 bg-gray-50 border-0 rounded-l-2xl px-4 py-3 text-sm focus:ring-0 outline-none"
                  />
                  <button 
                    onClick={() => handleCreateBlock(cell.id)}
                    className="bg-indigo-600 text-white px-4 rounded-r-2xl text-[10px] font-black uppercase tracking-widest"
                  >
                    KAYDET
                  </button>
                  <button 
                    onClick={() => setIsAddingBlock(null)}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Mini-Kanban Blocks Section */}
            <div className="flex-1 p-8 pt-2 overflow-x-auto">
               <div className="flex gap-6 min-w-max pb-4">
                  {cell.blocks.length > 0 ? cell.blocks.map(block => (
                    <div key={block.id} className="w-64 flex flex-col gap-3">
                       <div className="flex items-center justify-between mb-1 px-1">
                          <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                             {block.name}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">{block.tasks.length} Görev</span>
                       </div>
                       
                       <div className="space-y-3 bg-gray-50/50 p-3 rounded-[1.5rem] border border-gray-100/50 min-h-[100px]">
                          {block.tasks.map(task => (
                            <div key={task.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                               <div className="flex items-center justify-between mb-2">
                                  <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black text-white uppercase tracking-tighter ${getPriorityColor(task.priority)}`}>
                                     {task.priority === 'critical' ? 'Kritik' : task.priority === 'high' ? 'Yüksek' : 'Normal'}
                                  </div>
                               </div>
                               <h4 className="text-xs font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                 {task.title}
                               </h4>
                               <div className="flex items-center justify-between mt-3 border-t border-gray-50 pt-2">
                                  <div className="flex items-center gap-1.5">
                                     <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden">
                                        {task.assignee?.avatarUrl ? (
                                          <img src={task.assignee.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <User size={10} />
                                        )}
                                     </div>
                                     <span className="text-[10px] font-medium text-gray-500 truncate max-w-[80px]">
                                       {task.assignee?.fullName.split(' ')[0] || 'Atanmamış'}
                                     </span>
                                  </div>
                                  <ArrowRight size={12} className="text-gray-300" />
                               </div>
                            </div>
                          ))}
                          {block.tasks.length === 0 && (
                            <div className="py-8 text-center">
                               <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Boş İstasyon</p>
                            </div>
                          )}
                       </div>
                    </div>
                  )) : (
                    <div className="w-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem]">
                       <Layout className="text-gray-100 mb-2" size={32} />
                       <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Henüz Blok Tanımlanmadı</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Footer Detail Button */}
            <button 
              onClick={() => setSelectedCell(cell)}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black text-indigo-50 uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
            >
               HÜCRE OPERASYON PANELİ <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}
      </div>

      {/* Operation Panel Modal (Full Screen) */}
      {selectedCell && (
        <div className="fixed inset-0 z-[100] bg-gray-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="w-full h-full bg-white rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="p-10 border-b border-gray-100 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-200">
                       <Boxes size={42} />
                    </div>
                    <div>
                       <div className="flex items-center gap-4">
                          <h2 className="text-5xl font-black text-gray-900 tracking-tighter">{selectedCell.name}</h2>
                          <div className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100">
                             AKTİF OPERASYON
                          </div>
                       </div>
                       <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-sm">Hücre Operasyon ve Verimlilik Paneli</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => setSelectedCell(null)}
                  className="p-4 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-3xl transition-all"
                 >
                    <X size={32} />
                 </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-12">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* Sidebar Stats */}
                    <div className="space-y-10">
                       <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-6">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">Hücre Özeti</h4>
                          <div className="space-y-6">
                             <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-500">Personel</span>
                                <span className="text-xl font-black text-gray-900">{selectedCell.member_count}</span>
                             </div>
                             <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-500">İstasyon</span>
                                <span className="text-xl font-black text-gray-900">{selectedCell.blocks.length}</span>
                             </div>
                             <div className="flex items-center justify-between text-indigo-600">
                                <span className="text-sm font-black uppercase tracking-tighter">Aktif İş Yükü</span>
                                <span className="text-3xl font-black">
                                  {selectedCell.blocks.reduce((acc, b) => acc + b.tasks.length, 0)}
                                </span>
                             </div>
                          </div>
                       </div>

                       <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200">
                          <PieChart size={32} className="mb-4" />
                          <h4 className="text-xl font-black mb-2">Verimlilik Analizi</h4>
                          <p className="text-indigo-100 text-xs font-bold leading-relaxed">
                             Bu hücredeki ortalama iş tamamlama hızı fabrika standartlarının %12 üzerinde.
                          </p>
                       </div>
                    </div>

                    {/* Detailed Monitor View */}
                     <div className="md:col-span-3 space-y-12">
                        {/* İstasyonlar (Bloklar) */}
                        <section>
                           <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <Activity size={18} className="text-indigo-600" />
                              İstasyon Bazlı Takip
                           </h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                              {selectedCell.blocks.map(block => (
                                 <div key={block.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all">
                                    <div className="flex items-center justify-between mb-8">
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                                             {block.name.charAt(0)}
                                          </div>
                                          <h5 className="text-xl font-black text-gray-900 tracking-tight">{block.name}</h5>
                                       </div>
                                       <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ÇALIŞIYOR</span>
                                       </div>
                                    </div>

                                    <div className="space-y-4">
                                       {block.tasks.map(task => (
                                          <div key={task.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-50 flex items-center justify-between group hover:bg-white hover:border-indigo-100 transition-all cursor-pointer">
                                             <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} shadow-lg shadow-indigo-100`} />
                                                <div>
                                                   <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</p>
                                                   <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Sorumlu: {task.assignee?.fullName || 'Genel'}</p>
                                                </div>
                                             </div>
                                          </div>
                                       ))}
                                       {block.tasks.length === 0 && (
                                         <div className="py-10 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center">
                                            <Activity size={24} className="text-gray-100 mb-2" />
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">İSTASYON BOŞTA</p>
                                         </div>
                                       )}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </section>

                        {/* Hücredeki Aktif Projeler */}
                        <section>
                           <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <ClipboardList size={18} className="text-indigo-600" />
                              Hücredeki Aktif Projeler
                           </h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                              {selectedCell.projects && selectedCell.projects.length > 0 ? selectedCell.projects.map(project => (
                                 <div key={project.id} className="bg-white border-l-8 border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all" style={{ borderLeftColor: project.color }}>
                                    <h5 className="text-xl font-black text-gray-900 mb-4">{project.name}</h5>
                                    <div className="space-y-3">
                                       {project.tasks && project.tasks.length > 0 ? project.tasks.map(task => (
                                          <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                             <span className="text-xs font-bold text-gray-700">{task.title}</span>
                                             <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase">{task.priority}</span>
                                             </div>
                                          </div>
                                       )) : (
                                          <p className="text-xs text-gray-400 italic">Bu projede aktif görev yok.</p>
                                       )}
                                    </div>
                                 </div>
                              )) : (
                                 <div className="md:col-span-2 py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                                    <ClipboardList size={42} className="text-gray-100 mb-4" />
                                    <p className="text-sm font-black text-gray-300 uppercase tracking-widest text-center">Bu hücreye atanmış bir proje bulunmamaktadır.</p>
                                 </div>
                              )}
                           </div>
                        </section>
                     </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}


