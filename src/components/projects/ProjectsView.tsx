'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen } from 'lucide-react';
import CreateProjectModal from './CreateProjectModal';

interface ProjectsViewProps {
  initialProjects: any[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-emerald-50 text-emerald-700' },
  completed: { label: 'Tamamlandı', className: 'bg-gray-100 text-gray-600' },
  archived: { label: 'Arşivlendi', className: 'bg-amber-50 text-amber-700' },
};

function ProjectCard({ project, onClick }: { project: any; onClick: () => void }) {
  const status = STATUS_CONFIG[project.status as string] ?? STATUS_CONFIG['active'];

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden focus:outline-none"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: project.color }} />
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors leading-snug line-clamp-2">
            {project.name}
          </h3>
          <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: project.color }} />
        </div>
        {project.description ? (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-gray-300 italic">Açıklama eklenmemiş.</p>
        )}
        <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${status.className}`}>
          {status.label}
        </span>
      </div>
    </button>
  );
}

export default function ProjectsView({ initialProjects }: ProjectsViewProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [showModal, setShowModal] = useState(false);

  const handleProjectCreated = (newProject: any) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus size={18} />
          Yeni Proje
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-indigo-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500">Henüz bir proje oluşturmadınız.</p>
            <p className="text-xs text-gray-400 mt-1">Sağ üstteki "+ Yeni Proje" butonuyla başlayın.</p>
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

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </>
  );
}
