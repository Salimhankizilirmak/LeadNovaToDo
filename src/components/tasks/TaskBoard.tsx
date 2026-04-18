'use client';

import { ArrowRight, ArrowLeft, MoreVertical, Calendar, Flag, User } from 'lucide-react';

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
  task: any;
  onOpen: (task: any) => void;
  onMove: (taskId: string, newStatus: string) => void;
}

function KanbanCard({ task, onOpen, onMove }: TaskCardProps) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  const assignee = task.assignee;
  const initials = assignee 
    ? (assignee.display_name || assignee.email).split('@')[0].substring(0, 2).toUpperCase()
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
            {initials ? (
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

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0 duration-200">
            {task.status !== 'todo' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(task.id, task.status === 'done' ? 'in_progress' : 'todo');
                }}
                className="p-1.5 bg-gray-50 text-gray-500 hover:text-gray-900 rounded-lg border border-gray-100 shadow-sm hover:shadow-md"
                title="Geri taşı"
              >
                <ArrowLeft size={14} />
              </button>
            )}
            {task.status !== 'done' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(task.id, task.status === 'todo' ? 'in_progress' : 'done');
                }}
                className="p-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow-indigo-200"
                title="İleri taşı"
              >
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Ana Board ─────────────────────────────────────────────── */
interface TaskBoardProps {
  tasks: any[];
  members: any[];
  onOpenTask: (task: any) => void;
  onMoveTask: (taskId: string, newStatus: string) => void;
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
