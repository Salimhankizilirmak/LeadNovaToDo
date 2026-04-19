'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { useSupabase } from '@/hooks/use-supabase';
import CreateProjectModal, {
  type Project,
} from '@/components/projects/CreateProjectModal';

/* ── Sabitler ─────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-emerald-50 text-emerald-700' },
  completed: { label: 'Tamamlandı', className: 'bg-gray-100 text-gray-600' },
  archived: { label: 'Arşivlendi', className: 'bg-amber-50 text-amber-700' },
};

/* ── Skeleton ────────────────────────────────────────────── */
function ProjectsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded-xl w-36" />
        <div className="h-10 bg-gray-200 rounded-xl w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 h-40">
            <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
            <div className="h-4 bg-gray-100 rounded-lg w-full" />
            <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
            <div className="h-6 bg-gray-100 rounded-full w-16 mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Proje Kartı ─────────────────────────────────────────── */
function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  const status =
    STATUS_CONFIG[project.status] ?? STATUS_CONFIG['active'];

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
    >
      {/* Renkli üst şerit */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: project.color }}
      />

      <div className="p-5 space-y-3">
        {/* Başlık */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors leading-snug line-clamp-2">
            {project.name}
          </h3>
          <div
            className="w-3 h-3 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: project.color }}
          />
        </div>

        {/* Açıklama */}
        {project.description ? (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-gray-300 italic">Açıklama eklenmemiş.</p>
        )}

        {/* Durum Badge */}
        <span
          className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${status.className}`}
        >
          {status.label}
        </span>
      </div>
    </button>
  );
}

/* ── Ana Sayfa ───────────────────────────────────────────── */
export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { getSupabase } = useSupabase();
  const userId = user?.id ?? null;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchProjects = async () => {
      setLoading(true);
      try {
        const supabase = await getSupabase();
        
        // Kullanıcının org_id'sini bul
        const { data: memberRow } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', userId)
          .limit(1)
          .single();

        if (!memberRow?.org_id) {
          setProjects([]);
          return;
        }

        // O org'a ait projeleri getir
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, description, color, status, org_id, created_by, created_at')
          .eq('org_id', memberRow.org_id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setProjects((data as Project[]) ?? []);
      } catch {
        toast.error('Projeler yüklenirken bir sorun oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userId, getSupabase]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  if (loading) return <ProjectsSkeleton />;

  return (
    <>
      <div className="space-y-6">
        {/* Sayfa Başlığı */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Projeler
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {projects.length > 0
                ? `${projects.length} proje bulundu.`
                : 'Henüz proje oluşturmadınız.'}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
          >
            <Plus size={18} />
            Yeni Proje
          </button>
        </div>

        {/* İçerik */}
        {projects.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-indigo-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-500">
                Henüz bir proje oluşturmadınız.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Sağ üstteki &quot;+ Yeni Proje&quot; butonuyla başlayın.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
            >
              <Plus size={16} />
              İlk Projeyi Oluştur
            </button>
          </div>
        ) : (
          /* Proje Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </>
  );
}
