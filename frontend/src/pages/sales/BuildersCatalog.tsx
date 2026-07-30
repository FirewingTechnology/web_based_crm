import React, { useState, useEffect } from 'react';
import { Building2, Phone, Mail, MapPin, FolderKanban } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { buildersApi } from '../../api/builders';
import { Builder } from '../../types/builder';

export const BuildersCatalog: React.FC = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);

  useEffect(() => {
    buildersApi.getBuilders().then(setBuilders).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Builder Partners Catalog</h1>
        <p className="text-xs text-slate-400 mt-1">Official developer contacts, CP commission rates & active projects</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {builders.map((builder) => (
          <Card key={builder.id} glow className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <Badge variant="emerald">{builder.commission_rate}% Default CP Comm</Badge>
            </div>

            <div>
              <h3 className="font-bold text-white text-base">{builder.name}</h3>
              <p className="text-xs text-slate-400">{builder.company}</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>{builder.contact_person} ({builder.phone})</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{builder.email}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>{builder.projects_count} Active Projects</span>
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
