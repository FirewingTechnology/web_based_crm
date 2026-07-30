import React, { useState, useEffect } from 'react';
import { FolderKanban, MapPin, Download, ShieldCheck, Building2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { projectsApi } from '../../api/projects';
import { Project } from '../../types/project';

export const ProjectsCatalog: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    projectsApi.getProjects().then(setProjects).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Real Estate Projects Catalog</h1>
        <p className="text-xs text-slate-400 mt-1">Browse developer portfolios, pricing tiers & marketing PDF brochures</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} glow className="space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <Badge variant={project.status === 'Ready to Move' ? 'emerald' : 'blue'}>
                  {project.status}
                </Badge>
                {project.rera_id && (
                  <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md font-mono border border-blue-500/20 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> {project.rera_id}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-white text-lg mt-3">{project.name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Building2 className="h-3.5 w-3.5 text-purple-400" /> {project.builder_name}
              </p>

              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{project.location}</span>
                </p>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <p className="text-[11px] text-slate-400 font-medium">Price Range:</p>
                  <p className="text-base font-bold text-emerald-400">
                    ₹{project.min_price} Lakhs - ₹{project.max_price} Lakhs
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">{project.configuration}</p>
                </div>
                {project.amenities && (
                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-300">Amenities:</strong> {project.amenities}
                  </p>
                )}
              </div>
            </div>

            {project.brochure_url && (
              <div className="pt-3 border-t border-slate-800">
                <a
                  href={project.brochure_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Download className="h-4 w-4" /> Download PDF Brochure
                </a>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
