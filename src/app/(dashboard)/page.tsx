'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { useUserStore } from '@/store/useUserStore';

/* ── Tip Tanımları ─────────────────────────────────────────── */
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | string;
  priority: 'low' | 'medium' | 'high' | string;
  due_date: string | null;
  created_at: string;
}

interface Stats {
  overdue: number;
  completed: number;
  pending: number;
}

/* ── Yardımcı Fonksiyonlar ─────────────────────────────────── */
function computeStats(tasks: Task[]): Stats {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const overdue = tasks.filter(
    (t) => t.status !== 'done' && t.due_date && new Date(t.due_date) < now
  ).length;

  const completed = tasks.filter((t) => t.status === 'done').length;

  const pending = tasks.filter(
    (t) => t.status === 'todo' || t.status === 'in_progress'
  ).length;

  return { overdue, completed, pending };
}

/* ── Badge Renkleri ────────────────────────────────────────── */
const statusConfig: Record<string, { label: string; className: string }> = {
  todo: { label: 'Yapılacak', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'Devam Ediyor', className: 'bg-blue-50 text-blue-700' },
  done: { label: 'Tamamlandı', className: 'bg-emerald-50 text-emerald-700' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Düşük', className: 'bg-gray-50 text-gray-500' },
  medium: { label: 'Orta', className: 'bg-amber-50 text-amber-700' },
  high: { label: 'Yüksek', className: 'bg-red-50 text-red-700' },
};

/* ── Skeleton Loader ───────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded-xl w-72" />
        <div className="h-4 bg-gray-100 rounded-lg w-52" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="h-4 bg-gray-100 rounded-lg w-32" />
            <div className="h-10 bg-gray-200 rounded-xl w-16" />
          </div>
        ))}
      </div>

      {/* Task List Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="h-5 bg-gray-200 rounded-lg w-40 mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
            <div className="h-4 bg-gray-100 rounded-lg flex-1" />
            <div className="h-6 bg-gray-100 rounded-full w-20" />
            <div className="h-6 bg-gray-100 rounded-full w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Ana Bileşen ───────────────────────────────────────────── */
export default function DashboardPage() {
  const user = useUserStore((state) => state.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>({ overdue: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, status, priority, due_date, created_at')
          .eq('assignee_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          toast.error('Görevler yüklenirken bir sorun oluştu.');
          return;
        }

        const fetchedTasks = (data as Task[]) ?? [];
        setTasks(fetchedTasks);
        setStats(computeStats(fetchedTasks));
      } catch {
        toast.error('Beklenmeyen bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  if (loading) return <DashboardSkeleton />;

  const displayName = user?.email?.split('@')[0] ?? 'Kullanıcı';
  const recentTasks = tasks.slice(0, 5);

  const statCards = [
    {
      label: 'Geciken Görevler',
      value: stats.overdue,
      icon: AlertCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100',
      valueColor: 'text-red-600',
    },
    {
      label: 'Tamamlanan',
      value: stats.completed,
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      valueColor: 'text-emerald-600',
    },
    {
      label: 'Bekleyen Görevler',
      value: stats.pending,
      icon: Clock,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      valueColor: 'text-blue-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Karşılama Başlığı */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Merhaba, {displayName}! 👋
        </h1>
        <p className="text-gray-500 text-sm">
          İşte projelerindeki son durum.
        </p>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-2xl border ${card.borderColor} p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className={`${card.bgColor} p-3 rounded-xl shrink-0`}>
              <card.icon className={`${card.iconColor} w-6 h-6`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {card.label}
              </p>
              <p className={`text-4xl font-black ${card.valueColor} leading-none`}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Son Eklenen Görevler */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Son Eklenen Görevler</h2>
        </div>

        {recentTasks.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-400">
                Henüz sana atanmış bir görev bulunmuyor.
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Bir görev atandığında burada görünecek.
              </p>
            </div>
          </div>
        ) : (
          /* Görev Listesi */
          <ul className="divide-y divide-gray-50">
            {recentTasks.map((task) => {
              const status = statusConfig[task.status] ?? {
                label: task.status,
                className: 'bg-gray-100 text-gray-700',
              };
              const priority = priorityConfig[task.priority] ?? {
                label: task.priority,
                className: 'bg-gray-100 text-gray-500',
              };

              return (
                <li key={task.id} className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <p className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">
                    {task.title}
                  </p>
                  <span
                    className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${status.className}`}
                  >
                    {status.label}
                  </span>
                  <span
                    className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${priority.className}`}
                  >
                    {priority.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
