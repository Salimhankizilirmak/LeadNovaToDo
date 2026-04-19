'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Lightbulb,
  AlertTriangle,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useSupabase } from '@/hooks/use-supabase';

/* ── Tipler ─────────────────────────────────────────────────── */
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ProjectContext {
  name: string;
  tasks: { title: string; status: string }[];
}

/* ── Hızlı Aksiyon Çipleri ──────────────────────────────────── */
const QUICK_ACTIONS = [
  { id: 'analyze', label: 'Projeyi Analiz Et', icon: <Zap size={14} />, prompt: 'Bu projenin genel durumunu analiz et ve özetle.' },
  { id: 'risks', label: 'Riskleri Göster', icon: <AlertTriangle size={14} />, prompt: 'Bu projedeki potansiyel riskleri ve gecikme ihtimalleri olan işleri bul.' },
  { id: 'suggest', label: 'Görev Öner', icon: <Lightbulb size={14} />, prompt: 'Bu projenin ilerlemesi için 3 tane yeni ve mantıklı alt görev öner.' },
];

export default function AIAssistantWidget({ projectId }: { projectId?: string }) {
  const { getSupabase } = useSupabase();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Merhaba! Ben LeadNova AI. Sana projelerin ve görevlerin konusunda nasıl yardımcı olabilirim?' }
  ]);
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<ProjectContext | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Otomatik scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Proje verisini arka planda çek (Context için)
  useEffect(() => {
    if (isOpen && projectId) {
      const fetchContext = async () => {
        try {
          const supabase = await getSupabase();
          
          const { data: tasks } = await supabase
            .from('tasks')
            .select('title, status')
            .eq('project_id', projectId);
          
          const { data: project } = await supabase
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single();

          if (project && tasks) {
            setProjectData({ name: project.name, tasks });
          }
        } catch (error) {
          console.error("AI Context load error:", error);
        }
      };
      fetchContext();
    }
  }, [projectId, isOpen, getSupabase]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          contextData: projectData // Mevcut proje bağlamını gönder
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages([...newMessages, { role: 'assistant', content: data.text }]);
    } catch {
      toast.error('AI yanıt verirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <Sparkles size={24} className="group-hover:animate-pulse" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-bounce" />
      </button>

      {/* Slide-over Chat Panel */}
      <div
        className={`fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 z-50 w-full sm:max-w-[400px] h-[85vh] sm:h-full bg-white shadow-2xl transition-transform duration-500 ease-in-out transform rounded-t-[2.5rem] sm:rounded-t-none ${
          isOpen 
            ? 'translate-y-0 sm:translate-x-0' 
            : 'translate-y-full sm:translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full ring-1 ring-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-indigo-600 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 flex-shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-black tracking-tight leading-tight truncate">LeadNova AI</h2>
                <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                   Aktif
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 sm:p-2.5 hover:bg-white/10 rounded-xl transition-colors outline-none flex-shrink-0 border border-white/20"
            >
              <X size={22} />
            </button>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-gray-50/50 scroll-smooth"
          >
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  m.role === 'user' 
                    ? 'bg-white border-gray-100 text-gray-400' 
                    : 'bg-indigo-600 border-indigo-500 text-white'
                }`}>
                  {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  <div className="prose prose-sm prose-p:leading-relaxed prose-li:my-1 prose-strong:font-black">
                    <ReactMarkdown>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-100" />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-5 sm:p-6 bg-white border-t border-gray-100 space-y-4 flex-shrink-0">
            {/* Quick Actions */}
            <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar -mx-1 px-1">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleSendMessage(action.prompt)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-500 hover:border-indigo-200 hover:text-indigo-600 transition-all whitespace-nowrap active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
              className="relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Bir şeyler sor..."
                disabled={loading}
                className="w-full pl-4 pr-14 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all placeholder:text-gray-300 shadow-inner"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-200 transition-all active:scale-90 shadow-lg shadow-indigo-500/20"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
