'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Type, AlignLeft, Flag, Save, Trash2, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';

/* ── Props ──────────────────────────────────────────────────── */
interface TaskSlideOverProps {
  task: any | null;
  members: any[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedTask: any) => void;
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync state with task prop
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setDueDate(task.due_date || '');
      setAssigneeId(task.assignee_id || null);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async (specificAssigneeId?: string | null) => {
    // If specificAssigneeId is passed, we update just that (optimistic-ish from outside)
    // but here we'll use it for the immediate update logic if needed.
    setSaving(true);
    try {
      const supabase = createClient();
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
        .select('*, assignee:assignee_id(id, email, display_name)')
        .single();

      if (error) throw error;

      toast.success('Değişiklikler kaydedildi ✓');
      onUpdated(data);
    } catch {
      toast.error('Girişler kaydedilirken bir hata oluştu.');
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
      assignee: selectedMember ? { id: selectedMember.id, email: selectedMember.email, display_name: selectedMember.display_name } : null 
    });

    // Persistent update
    await handleSave(newId);
  };

  const handleDelete = async () => {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      
      if (error) throw error;

      toast.success('Görev silindi');
      onDeleted(task.id);
      onClose();
    } catch {
      toast.error('Görev silinirken bir hata oluştu.');
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
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
              Görev Detayı
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl shadow-sm ring-1 ring-gray-200 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
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
                className="w-full text-lg font-bold text-gray-900 border-0 p-0 focus:ring-0 placeholder-gray-300"
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full text-sm text-gray-600 border border-gray-100 rounded-xl p-4 bg-gray-50/50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none resize-none placeholder-gray-300"
                placeholder="Daha fazla detay ekleyin..."
              />
            </div>

            {/* Assignee Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400">
                <User size={16} />
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
                    {m.display_name || m.email.split('@')[0]}
                  </option>
                ))}
              </select>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Flag size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Öncelik</span>
                </div>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
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
          <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
              title="Görevi Sil"
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 disabled:bg-indigo-300 transition-all"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
