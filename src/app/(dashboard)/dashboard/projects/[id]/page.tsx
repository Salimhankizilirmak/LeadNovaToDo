'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Plus, 
  LayoutGrid, 
  List, 
  Search, 
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClerkClient } from '@/utils/supabase/client';
import { useAuth } from '@clerk/nextjs';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskList from '@/components/tasks/TaskList';
import TaskSlideOver from '@/components/tasks/TaskSlideOver';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';

interface Member {
  id: string;
  email?: string;
  display_name?: string | null;
}

interface Project {
  id: string;
  name: string;
  color: string;
  org_id: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string | null;
  assignee_id: string | null;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ── Data Fetching ────────────────────────────────────────── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) throw new Error('Oturum anahtarı alınamadı.');

        const supabase = createClerkClient(token);
        
        // 1. Fetch Project
        const { data: projData, error: projError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (projError || !projData) {
          toast.error('Proje bulunamadı.');
          router.push('/dashboard/projects');
          return;
        }
        setProject(projData);

        // 2. Fetch Organization Members (Join kaldırıldı - 400 Fix)
        const { data: memberData } = await supabase
          .from('org_members')
          .select('user_id')
          .eq('org_id', projData.org_id);
        
        setMembers((memberData?.map(m => ({ id: m.user_id, display_name: `Kullanıcı (${m.user_id.substring(0, 5)})` })) as Member[]) || []);

        // 3. Fetch Tasks without reach (Join kaldırıldı - 400 Fix)
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });

        if (taskError) throw taskError;
        setTasks((taskData as Task[]) || []);
      } catch {
        toast.error('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  /* ── Optimistic Updates & Handlers ───────────────────────── */
  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    // 1. Save old state for rollback
    const previousTasks = [...tasks];
    
    // 2. Update UI immediately (Optimistic)
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('Oturum anahtarı bulunamadı.');

      const supabase = createClerkClient(token);
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
    } catch {
      // 3. Rollback on error
      setTasks(previousTasks);
      toast.error('İşlem başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium text-gray-400">Proje Detayları Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
            <button 
              onClick={() => router.push('/dashboard/projects')}
              className="hover:text-indigo-600 transition-colors"
            >
              Projeler
            </button>
            <ChevronRight size={14} />
            <span className="text-gray-900">{project?.name}</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-1 h-8 rounded-full" style={{ backgroundColor: project?.color }} />
             <h1 className="text-2xl font-black text-gray-900 tracking-tight">
               {project?.name}
             </h1>
          </div>
        </div>

        {/* View Toggle & Add Task */}
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm flex items-center">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
              title="Kanban Görünümü"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
              title="Liste Görünümü"
            >
              <List size={18} />
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>Yeni Görev</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Görevlerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder-gray-400 shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4">
           <span>Toplam: {filteredTasks.length}</span>
           <span>Tamamlanan: {filteredTasks.filter(t => t.status === 'done').length}</span>
        </div>
      </div>

      {/* View Content */}
      <div className="pt-2">
        {viewMode === 'kanban' ? (
          <TaskBoard
            tasks={filteredTasks}
            onOpenTask={(task) => {
              setSelectedTask(task);
              setIsSlideOverOpen(true);
            }}
            onMoveTask={handleUpdateTaskStatus}
          />
        ) : (
          <TaskList
            tasks={filteredTasks}
            onOpenTask={(task) => {
              setSelectedTask(task);
              setIsSlideOverOpen(true);
            }}
            onToggleDone={(id, cur) => handleUpdateTaskStatus(id, cur === 'done' ? 'todo' : 'done')}
          />
        )}
      </div>

      {/* Modals & SlideOvers */}
      <CreateTaskModal
        projectId={id as string}
        members={members}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newTask) => {
          // If the new task came with assignee data, we might need a re-fetch or manual mapping
          // but usually CreateTaskModal.tsx will return the inserted row.
          // Since it's a new task, we'll likely need to fetch the assignee details manually or 
          // just let it be. For now, let's assume CreateTaskModal handles it or user will re-fetch.
          setTasks([newTask, ...tasks]);
          setIsModalOpen(false);
        }}
      />

      <TaskSlideOver
        key={selectedTask?.id}
        task={selectedTask}
        members={members}
        isOpen={isSlideOverOpen}
        onClose={() => {
          setIsSlideOverOpen(false);
          setSelectedTask(null);
        }}
        onUpdated={handleUpdateTask}
        onDeleted={(taskId) => {
          setTasks(tasks.filter(t => t.id !== taskId));
        }}
      />
    </div>
  );
}
