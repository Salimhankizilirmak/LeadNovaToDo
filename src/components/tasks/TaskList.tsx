'use client';

import { CheckCircle2, Circle, Calendar, User as UserIcon } from 'lucide-react';
import { Task, Member } from '@/types/task';

/* ── Sabitler ─────────────────────────────────────────────── */
const priorityConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  low: { label: 'Düşük', className: 'text-gray-500 bg-gray-50', dotColor: 'bg-gray-400' },
  medium: { label: 'Orta', className: 'text-amber-700 bg-amber-50', dotColor: 'bg-amber-400' },
  high: { label: 'Yüksek', className: 'text-orange-700 bg-orange-50', dotColor: 'bg-orange-500' },
  critical: { label: 'Kritik', className: 'text-red-700 bg-red-50', dotColor: 'bg-red-500' },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  todo: { label: 'Yapılacak', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'Devam Ediyor', className: 'bg-indigo-50 text-indigo-700' },
  done: { label: 'Tamamlandı', className: 'bg-emerald-50 text-emerald-700' },
};

/* ── Ana Bileşen ───────────────────────────────────────────── */
interface TaskListProps {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onToggleDone: (taskId: string, currentStatus: 'todo' | 'in_progress' | 'done') => void;
}

export default function TaskList({ tasks, onOpenTask, onToggleDone }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-20 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
          <Circle className="w-8 h-8 text-gray-200" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Sonuç Bulunamadı</p>
          <p className="text-xs text-gray-400 mt-1">Kriterlere uygun görev bulunmuyor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/30">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-12 text-center">Durum</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Görev</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">Atanan</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">Öncelik</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden md:table-cell">Bitiş</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tasks.map((task) => {
              const priority = priorityConfig[task.priority] || priorityConfig.medium;
              const status = statusConfig[task.status] || statusConfig.todo;
              const isDone = task.status === 'done';
              const assignee = task.assignee;
              const initials = assignee 
                ? (assignee.display_name || assignee.email || 'U').split('@')[0].substring(0, 2).toUpperCase()
                : null;

              return (
                <tr
                  key={task.id}
                  className="group hover:bg-indigo-50/30 transition-colors cursor-pointer"
                  onClick={() => onOpenTask(task)}
                >
                  {/* Quick Toggle Checkbox */}
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleDone(task.id, task.status);
                      }}
                      className={`flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-200 text-transparent hover:border-emerald-500'
                      }`}
                    >
                      <CheckCircle2 size={14} className={isDone ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 group-hover:text-emerald-500'} />
                    </button>
                  </td>

                  {/* Title */}
                  <td className="px-6 py-4">
                    <p className={`text-sm font-bold text-gray-900 truncate transition-all ${isDone ? 'line-through opacity-40' : ''}`}>
                      {task.title}
                    </p>
                  </td>

                  {/* Assignee */}
                  <td className="px-6 py-4 hidden sm:table-cell">
                    {initials && assignee ? (
                      <div 
                        className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm"
                        title={`${assignee.display_name || 'Kullanıcı'} (${assignee.email})`}
                      >
                        {initials}
                      </div>
                    ) : (
                      <div 
                        className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300"
                        title="Atanmamış"
                      >
                        <UserIcon size={14} />
                      </div>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${priority.dotColor}`} />
                       <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${priority.className}`}>
                         {priority.label}
                       </span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    {task.due_date ? (
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                        <Calendar size={13} className="text-gray-400" />
                        {new Date(task.due_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-[10px]">-</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 text-right">
                    <select
                      value={task.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onToggleDone(task.id, e.target.value as any)}
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border outline-none cursor-pointer transition-all ${
                        task.status === 'todo' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                        task.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}
                    >
                      <option value="todo">YAPILACAK</option>
                      <option value="in_progress">DEVAM EDİYOR</option>
                      <option value="done">TAMAMLANDI</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
