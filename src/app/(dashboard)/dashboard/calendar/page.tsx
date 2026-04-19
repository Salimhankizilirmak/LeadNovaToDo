import { getMyTasksAction } from '@/app/actions/tasks';
import CalendarView from '@/components/calendar/CalendarView';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function CalendarPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const result = await getMyTasksAction();
  const tasks = result.success ? result.tasks : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Planlama Takvimi</h1>
          <p className="text-sm text-gray-500 mt-1">
             Size atanan görevlerin zaman çizelgesi ve teslim tarihleri.
          </p>
        </div>
      </div>

      <CalendarView initialTasks={tasks as any[]} />
    </div>
  );
}
