'use client';

import { useState, useEffect } from 'react';
import { Upload, File, Trash2, Loader2, Download, Paperclip } from 'lucide-react';
import { useSupabase } from '@/hooks/use-supabase';
import { TaskAttachment } from '@/types/task';
import { toast } from 'sonner';

interface TaskAttachmentsProps {
  taskId: string;
}

export default function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const { getSupabase } = useSupabase();
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAttachments();
  }, [taskId]);

  const fetchAttachments = async () => {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (err: any) {
      console.error('Ekler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır.');
      return;
    }

    setUploading(true);
    try {
      const supabase = await getSupabase();
      
      // 1. Storage'a yükle
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${taskId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Veritabanına kaydet
      const { data: userData } = await supabase.auth.getUser();
      const { error: dbError } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: userData.user?.id
        });

      if (dbError) throw dbError;

      toast.success('Dosya başarıyla yüklendi.');
      fetchAttachments();
    } catch (err: any) {
      console.error('Yükleme hatası:', err);
      toast.error('Dosya yüklenirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment: TaskAttachment) => {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.storage
        .from('task_attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Dosya indirilemedi.');
    }
  };

  const handleDelete = async (attachment: TaskAttachment) => {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;

    try {
      const supabase = await getSupabase();
      
      // 1. Veritabanından sil
      const { error: dbError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      // 2. Storage'dan sil
      await supabase.storage
        .from('task_attachments')
        .remove([attachment.file_path]);

      toast.success('Dosya silindi.');
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    } catch (err: any) {
      toast.error('Dosya silinemedi.');
    }
  };

  if (loading) return <div className="animate-pulse flex space-y-2 flex-col"><div className="h-10 bg-gray-100 rounded-xl w-full"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-400">
          <Paperclip size={16} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ek Dosyalar</span>
        </div>
        <label className={`cursor-pointer inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'}`}>
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? 'Yükleniyor...' : 'Ekle'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="space-y-2">
        {attachments.map((file) => (
          <div key={file.id} className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-indigo-100 bg-gray-50/30 hover:bg-white transition-all shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-white rounded-lg border border-gray-100 text-gray-400 group-hover:text-indigo-500 transition-colors">
                <File size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{file.file_name}</p>
                <p className="text-[10px] text-gray-400 font-medium">{(file.file_size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => handleDownload(file)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="İndir"
              >
                <Download size={14} />
              </button>
              <button 
                onClick={() => handleDelete(file)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Sil"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {attachments.length === 0 && !uploading && (
          <div className="border border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-2 opacity-40">
            <Paperclip size={20} className="text-gray-300" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dosya Yok</span>
          </div>
        )}
      </div>
    </div>
  );
}
