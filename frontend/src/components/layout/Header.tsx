import React, { useState, useEffect } from 'react';
import { Bell, UserCircle, CheckCircle2, AlertCircle, Menu, Volume2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../api/notifications';
import { NotificationItem } from '../../types/report';
import { Badge } from '../ui/Badge';
import { playReminderChime, speakReminderVoice } from '../reminders/ReminderManager';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, role, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
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

  const roleColors: Record<string, 'purple' | 'blue' | 'emerald' | 'amber'> = {
    Admin: 'purple',
    Manager: 'blue',
    'Sales Executive': 'emerald',
    Broker: 'amber',
  };

  return (
    <header className="glass-card sticky top-0 z-20 h-16 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden text-slate-300 hover:text-white p-2 rounded-xl hover:bg-slate-800/60 transition"
            title="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h2 className="text-base font-semibold text-white tracking-wide truncate">BrokerOS CRM</h2>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <div className="hidden sm:block">
          <Badge variant={roleColors[role || 'Admin'] || 'blue'}>{role}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Voice Sound Test Button */}
        <button
          onClick={() => {
            playReminderChime();
            speakReminderVoice(`Hello ${user?.name || 'User'}, BrokerOS voice alert system is active.`);
          }}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5 text-xs font-medium"
          title="Test Voice & Ringtone Alert"
        >
          <Volume2 className="h-5 w-5 text-blue-400 shrink-0" />
          <span className="hidden md:inline text-blue-400">Test Voice</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="glass-modal absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl p-4 shadow-2xl z-50 border border-slate-800 text-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Notifications ({unreadCount})
                </h4>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-blue-400 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border text-xs transition ${
                        n.is_read
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                          : 'bg-blue-500/10 border-blue-500/20 text-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.type === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-semibold">{n.title}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">No notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown Menu */}
        <div className="relative flex items-center gap-2.5 border-l border-slate-800 pl-3 sm:pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white">{user?.name}</p>
            <p className="text-[10px] text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            title="User Profile Menu"
            className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center transition focus:outline-none"
          >
            <UserCircle className="h-5 w-5 text-blue-400" />
          </button>

          {showUserMenu && (
            <div className="glass-modal absolute right-0 top-12 w-64 rounded-2xl p-4 shadow-2xl z-50 border border-slate-800 text-slate-200 space-y-3">
              <div className="pb-3 border-b border-slate-800">
                <p className="text-xs font-bold text-white">{user?.name}</p>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
                <div className="mt-2">
                  <Badge variant={roleColors[role || 'Admin'] || 'blue'}>{role}</Badge>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-2"
                >
                  🚪 Sign Out of BrokerOS
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
