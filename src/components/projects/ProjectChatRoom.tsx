'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, User, MessageSquare } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { sendMessageAction, getMessagesAction } from '@/app/actions/chat';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ProjectChatRoomProps {
  projectId: string;
}

export default function ProjectChatRoom({ projectId }: ProjectChatRoomProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    setIsLoading(true);
    const result = await getMessagesAction(projectId);
    if (result.success) {
      setMessages(result.messages || []);
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = newMessage;
    setNewMessage('');

    const result = await sendMessageAction(projectId, msg);
    if (result.success) {
      // Mesajları tekrar çekelim veya manuel ekleyelim
      loadMessages();
    } else {
      toast.error('Mesaj gönderilemedi.');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
          <MessageSquare size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Proje Sohbet Odası</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ekip İçi İletişim</p>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30"
      >
        {messages.map((msg) => {
          const isMe = msg.userId === user?.id;
          return (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black ${isMe ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-100 text-gray-400'}`}>
                {msg.user?.avatarUrl ? (
                  <img src={msg.user.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                ) : (
                  <User size={14} />
                )}
              </div>
              <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end' : ''}`}>
                <div className={`p-3 rounded-2xl text-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-200' 
                    : 'bg-white text-gray-700 rounded-tl-none border border-gray-100 shadow-sm'
                }`}>
                  {msg.message}
                </div>
                <div className={`flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span>{msg.user?.fullName?.split(' ')[0] || 'Kullanıcı'}</span>
                  <span className="w-1 h-1 bg-gray-200 rounded-full" />
                  <span className="text-indigo-400">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: tr })}
                  </span>
                  <span className="opacity-50">
                    ({new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })})
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
            <MessageSquare size={48} className="text-gray-300" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Henüz mesaj yok.<br/>İlk mesajı siz gönderin!</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-50 flex items-center gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Bir mesaj yazın..."
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
        />
        <button
          type="submit"
          className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
