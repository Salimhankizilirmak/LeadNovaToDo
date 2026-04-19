'use client';

import { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
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

export default function CalendarView({ initialTasks }: { initialTasks: any[] }) {
  // Map tasks to RBC events
  const events = useMemo(() => {
    return initialTasks.map((task) => {
      const start = new Date(task.createdAt);
      let end = task.dueDate ? new Date(task.dueDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
      
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
  }, [initialTasks]);

  const eventStyleGetter = (event: any) => {
    const task = event.resource;
    const color = task.project?.color || '#6366f1';
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-4 sm:p-8 min-h-[700px]">
        <style>{`
          .rbc-calendar { font-family: inherit; }
          .rbc-header { padding: 12px; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; color: #9ca3af; border-bottom: 2px solid #f9fafb !important; }
          .rbc-month-view { border-radius: 24px; overflow: hidden; border: 1px solid #f3f4f6 !important; }
          .rbc-today { background-color: #f5f3ff !important; }
          .rbc-toolbar button { border-radius: 10px; font-weight: 700; font-size: 13px; color: #4b5563; border: 1px solid #e5e7eb; transition: all 0.2s; }
          .rbc-toolbar button.rbc-active { background-color: #4f46e5 !important; color: white !important; }
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

      <div className="flex flex-wrap items-center gap-6 px-4">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-xs font-bold text-gray-500">Normal Görev</span>
         </div>
         <div className="flex items-center gap-2 text-gray-400">
            <Info size={14} />
            <span className="text-[11px] font-medium italic">Görevler projenin renk şemasına göre renklendirilir.</span>
         </div>
      </div>
    </div>
  );
}
