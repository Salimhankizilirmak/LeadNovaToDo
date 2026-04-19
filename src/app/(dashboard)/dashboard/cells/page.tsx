import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCellsAction } from '@/app/actions/projects';
import CellsView from '@/components/cells/CellsView';

export default async function CellsPage() {
  const { userId, orgId } = await auth();
  
  if (!userId) redirect('/sign-in');
  if (!orgId) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-xl font-bold text-gray-900">Organizasyon Seçilmedi</h1>
        <p className="text-gray-500 mt-2">Hücre sistemini kullanmak için bir organizasyona dahil olmalısınız.</p>
      </div>
    );
  }

  const result = await getCellsAction();
  const cellsData = result.success ? result.cells : [];

  return (
    <CellsView initialCells={cellsData as any[]} />
  );
}
