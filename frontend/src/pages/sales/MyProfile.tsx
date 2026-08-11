import React from 'react';
import { User, Mail, Phone, Building, ShieldCheck, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

export const MyProfile: React.FC = () => {
  const { user, role } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">My Profile & Account</h1>
        <p className="text-xs text-slate-400 mt-1">User account credentials & role permissions</p>
      </div>

      <Card glow className="space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/20">
            {user?.name?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="blue">{role}</Badge>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> Account Verified & Active
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <p className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Mail className="h-3.5 w-3.5 text-blue-400" /> Email Address
            </p>
            <p className="font-semibold text-white text-sm">{user?.email}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <p className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Phone className="h-3.5 w-3.5 text-purple-400" /> Phone Number
            </p>
            <p className="font-semibold text-white text-sm">{user?.phone || '+91 98765 43210'}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <p className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Building className="h-3.5 w-3.5 text-amber-400" /> Firm / Division
            </p>
            <p className="font-semibold text-white text-sm">{user?.firm_name || 'REALVION Corporate HQ'}</p>

          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <p className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Member Since
            </p>
            <p className="font-semibold text-white text-sm">July 2026</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
