'use client';

import { useState } from 'react';
import { File, Trash2, Download, Paperclip } from 'lucide-react';
import { TaskAttachment } from '@/types/task';
import { toast } from 'sonner';
import { UploadButton } from '@/utils/uploadthing';
import { addTaskAttachmentAction } from '@/app/actions/tasks';

interface TaskAttachmentsProps {
  taskId: string;
  initialAttachments?: TaskAttachment[];
}

export default function TaskAttachments({ 
  taskId, 
  initialAttachments = [] 
}: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>(initialAttachments);

  const handleDelete = async (attachment: TaskAttachment) => {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
    
    // SQLite'da silme işlemini yapacak aksiyonu henüz yazmadık, 
    // şimdilik sadece UI'dan kaldıralım veya aksiyonu ekleyelim.
    setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    toast.success('Dosya listeden kaldırıldı.');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-400">
          <Paperclip size={16} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ek Dosyalar</span>
        </div>
        
        {/* UploadThing Butonu */}
        <UploadButton
          endpoint="taskAttachment"
          onClientUploadComplete={async (res) => {
            if (res) {
              const file = res[0];
              const result = await addTaskAttachmentAction(
                taskId,
                file.name,
                file.url,
                file.size,
                file.type
              );
              
              if (result.success && result.attachment) {
                setAttachments(prev => [result.attachment as any, ...prev]);
                toast.success('Dosya yüklendi ve göreve eklendi.');
              }
            }
          }}
          onUploadError={(error: Error) => {
            toast.error(`Yükleme hatası: ${error.message}`);
          }}
          appearance={{
            button: "text-[10px] font-black uppercase tracking-widest bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all h-auto",
            allowedContent: "hidden"
          }}
          content={{
            button({ ready }) {
              if (ready) return "DOSYA EKLE";
              return "HAZIRLANIYOR...";
            }
          }}
        />
      </div>

      <div className="space-y-2">
        {attachments.map((file) => (
          <div key={file.id} className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-indigo-100 bg-gray-50/30 hover:bg-white transition-all shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-white rounded-lg border border-gray-100 text-gray-400 group-hover:text-indigo-500 transition-colors">
                <File size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{file.fileName}</p>
                <p className="text-[10px] text-gray-400 font-medium">
                  {file.fileSize ? (file.fileSize / 1024).toFixed(1) : '0'} KB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <a 
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="İndir / Görüntüle"
              >
                <Download size={14} />
              </a>
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

        {attachments.length === 0 && (
          <div className="border border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-2 opacity-40">
            <Paperclip size={20} className="text-gray-300" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dosya Yok</span>
          </div>
        )}
      </div>
    </div>
  );
}
