'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  LayoutGrid, 
  List, 
  Search, 
  ChevronRight,
  MessageSquare,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskList from '@/components/tasks/TaskList';
import ProjectChatRoom from './ProjectChatRoom';
import ProjectAttachments from './ProjectAttachments';
import TaskSlideOver from '@/components/tasks/TaskSlideOver';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import { Task, Member } from '@/types/task';
import { updateTaskStatusAction } from '@/app/actions/tasks';

interface ProjectDetailViewProps {
  initialProject: any;
  initialTasks: any[];
  members: Member[];
  blocks?: any[];
}

export default function ProjectDetailView({ 
  initialProject, 
  initialTasks, 
  members,
  blocks = []
}: ProjectDetailViewProps) {
  const router = useRouter();
  const { user } = useUser();
  
  const [tasks, setTasks] = useState<Task[]>(initialTasks as Task[]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'collab'>('tasks');
  
  // UI States
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ── Yetki Kontrolleri ─────────────────────────────────────── */
  const myRole = user?.publicMetadata?.role as string;
  const isHighRole = ['Patron', 'Genel Müdür', 'Admin'].includes(myRole);
  const isProjectManager = initialProject.managerId === user?.id;
  const canManageTasks = isHighRole || isProjectManager;

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));

    const result = await updateTaskStatusAction(taskId, newStatus);
    if (!result.success) {
      setTasks(previousTasks);
      toast.error(result.error || 'Statü güncellenemedi.');
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
            <span className="text-gray-900">{initialProject.name}</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: initialProject.color }} />
             <h1 className="text-2xl font-black text-gray-900 tracking-tight">
               {initialProject.name}
             </h1>
          </div>
        </div>

        {/* Tabs & Add Task */}
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex items-center">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'tasks' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <CheckCircle2 size={14} />
              <span className="hidden sm:inline">Görevler</span>
            </button>
            <button
              onClick={() => setActiveTab('collab')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'collab' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <MessageSquare size={14} />
              <span className="hidden sm:inline">Sohbet & Ekler</span>
            </button>
          </div>
          
          {canManageTasks && activeTab === 'tasks' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Plus size={18} />
              <span>Yeni Görev</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'tasks' ? (
        <div className="space-y-6">
          {/* Toolbar: Search & View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/50 p-4 rounded-[2rem] border border-gray-100">
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
            
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4">
                   <span>Toplam: {filteredTasks.length}</span>
                </div>
                
                <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm flex items-center">
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <List size={18} />
                    </button>
                </div>
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
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <ProjectChatRoom projectId={initialProject.id} />
            </div>
            <div className="lg:col-span-1">
                <ProjectAttachments projectId={initialProject.id} initialAttachments={initialProject.attachments} />
            </div>
        </div>
      )}

      {/* Modals & SlideOvers */}
      <CreateTaskModal
        projectId={initialProject.id}
        orgId={initialProject.orgId}
        members={members}
        blocks={blocks}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newTask) => {
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
