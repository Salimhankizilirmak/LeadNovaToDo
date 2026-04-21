'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { 
  Sparkles, 
  X, 
  Bot, 
  User, 
  Loader2, 
  Zap,
  ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useUser } from '@clerk/nextjs';

import { DefaultChatTransport } from 'ai';

export default function AIAssistantWidget() {
  const { user, isLoaded } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
    messages: [
      { 
        id: 'welcome', 
        role: 'assistant', 
        parts: [{ type: 'text', text: 'Sayın Yöneticim, LeadNova Kurumsal Yapay Zeka Danışmanınız olarak hizmetinizdeyim. Organizasyonunuzun genel durumu, projeler ve departman verileri hakkında rapor sunmamı ister misiniz?' }]
      } as any
    ]
  });


  const [input, setInput] = useState('');
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  const isLoading = status === 'submitted' || status === 'streaming';


  const role = user?.publicMetadata?.role as string;
  const isAuthorized = ['Patron', 'Genel Müdür', 'Admin', 'Proje Yöneticisi', 'Vardiya Amiri'].includes(role);

  // Otomatik scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isLoaded || !isAuthorized) return null;

  return (
    <>
      {/* Floating Action Button (FAB) - Premium Style */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-2xl bg-[#111827] text-white shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-105 active:scale-95 group border border-gray-700/50 ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <Sparkles size={28} className="relative z-10 group-hover:text-indigo-400 transition-colors" />
      </button>

      {/* Floating Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[90vw] sm:w-[400px] max-h-[70vh] bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform origin-bottom-right border border-gray-100 overflow-hidden flex flex-col rounded-[2rem] ${
          isOpen 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-75 opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        {/* Header - Premium Dark */}
        <div className="px-6 py-5 bg-[#111827] text-white flex items-center justify-between flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent)]" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-gray-600">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight flex items-center gap-2">
                DANIŞMAN AI
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Kurumsal Asistan</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all border border-white/5 relative z-10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scroll-smooth min-h-[300px]"
        >
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-1 ${
                m.role === 'user' 
                  ? 'bg-gray-50 border-gray-100 text-gray-400' 
                  : 'bg-[#111827] border-gray-800 text-white shadow-lg shadow-gray-900/10'
              }`}>
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-[#111827] text-white rounded-tr-none' 
                  : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none font-medium'
              }`}>
                <div className="prose prose-sm prose-p:leading-relaxed prose-strong:text-inherit">
                  <ReactMarkdown>
                    {m.parts
                      ? m.parts
                          .filter((p: any) => p.type === 'text')
                          .map((p: any) => p.text)
                          .join('')
                      : ''}
                  </ReactMarkdown>
                </div>

              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#111827] flex items-center justify-center">
                <Loader2 size={14} className="animate-spin text-white" />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-50 flex-shrink-0">
          <form 
            onSubmit={handleSubmit}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Yöneticim, size nasıl yardımcı olabilirim?"
              className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all font-medium placeholder:text-gray-400"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 flex items-center justify-center bg-[#111827] text-white rounded-xl shadow-lg shadow-gray-900/10 hover:scale-105 active:scale-95 transition-all disabled:bg-gray-200 disabled:shadow-none"
            >
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="mt-3 flex justify-center">
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">LeadNova AI Assistant</span>
          </div>
        </div>
      </div>
    </>
  );
}
