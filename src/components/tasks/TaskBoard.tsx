'use client';

import { ArrowRight, ArrowLeft, MoreVertical, Calendar, User } from 'lucide-react';
import { Task, Member } from '@/types/task';

/* ── Sabitler ─────────────────────────────────────────────── */
const COLUMNS = [
  { id: 'todo', title: 'Yapılacak', bgColor: 'bg-gray-50', textColor: 'text-gray-600', dotColor: 'bg-gray-400' },
  { id: 'in_progress', title: 'Devam Ediyor', bgColor: 'bg-indigo-50/50', textColor: 'text-indigo-700', dotColor: 'bg-indigo-500' },
  { id: 'done', title: 'Tamamlandı', bgColor: 'bg-emerald-50/50', textColor: 'text-emerald-700', dotColor: 'bg-emerald-500' },
];

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Düşük', className: 'text-gray-500 bg-gray-100' },
  medium: { label: 'Orta', className: 'text-amber-700 bg-amber-50' },
  high: { label: 'Yüksek', className: 'text-orange-700 bg-orange-50' },
  critical: { label: 'Kritik', className: 'text-red-700 bg-red-50' },
};

/* ── Görev Kartı ───────────────────────────────────────────── */
interface TaskCardProps {
  task: Task;
  onOpen: (task: Task) => void;
  onMove: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
}

function KanbanCard({ task, onOpen, onMove }: TaskCardProps) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  const assignee = task.assignee;
  const initials = assignee 
    ? (assignee.display_name || assignee.email || 'U').split('@')[0].substring(0, 2).toUpperCase()
    : null;

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden ring-1 ring-black/5"
      onClick={() => onOpen(task)}
    >
      <div className="p-4 space-y-4">
        {/* Header: Title & Priority */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">
              {task.title}
            </h4>
            <button className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors shrink-0">
              <MoreVertical size={16} />
            </button>
          </div>
          <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${priority.className}`}>
            {priority.label}
          </span>
        </div>

        {/* Info Area */}
        {task.due_date && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <Calendar size={12} />
            <span className="text-[11px] font-medium">
              {new Date(task.due_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="pt-3 border-t border-gray-50 flex items-center justify-between mt-auto">
          <div className="flex items-center -space-x-1 overflow-hidden">
            {initials && assignee ? (
              <div 
                className="w-6 h-6 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[9px] font-black text-indigo-700 shadow-sm"
                title={`${assignee.display_name || 'Kullanıcı'} (${assignee.email})`}
              >
                {initials}
              </div>
            ) : (
              <div 
                className="w-6 h-6 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-gray-300"
                title="Atanmamış"
              >
                <User size={12} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <select
              value={task.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onMove(task.id, e.target.value as any)}
              className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1.5 rounded-lg border outline-none cursor-pointer transition-all shadow-sm ${
                task.status === 'todo' ? 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-300' :
                task.status === 'in_progress' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300' :
                'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300'
              }`}
            >
              <option value="todo">YAPILACAK</option>
              <option value="in_progress">DEVAM EDİYOR</option>
              <option value="done">TAMAMLANDI</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Ana Board ─────────────────────────────────────────────── */
interface TaskBoardProps {
  tasks: Task[];
  members?: Member[];
  onOpenTask: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
}

export default function TaskBoard({ tasks, onOpenTask, onMoveTask }: TaskBoardProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);

        return (
          <div key={column.id} className="w-full lg:flex-1 min-w-0">
            {/* Column Header */}
            <div className={`flex items-center justify-between mb-4 p-3 rounded-2xl ${column.bgColor}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${column.dotColor}`} />
                <h3 className={`text-sm font-bold tracking-tight ${column.textColor}`}>
                  {column.title}
                </h3>
                <span className={`text-[10px] font-black px-1.5 bg-white/60 rounded-md border border-white ${column.textColor}`}>
                  {columnTasks.length}
                </span>
              </div>
            </div>

            {/* Column Tasks Container */}
            <div className="space-y-3 min-h-[150px]">
              {columnTasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onOpen={onOpenTask}
                  onMove={onMoveTask}
                />
              ))}

              {columnTasks.length === 0 && (
                <div className="border-2 border-dashed border-gray-100 rounded-2xl py-12 flex flex-col items-center justify-center gap-2 opacity-50">
                   <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                     <div className={`w-1.5 h-1.5 rounded-full ${column.dotColor}`} />
                   </div>
                   <span className="text-[11px] font-medium text-gray-400">Görev Yok</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
