import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, UserCircle, CheckCircle2, AlertCircle, Menu, Volume2, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdminUser } from '../../types/user';
import { notificationsApi } from '../../api/notifications';
import { NotificationItem } from '../../types/report';
import { Badge } from '../ui/Badge';
import { playReminderChime, speakReminderVoice } from '../reminders/ReminderManager';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        await notificationsApi.generateAlerts().catch(() => {});
        const data = await notificationsApi.getNotifications();
        setNotifications(data);
      } catch (err) {
        console.error('Error loading notifications', err);
      }
    };
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const isSuperAdmin = isSuperAdminUser(user, role);

  const roleColors: Record<string, 'purple' | 'blue' | 'emerald' | 'amber'> = {
    'Super Admin': 'amber',
    Admin: 'purple',
    Manager: 'blue',
    'Sales Executive': 'emerald',
    Broker: 'amber',
  };

  const roleDisplayName = isSuperAdmin ? 'Platform Owner' : role;
  const isSaasPage = location.pathname.startsWith('/admin/saas');

  return (
    <header className="glass-card sticky top-0 z-20 h-16 border-b border-[#C8A45D]/12 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.05] transition"
            title="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h2 className="text-base font-semibold text-white tracking-wide truncate">REALVION</h2>
        <span className="text-slate-700 hidden sm:inline">|</span>
        <div className="hidden sm:block">
          <Badge variant={roleColors[role || 'Admin'] || 'amber'}>{roleDisplayName}</Badge>
        </div>

        {/* SuperAdmin Quick Switcher Pill */}
        {isSuperAdmin && (
          <button
            onClick={() => navigate(isSaasPage ? '/admin/dashboard' : '/admin/saas')}
            className={`hidden md:inline-flex items-center gap-1.5 py-1 px-2.5 rounded-xl text-xs font-bold transition shadow-sm border ${
              isSaasPage
                ? 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.12] text-slate-300 hover:text-white'
                : 'bg-gradient-to-r from-amber-500/20 via-[#C8A45D]/20 to-yellow-500/20 hover:brightness-125 border-[#C8A45D]/40 text-[#C8A45D]'
            }`}
            title={isSaasPage ? 'Switch to Agency CRM Workspace' : 'Switch to Platform SaaS Control'}
          >
            {isSaasPage ? (
              <>
                <LayoutDashboard className="h-3.5 w-3.5 text-slate-400" />
                <span>Agency CRM</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-[#C8A45D]" />
                <span>👑 SaaS Control</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Voice Sound Test Button */}
        <button
          onClick={() => {
            playReminderChime();
            speakReminderVoice(`Hello ${user?.name || 'User'}, REALVION voice alert system is active.`);
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition flex items-center gap-1.5 text-xs font-medium"
          title="Test Voice & Ringtone Alert"
        >
          <Volume2 className="h-5 w-5 text-[#C8A45D] shrink-0" />
          <span className="hidden md:inline text-[#C8A45D]">Test Voice</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#C8A45D] text-[10px] font-bold text-black flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="glass-modal absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl p-4 shadow-2xl z-50 border border-white/[0.08] text-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Notifications ({unreadCount})
                </h4>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-[#C8A45D] hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    const isCritical = n.severity === 'CRITICAL' || n.type === 'critical';
                    const isHigh = n.severity === 'HIGH' || n.type === 'warning';
                    return (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl border text-xs transition ${
                          n.is_read
                            ? 'bg-white/[0.02] border-white/[0.05] opacity-60'
                            : isCritical
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                            : isHigh
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            : 'bg-[#C8A45D]/08 border-[#C8A45D]/20 text-slate-100'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {isCritical ? (
                            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                          ) : isHigh ? (
                            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          ) : n.type === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-[#C8A45D] shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white leading-tight">{n.title}</p>
                            <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">{n.message}</p>
                            {n.action_url && (
                              <a
                                href={n.action_url}
                                onClick={() => setShowNotifications(false)}
                                className="inline-block mt-1 text-[10px] font-semibold text-blue-400 hover:underline"
                              >
                                View Details →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">No notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown Menu */}
        <div className="relative flex items-center gap-2.5 border-l border-white/[0.06] pl-3 sm:pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white">{user?.name}</p>
            <p className="text-[10px] text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            title="User Profile Menu"
            className="h-9 w-9 rounded-xl bg-[#C8A45D]/15 hover:bg-[#C8A45D]/25 text-[#C8A45D] border border-[#C8A45D]/30 flex items-center justify-center transition focus:outline-none"
          >
            <UserCircle className="h-5 w-5" />
          </button>

          {showUserMenu && (
            <div className="glass-modal absolute right-0 top-12 w-64 rounded-2xl p-4 shadow-2xl z-50 border border-[#C8A45D]/20 text-slate-200 space-y-3">
              <div className="pb-3 border-b border-white/[0.06]">
                <p className="text-xs font-bold text-white">{user?.name}</p>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
                <div className="mt-2">
                  <Badge variant={roleColors[role || 'Admin'] || 'blue'}>{roleDisplayName}</Badge>
                </div>
              </div>

              <div className="space-y-1">
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate(isSaasPage ? '/admin/dashboard' : '/admin/saas');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition flex items-center gap-2 mb-2"
                  >
                    {isSaasPage ? '🏢 Switch to Agency Workspace' : '👑 Open SaaS Control Panel'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-2"
                >
                  🚪 Sign Out of REALVION
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
