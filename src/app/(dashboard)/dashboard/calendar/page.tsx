'use client';

import { useEffect, useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useUser } from '@clerk/nextjs';
import { useSupabase } from '@/hooks/use-supabase';
import { Loader2, Calendar as CalendarIcon, Info } from 'lucide-react';
import { Task } from '@/types/task';

// date-fns localizer setup
const locales = {
  'tr-TR': tr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

/* ── Calendar Page ────────────────────────────────────────── */
export default function CalendarPage() {
  const { user } = useUser();
  const { getSupabase } = useSupabase();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMyTasks = async () => {
      setLoading(true);
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from('tasks')
          .select('*, project:projects(name, color)')
          .eq('assignee_id', user.id);

        if (error) throw error;
        setTasks(data || []);
      } catch (err) {
        console.error('Takvim Veri Yükleme Hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [user, getSupabase]);

  // Map tasks to RBC events
  const events = useMemo(() => {
    return tasks.map((task) => {
      const start = new Date(task.created_at);
      // Eğer bitiş tarihi yoksa, 2 saatlik bir blok gösterelim. 
      // Varsa, o günü kapsayacak şekilde ayarla.
      let end = task.due_date ? new Date(task.due_date) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
      
      // Eğer bitiş tarihi başlangıçtan önceyse (hatalı veri), başlangıca 1 gün ekle.
      if (end < start) {
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      }

      return {
        id: task.id,
        title: task.title,
        start,
        end,
        resource: task,
      };
    });
  }, [tasks]);

  const eventStyleGetter = (event: any) => {
    const task = event.resource as Task;
    const color = task.project?.color || '#6366f1';
    
    // Done durumu için şeffaflık ve çizgi
    const isDone = task.status === 'done';
    
    return {
      style: {
        backgroundColor: isDone ? '#f3f4f6' : color,
        borderRadius: '8px',
        opacity: isDone ? 0.6 : 1,
        color: isDone ? '#9ca3af' : 'white',
        border: 'none',
        display: 'block',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '2px 8px',
        textDecoration: isDone ? 'line-through' : 'none',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      },
    };
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium text-gray-400">Takvim Planı Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Planlama Takvimi</h1>
          <p className="text-sm text-gray-500 mt-1">
             Size atanan görevlerin zaman çizelgesi ve teslim tarihleri.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
          <CalendarIcon size={18} className="text-indigo-600" />
          <span className="text-sm font-bold text-indigo-700">
            {tasks.length} Aktif Görev
          </span>
        </div>
      </div>

      {/* Calendar Area */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-4 sm:p-8 min-h-[700px]">
        <style>{`
          .rbc-calendar { font-family: inherit; }
          .rbc-header { padding: 12px; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; color: #9ca3af; border-bottom: 2px solid #f9fafb !important; }
          .rbc-month-view { border-radius: 24px; overflow: hidden; border: 1px solid #f3f4f6 !important; }
          .rbc-day-bg { transition: background-color 0.2s; }
          .rbc-day-bg:hover { background-color: #f9fafb; }
          .rbc-today { background-color: #f5f3ff !important; }
          .rbc-off-range-bg { background-color: #fafafa !important; opacity: 0.5; }
          .rbc-event { padding: 0 !important; margin-bottom: 2px !important; }
          .rbc-show-more { font-weight: 800; font-size: 10px; color: #6366f1; }
          .rbc-toolbar button { border-radius: 10px; font-weight: 700; font-size: 13px; color: #4b5563; border: 1px solid #e5e7eb; transition: all 0.2s; }
          .rbc-toolbar button:hover { background-color: #f9fafb; color: #111827; }
          .rbc-toolbar button.rbc-active { background-color: #4f46e5 !important; color: white !important; border-color: #4f46e5 !important; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }
          .rbc-toolbar-label { font-weight: 900; font-size: 18px; color: #111827; }
        `}</style>
        
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          culture="tr-TR"
          messages={{
            next: "İleri",
            previous: "Geri",
            today: "Bugün",
            month: "Ay",
            week: "Hafta",
            day: "Gün",
            agenda: "Ajanda",
            date: "Tarih",
            time: "Saat",
            event: "Görev",
            noEventsInRange: "Bu dönemde görev bulunmuyor.",
            showMore: (total) => `+${total} görev daha`
          }}
          views={['month', 'week', 'day', 'agenda']}
          defaultView={Views.MONTH}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 px-4">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-xs font-bold text-gray-500">Normal Görev</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <span className="text-xs font-bold text-gray-500">Tamamlandı (Silik/Çizili)</span>
         </div>
         <div className="flex items-center gap-2 text-gray-400">
            <Info size={14} />
            <span className="text-[11px] font-medium italic">Görev çubukları, oluşturulma tarihinden bitiş tarihine kadar olan süreci kapsar.</span>
         </div>
      </div>
    </div>
  );
}
