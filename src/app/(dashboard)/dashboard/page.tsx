import { auth, currentUser } from '@clerk/nextjs/server';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  ChevronRight,
  LayoutGrid,
  Calendar,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { createClerkClient } from '@/utils/supabase/server';

/* ── Tipler ─────────────────────────────────────────────────── */
interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  critical: number;
}

/* ── Bileşenler ─────────────────────────────────────────────── */
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color: string;
  trend?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ${color} transition-colors`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-tight">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-5">
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{title}</h3>
        <p className="text-3xl font-black text-gray-900 mt-1 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

/* ── Ana Sayfa (Server Component) ─────────────────────────── */
export default async function DashboardPage() {
  const { getToken, userId, orgId } = await auth();
  const token = await getToken({ template: 'supabase' });
  const user = await currentUser();

  if (!token || !userId) {
    return <div>Oturum açılmamış.</div>;
  }

  const supabase = await createClerkClient(token);

  // Verileri çek (Organizasyon varsa organizasyona, yoksa kullanıcıya göre filtrele)
  const taskQuery = supabase
    .from('tasks')
    .select('*, project:projects(name, color), assignee:profiles(full_name, avatar_url)')
    .eq('assignee_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  const projectQuery = supabase
    .from('projects')
    .select('*')
    .limit(3);

  // Eğer bir organizasyondaysak, organizasyon verilerini filtrele. 
  // Değilsek (Kişisel), sadece atananları getir (RLS zaten koruyor).
  if (orgId) {
    // Projeleri sadece bu organizasyona ait olanlarla kısıtla
    projectQuery.eq('org_id', orgId);
    // Görevleri esnet: Bu organizasyona ait olanLAR VEYA bana atananLAR
    taskQuery.or(`org_id.eq.${orgId},assignee_id.eq.${userId}`);
  } else {
    // Kişisel alandayız, zaten varsayılan sorgu assignee_id = userId eklemişti
  }

  const [
    { data: tasks },
    { data: projects },
  ] = await Promise.all([taskQuery, projectQuery]);

  // İstatistikleri hesapla
  const statsQuery = supabase
    .from('tasks')
    .select('status, priority')
    .eq('assignee_id', userId);

  if (orgId) statsQuery.eq('org_id', orgId);

  const { data: allTasks } = await statsQuery;

  const stats: DashboardStats = {
    total: allTasks?.length || 0,
    completed: allTasks?.filter(t => t.status === 'done').length || 0,
    pending: allTasks?.filter(t => t.status !== 'done').length || 0,
    critical: allTasks?.filter(t => t.priority === 'critical').length || 0,
  };

  const displayName = user?.firstName || user?.emailAddresses[0].emailAddress.split('@')[0] || 'Kullanıcı';

  return (
    <div className="space-y-10 pb-10">
      {/* Karşılama */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
          Merhaba, {displayName}! 👋
        </h1>
        <p className="text-gray-500 font-medium">
          İşte bugün için odaklanman gerekenler.
        </p>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Toplam Görev" 
          value={stats.total} 
          icon={Layers} 
          color="bg-indigo-50 text-indigo-600" 
        />
        <StatCard 
          title="Tamamlanan" 
          value={stats.completed} 
          icon={CheckCircle2} 
          color="bg-emerald-50 text-emerald-600" 
          trend="+12%"
        />
        <StatCard 
          title="Bekleyen" 
          value={stats.pending} 
          icon={Clock} 
          color="bg-amber-50 text-amber-600" 
        />
        <StatCard 
          title="Kritik" 
          value={stats.critical} 
          icon={AlertCircle} 
          color="bg-rose-50 text-rose-600" 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Son Görevler */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Son Görevler
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Yeni</span>
            </h2>
            <Link href="/dashboard/projects" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            {tasks && tasks.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {tasks.map((task) => (
                  <div key={task.id} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{task.project?.name}</span>
                          <span className="w-1 h-1 bg-gray-200 rounded-full" />
                          <span className={`text-[10px] font-black uppercase ${
                            task.priority === 'critical' ? 'text-rose-500' : 
                            task.priority === 'high' ? 'text-amber-500' : 'text-gray-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white rounded-xl transition-all shadow-sm">
                      <ChevronRight size={18} className="text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                  <LayoutGrid className="text-gray-200" size={32} />
                </div>
                <p className="text-sm text-gray-400 font-medium">Henüz görev atanmamış.</p>
                <Link href="/dashboard/projects" className="inline-flex items-center gap-2 text-xs font-bold bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                  <Plus size={16} /> Bir Projeye Git
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Yan Panel: Aktif Projeler */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Aktif Projeler</h2>
            <Link href="/dashboard/projects" className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
              <Plus size={18} />
            </Link>
          </div>

          <div className="space-y-4">
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <div key={project.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: project.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate">{project.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Aktif</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2rem] text-center">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Henüz Proje Yok</p>
              </div>
            )}
            
            <Link 
              href="/dashboard/projects" 
              className="flex items-center justify-center p-5 bg-gray-50 rounded-3xl border border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 hover:text-gray-600 transition-all"
            >
              Tüm Projeleri Keşfet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
