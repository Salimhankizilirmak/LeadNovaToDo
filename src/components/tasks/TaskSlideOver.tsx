import { useState, useEffect } from 'react';
import { X, Calendar, Type, AlignLeft, Flag, Save, Trash2, Loader2, User as UserIcon, History, ArrowRight, AlertCircle, Paperclip, Edit3, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Task, Member } from '@/types/task';
import TaskAttachments from './TaskAttachments';
import { updateTaskDetailsAction, getTaskHistoryAction } from '@/app/actions/tasks';
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
      const result = await updateTaskDetailsAction(task.id, {
        title,
        description,
        priority,
        dueDate: dueDate || null,
        assigneeId: specificAssigneeId !== undefined ? specificAssigneeId : assigneeId
      });
      
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

            {/* Görev Geçmişi (Audit Logs) Section - Dark Premium Timeline */}
            <div className="pt-8 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-900">
                  <History size={16} className="text-indigo-600" />
                  <span className="text-xs font-black tracking-widest uppercase">Operasyon Günlüğü</span>
                </div>
                {loadingHistory && <Loader2 size={12} className="animate-spin text-indigo-500" />}
              </div>

              <div className="p-4 rounded-3xl bg-[#0a0a0b] shadow-inner border border-gray-800 space-y-4 relative before:absolute before:left-[35px] before:top-8 before:bottom-8 before:w-[2px] before:bg-gradient-to-b before:from-indigo-500/20 before:via-blue-500/10 before:to-transparent overflow-hidden">
                {/* Subtle dark glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />

                {history.length > 0 ? history.map((log, idx) => {
                  let Icon = History;
                  let iconColor = "text-gray-400";
                  let message = <><span className="text-indigo-400 font-bold">@{log.user?.fullName.split(' ')[0]}</span> bir işlem yaptı.</>;

                  switch (log.actionType) {
                    case 'status_change':
                      Icon = ArrowRight; iconColor = "text-emerald-400";
                      message = <><span className="text-indigo-400 font-bold">@{log.user?.fullName.split(' ')[0]}</span> durumu <span className="text-gray-500 line-through mx-1">{getStatusLabel(log.oldStatus)}</span> <ArrowRight size={10} className="inline mx-0.5 text-gray-600" /> <span className="text-emerald-400 font-bold tracking-wide">{getStatusLabel(log.newStatus)}</span> yaptı.</>;
                      break;
                    case 'priority_change':
                      Icon = AlertCircle; iconColor = "text-amber-400";
                      message = <><span className="text-indigo-400 font-bold">@{log.user?.fullName.split(' ')[0]}</span> önceliği <span className="text-amber-400 font-bold">{log.newStatus}</span> olarak ayarladı.</>;
                      break;
                    case 'assignee_change':
                      Icon = UserIcon; iconColor = "text-blue-400";
                      message = <><span className="text-indigo-400 font-bold">@{log.user?.fullName.split(' ')[0]}</span> sorumlu personeli güncelledi.</>;
                      break;
                    case 'attachment_added':
                      Icon = Paperclip; iconColor = "text-pink-400";
                      message = <><span className="text-indigo-400 font-bold">@{log.user?.fullName.split(' ')[0]}</span> dosya ekledi: <span className="text-gray-300 ml-1">{log.details?.replace('Dosya yüklendi: ', '')}</span></>;
                      break;
                    case 'update_details':
                      Icon = Edit3; iconColor = "text-indigo-400";
                      message = <><span className="text-indigo-400 font-bold">@{log.user?.fullName.split(' ')[0]}</span> görev detaylarını düzenledi.</>;
                      break;
                  }

                  return (
                    <div key={log.id} className="relative z-10 pl-14 animate-in fade-in slide-in-from-left-2 transition-all duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="absolute left-3 top-1 w-8 h-8 rounded-xl bg-[#111] border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center z-10 hover:scale-110 hover:border-indigo-500/50 transition-all">
                          <Icon size={14} className={iconColor} />
                      </div>
                      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/5 hover:bg-white/10 shadow-lg transition-all group">
                          <p className="text-xs text-gray-200 leading-normal group-hover:text-white transition-colors duration-300">
                              {message}
                          </p>
                          <p className="text-[9px] text-gray-500 font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                              {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: tr }) : ''}
                              <span className="w-1 h-1 rounded-full bg-gray-700" />
                              {log.createdAt ? format(new Date(log.createdAt), 'HH:mm', { locale: tr }) : ''}
                          </p>
                      </div>
                    </div>
                  );
                }) : !loadingHistory && (
                  <div className="p-4 text-center">
                      <History className="w-8 h-8 text-gray-800 mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-gray-500 italic">Karanlıkta yalnız. Henüz kayıt yok.</p>
                  </div>
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

