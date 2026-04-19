'use client';

import { Trophy, User, Target } from 'lucide-react';

interface LeaderboardProps {
  data: any[];
}

export default function Leaderboard({ data }: LeaderboardProps) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Haftalık Puantaj</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">En Çok Görev Tamamlayanlar</p>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
          <Trophy size={20} />
        </div>
      </div>

      <div className="space-y-6">
        {data.map((item, index) => (
          <div key={item.userId} className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${
                  index === 0 ? 'bg-amber-100 text-amber-600' : 
                  index === 1 ? 'bg-slate-100 text-slate-500' : 
                  index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'
                }`}>
                   {item.avatarUrl ? (
                     <img src={item.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                   ) : (
                     <User size={18} />
                   )}
                </div>
                {index < 3 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full border border-gray-100 shadow-sm flex items-center justify-center text-[10px] font-black">
                    {index + 1}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{item.fullName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Personel</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-indigo-600">
                <Target size={14} />
                <span className="text-sm font-black tabular-nums">{item.completedCount}</span>
              </div>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Görev</span>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-30">
            <Target size={32} className="text-gray-300" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Henüz bu hafta görev<br/>tamamlanmadı.</p>
          </div>
        )}
      </div>

      <div className="mt-10 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
        <p className="text-[10px] text-indigo-600 font-bold leading-relaxed">
          Pazartesi sabahı vardiya başlangıcından itibaren hesaplanan verilerdir.
        </p>
      </div>
    </div>
  );
}
