import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, FolderKanban, MapPin, ShieldCheck, Download, Edit, Trash2, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { ProjectModal } from '../../components/modals/ProjectModal';
import { projectsApi } from '../../api/projects';
import { buildersApi } from '../../api/builders';
import { Project, ProjectCreateInput } from '../../types/project';
import { Builder } from '../../types/builder';

export const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    try {
      const data = await projectsApi.getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    buildersApi.getBuilders().then(setBuilders).catch(console.error);
  }, []);

  const handleCreateOrUpdateProject = async (data: ProjectCreateInput) => {
    if (editingProject) {
      await projectsApi.updateProject(editingProject.id, data);
    } else {
      await projectsApi.createProject(data);
    }
    fetchProjects();
  };

  const handleDeleteProject = async (id: number) => {
    if (confirm('Delete this project?')) {
      await projectsApi.deleteProject(id);
      fetchProjects();
    }
  };

  const statusVariant: Record<string, 'emerald' | 'blue' | 'purple' | 'rose'> = {
    'Under Construction': 'blue',
    'Ready to Move': 'emerald',
    'New Launch': 'purple',
    'Sold Out': 'rose',
  };

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: 'name',
      header: 'Project & Builder',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-white">{row.original.name}</p>
            <p className="text-slate-400 text-xs flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {row.original.builder_name}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Location & Config',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-200">{row.original.location}</p>
          <p className="text-slate-400 text-[11px]">{row.original.configuration}</p>
        </div>
      ),
    },
    {
      accessorKey: 'min_price',
      header: 'Price Range',
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-400 text-xs">
          ₹{row.original.min_price}L - ₹{row.original.max_price}L
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] || 'blue'}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'rera_id',
      header: 'RERA Number',
      cell: ({ row }) => (
        <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          {row.original.rera_id || 'N/A'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setEditingProject(row.original);
              setIsModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteProject(row.original.id)}
            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Project Portfolio</h1>
          <p className="text-xs text-slate-400 mt-1">Real estate developments, pricing tiers & RERA compliance</p>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
        >
          Add New Project
        </Button>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {projects.map((project) => (
          <Card key={project.id} glow className="space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <Badge variant={statusVariant[project.status] || 'blue'}>{project.status}</Badge>
                {project.rera_id && (
                  <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md font-mono border border-blue-500/20">
                    RERA: {project.rera_id}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-white text-base mt-2.5">{project.name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3 text-purple-400" /> {project.builder_name}
              </p>

              <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>{project.location}</span>
                </p>
                <p className="font-semibold text-emerald-400 text-sm">
                  ₹{project.min_price}L - ₹{project.max_price}L
                </p>
                <p className="text-[11px] text-slate-400">{project.configuration}</p>
              </div>
            </div>

            {project.brochure_url && (
              <div className="pt-2 border-t border-slate-800">
                <a
                  href={project.brochure_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF Brochure
                </a>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Main Data Table */}
      <DataTable columns={columns} data={projects} searchPlaceholder="Search project name, location, builder..." />

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdateProject}
        initialProject={editingProject}
        builders={builders}
      />
    </div>
  );
};
