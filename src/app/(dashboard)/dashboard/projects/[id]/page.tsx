import { getProjectAction } from '@/app/actions/projects';
import { getOrgProfiles } from '@/app/actions/users';
import ProjectDetailView from '@/components/projects/ProjectDetailView';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Proje Detay Sayfası (Server Component)
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  // 1. Veriyi Drizzle üzerinden çek (Manual RLS içerir)
  const projectResp = await getProjectAction(id);

  if (!projectResp.success || !projectResp.project) {
    return notFound();
  }

  const project = projectResp.project;

  // 2. Organizasyon üyelerini çek (Görev ataması için)
  const profilesResp = await getOrgProfiles(project.orgId);
  const members = (profilesResp.success && profilesResp.profiles) ? profilesResp.profiles.map((p: any) => ({
    id: p.id,
    full_name: p.fullName,
    display_name: p.fullName,
    role: p.role,
    avatar_url: p.avatarUrl
  })) : [];

  return (
    <ProjectDetailView 
      initialProject={project}
      initialTasks={project.tasks || []}
      members={members}
    />
  );
}
