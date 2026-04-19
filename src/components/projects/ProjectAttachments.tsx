'use client';

import { useState } from 'react';
import { File, Trash2, Download, Paperclip, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { UploadButton } from '@/utils/uploadthing';
import { addProjectAttachmentAction } from '@/app/actions/projects';

interface ProjectAttachmentsProps {
  projectId: string;
  initialAttachments?: any[];
}

export default function ProjectAttachments({ 
  projectId, 
  initialAttachments = [] 
}: ProjectAttachmentsProps) {
  const [attachments, setAttachments] = useState<any[]>(initialAttachments);

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    toast.success('Dosya listeden kaldırıldı.');
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <Paperclip size={18} />
            </div>
            <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Proje Ekleri</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Dosyalar ve Dokümanlar</p>
            </div>
        </div>
        
        <UploadButton
          endpoint="projectAttachment"
          onClientUploadComplete={async (res) => {
            if (res) {
              const file = res[0];
              const result = await addProjectAttachmentAction({
                projectId,
                fileName: file.name,
                fileUrl: file.url,
                fileSize: file.size,
                fileType: file.type
              });
              
              if (result.success && result.attachment) {
                setAttachments(prev => [result.attachment as any, ...prev]);
                toast.success('Dosya başarıyla eklendi.');
              }
            }
          }}
          onUploadError={(error: Error) => {
            toast.error(`Yükleme hatası: ${error.message}`);
          }}
          appearance={{
            button: "flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 h-auto",
            allowedContent: "hidden"
          }}
          content={{
            button({ ready }) {
              return ready ? "YENİ DOSYA" : "HAZIRLANIYOR...";
            }
          }}
        />
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attachments.map((file) => (
            <div key={file.id} className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-indigo-100 bg-gray-50/50 hover:bg-white transition-all">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors">
                        <File size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{file.fileName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {file.fileSize ? (file.fileSize / 1024 / 1024).toFixed(2) : '0'} MB
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <a 
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                        <Download size={16} />
                    </a>
                    <button 
                        onClick={() => handleDelete(file.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            ))}

            {attachments.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-gray-100 rounded-3xl py-12 flex flex-col items-center justify-center gap-3 opacity-40">
                    <Paperclip size={32} className="text-gray-300" />
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Henüz ekip dosyası eklenmemiş.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
