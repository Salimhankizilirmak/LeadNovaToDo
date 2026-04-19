import { Plus, FolderOpen } from 'lucide-react';
import { getProjectsAction } from '@/app/actions/projects';
import ProjectsView from '@/components/projects/ProjectsView';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const result = await getProjectsAction();
  const projects = result.success ? result.projects : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Projeler
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {projects && projects.length > 0
              ? `${projects.length} proje bulundu.`
              : 'Henüz proje oluşturmadınız.'}
          </p>
        </div>
      </div>

      <ProjectsView initialProjects={projects as any[]} />
    </div>
  );
}
