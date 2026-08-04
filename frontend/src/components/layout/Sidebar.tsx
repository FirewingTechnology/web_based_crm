import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  UserCheck,
  Target,
  FileCheck2,
  Coins,
  BarChart3,
  CalendarCheck,
  Bell,
  Settings,
  UserCircle,
  Building,
  LogOut,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onMobileClose }) => {
  const { user, role, logout } = useAuth();

  const isAdminOrManager = role === 'Admin' || role === 'Manager';

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'SaaS Control Panel', path: '/admin/saas', icon: ShieldCheck },
    { label: 'Lead Management', path: '/admin/leads', icon: Users },
    { label: 'Followups', path: '/admin/followups', icon: CalendarCheck },
    { label: 'Bookings', path: '/admin/bookings', icon: FileCheck2 },
    { label: 'Commission', path: '/admin/commissions', icon: Coins },
    { label: 'Projects', path: '/admin/projects', icon: FolderKanban },
    { label: 'Builders', path: '/admin/builders', icon: Building2 },
    { label: 'Broker Management', path: '/admin/brokers', icon: UserCheck },
    { label: 'Sales Management', path: '/admin/sales', icon: Target },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Settings & Logs', path: '/admin/settings', icon: Settings },
  ];


  const salesNavItems = [
    { label: 'Sales Dashboard', path: '/sales/dashboard', icon: LayoutDashboard },
    { label: 'My Leads', path: '/sales/leads', icon: Users },
    { label: 'My Followups', path: '/sales/followups', icon: CalendarCheck },
    { label: 'My Bookings', path: '/sales/bookings', icon: FileCheck2 },
    { label: 'Projects Catalog', path: '/sales/projects', icon: FolderKanban },
    { label: 'Builders Catalog', path: '/sales/builders', icon: Building },
    { label: 'My Commission', path: '/sales/commissions', icon: Coins },
    { label: 'My Profile', path: '/sales/profile', icon: UserCircle },
  ];

  const navItems = isAdminOrManager ? adminNavItems : salesNavItems;

  const SidebarContent = (
    <div className="flex flex-col justify-between h-full text-slate-300">
      <div>
        {/* Brand Header */}
        <div className="py-4 px-3 flex items-center justify-between border-b border-[#C8A45D]/15">
          <div className="flex items-center w-full">
            <img
              src="/logo.png"
              alt="REALVION"
              className="w-full h-auto object-contain"
              style={{ maxHeight: '64px' }}
            />
          </div>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-[#C8A45D]/15 text-[#C8A45D] border border-[#C8A45D]/30 shadow-sm'
                    : 'hover:bg-white/[0.04] hover:text-slate-100 text-slate-400'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer User & Logout */}
      <div className="p-4 border-t border-[#C8A45D]/10">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-[#C8A45D]/20 text-[#C8A45D] border border-[#C8A45D]/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-[#C8A45D]/80 truncate font-medium">{role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="glass-sidebar fixed top-0 left-0 bottom-0 w-64 z-30 hidden md:flex flex-col justify-between text-slate-300">
        {SidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="glass-sidebar fixed top-0 left-0 bottom-0 w-72 z-50 flex flex-col justify-between text-slate-300 shadow-2xl border-r border-[#C8A45D]/15"
            >
              {SidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
