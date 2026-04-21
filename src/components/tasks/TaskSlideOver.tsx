import { useState, useEffect } from 'react';
import { X, Calendar, Type, AlignLeft, Flag, Save, Trash2, Loader2, User as UserIcon, History } from 'lucide-react';
import { toast } from 'sonner';
import { Task, Member } from '@/types/task';
import TaskAttachments from './TaskAttachments';
import { updateTaskStatusAction, getTaskHistoryAction } from '@/app/actions/tasks';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';

/* ── Props ──────────────────────────────────────────────────── */
interface TaskSlideOverProps {
  task: Task | null;
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedTask: Task) => void;
  onDeleted: (taskId: string) => void;
}

export default function TaskSlideOver({
  task,
  members,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: TaskSlideOverProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Task['priority']>((task?.priority as Task['priority']) || 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.substring(0, 10) : '');
  const [assigneeId, setAssigneeId] = useState<string | null>(task?.assigneeId || null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Görev değiştiğinde (veya açıldığında) geçmişi yükle
  useEffect(() => {
    async function loadHistory() {
      if (!task?.id) return;
      setLoadingHistory(true);
      const res = await getTaskHistoryAction(task.id);
      if (res.success && res.history) {
        setHistory(res.history);
      }
      setLoadingHistory(false);
    }

    if (isOpen && task?.id) {
        loadHistory();
        // Reset local states
        setTitle(task.title || '');
        setDescription(task.description || '');
        setPriority((task.priority as Task['priority']) || 'medium');
        setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
        setAssigneeId(task.assigneeId || null);
    }
  }, [task?.id, isOpen]);

  if (!task) return null;

  const getStatusLabel = (status: string) => {
    switch (status) {
        case 'todo': return 'Yapılacak';
        case 'in_progress': return 'Devam Ediyor';
        case 'review': return 'İncelemede';
        case 'done': return 'Tamamlandı';
        default: return status;
    }
  };

  const handleSave = async (specificAssigneeId?: string | null) => {
    setSaving(true);
    try {
      const result = await updateTaskStatusAction(task.id, task.status);
      
      if (!result.success) throw new Error(result.error);

      toast.success('Değişiklikler kaydedildi ✓');
      onUpdated({
        ...task,
        title,
        description,
        priority,
        dueDate: dueDate || null,
        assigneeId: specificAssigneeId !== undefined ? specificAssigneeId : assigneeId,
      } as Task);
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssigneeChange = async (newId: string | null) => {
    setAssigneeId(newId);
    onUpdated({ 
      ...task, 
      assigneeId: newId, 
    } as Task);
    await handleSave(newId);
  };

  const handleDelete = async () => {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    onDeleted(task.id);
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[400px] bg-white shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-widest">
              Görev Detayı
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl shadow-sm ring-1 ring-gray-200 transition-all flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400">
                <Type size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Başlık</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg font-bold text-gray-900 border-0 p-0 focus:ring-0 placeholder-gray-300 bg-transparent"
                placeholder="Görev Başlığı..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400">
                <AlignLeft size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Açıklama</span>
              </div>
              <textarea
                value={description || ''}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full text-sm text-gray-600 border border-gray-100 rounded-xl p-4 bg-gray-50/50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none resize-none placeholder-gray-300"
                placeholder="Daha fazla detay ekleyin..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400">
                <UserIcon size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Atanan Kişi</span>
              </div>
              <select
                value={assigneeId || ''}
                onChange={(e) => handleAssigneeChange(e.target.value || null)}
                className="w-full text-xs font-bold p-3 border border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:border-indigo-400 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">Atanmamış</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name || m.full_name || m.email?.split('@')[0]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Flag size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Öncelik</span>
                </div>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Task['priority'])}
                  className="w-full text-xs font-bold p-3 border border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:border-indigo-400 transition-all outline-none appearance-none"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="critical">Kritik</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Bitiş Tarihi</span>
                </div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs font-bold p-3 border border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:border-indigo-400 transition-all outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50">
               <TaskAttachments taskId={task.id} initialAttachments={task.attachments} />
            </div>

            {/* Görev Geçmişi (Audit Logs) Section */}
            <div className="pt-8 border-t border-gray-50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <History size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Görev Geçmişi</span>
                </div>
                {loadingHistory && <Loader2 size={12} className="animate-spin text-indigo-500" />}
              </div>

              <div className="space-y-4 relative before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
                {history.length > 0 ? history.map((log, idx) => (
                  <div key={log.id} className="relative pl-7 animate-in fade-in slide-in-from-left-2 transition-all duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="absolute left-0 top-1.5 w-[19px] h-[19px] rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    </div>
                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-50 hover:bg-white hover:border-indigo-100 transition-all">
                        <p className="text-xs font-bold text-gray-900 leading-normal">
                            <span className="text-indigo-600">@{log.user?.fullName.split(' ')[0]}</span>, 
                            durumu <span className="text-gray-400 line-through mx-1">{getStatusLabel(log.oldStatus)}</span> 
                            dan <span className="text-emerald-600 font-black">{getStatusLabel(log.newStatus)}</span> durumuna çekti.
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-tighter">
                            {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: tr }) : ''}
                            <span className="mx-1">•</span>
                            {log.createdAt ? format(new Date(log.createdAt), 'HH:mm', { locale: tr }) : ''}
                        </p>
                    </div>
                  </div>
                )) : !loadingHistory && (
                  <p className="text-[10px] text-gray-400 italic px-2">Henüz bir hareket kaydı bulunmuyor.</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-gray-50/80 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100 bg-white"
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 disabled:bg-indigo-300 transition-all active:scale-95"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

