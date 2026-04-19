'use client';

import { useState } from 'react';
import { X, Calendar, Type, AlignLeft, Flag, Save, Trash2, Loader2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createClerkClient } from '@/utils/supabase/client';
import { useAuth } from '@clerk/nextjs';

/* ── Tipler ─────────────────────────────────────────────────── */
interface Member {
  id: string;
  email?: string;
  display_name?: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string | null;
  assignee_id: string | null;
  created_by: string;
  org_id: string;
}

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
  const { getToken } = useAuth();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Task['priority']>((task?.priority as Task['priority']) || 'medium');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [assigneeId, setAssigneeId] = useState<string | null>(task?.assignee_id || null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!task) return null;

  const handleSave = async (specificAssigneeId?: string | null) => {
    // If specificAssigneeId is passed, we update just that (optimistic-ish from outside)
    // but here we'll use it for the immediate update logic if needed.
    setSaving(true);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('Oturum anahtarı alınamadı.');
      
      const supabase = createClerkClient(token);
      
      const payload = {
        title,
        description,
        priority,
        due_date: dueDate || null,
        assignee_id: specificAssigneeId !== undefined ? specificAssigneeId : assigneeId,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', task.id)
        .select('*')
        .single();

      if (error) throw error;

      toast.success('Değişiklikler kaydedildi ✓');
      onUpdated(data as Task);
    } catch (err: any) {
      console.error('GÖREV GÜNCELLEME HATASI:', err);
      const errorMessage = err.message || 'Girişler kaydedilirken bir hata oluştu.';
      const detail = err.details ? ` (${err.details})` : '';
      toast.error(`${errorMessage}${detail}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAssigneeChange = async (newId: string | null) => {
    setAssigneeId(newId);
    // Optimistic: notify parent immediately (page.tsx handleUpdateTask will handle the UI)
    // We already have the member info in 'members' prop, so we can mock the assignee object
    const selectedMember = members.find(m => m.id === newId);
    onUpdated({ 
      ...task, 
      assignee_id: newId, 
    } as Task);

    // Persistent update
    await handleSave(newId);
  };

  const handleDelete = async () => {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    
    setDeleting(true);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('Oturum anahtarı alınamadı.');
      
      const supabase = createClerkClient(token);
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      
      if (error) throw error;

      toast.success('Görev silindi');
      onDeleted(task.id);
      onClose();
    } catch (err: any) {
      console.error('GÖREV SİLME HATASI:', err);
      const errorMessage = err.message || 'Görev silinirken bir hata oluştu.';
      const detail = err.details ? ` (${err.details})` : '';
      toast.error(`${errorMessage}${detail}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-over Panel */}
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
            {/* Title Section */}
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

            {/* Description Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400">
                <AlignLeft size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Açıklama</span>
              </div>
              <textarea
                value={description || ''}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full text-sm text-gray-600 border border-gray-100 rounded-xl p-4 bg-gray-50/50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none resize-none placeholder-gray-300"
                placeholder="Daha fazla detay ekleyin..."
              />
            </div>

            {/* Assignee Section */}
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
                    {m.display_name || m.email?.split('@')[0] || m.id.substring(0, 8)}
                  </option>
                ))}
              </select>
            </div>

            {/* Meta Grid */}
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
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 bg-gray-50/80 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100 bg-white"
              title="Görevi Sil"
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
