import React, { useState, useEffect } from 'react';
import { Bell, History, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { notificationsApi } from '../../api/notifications';
import { NotificationItem, ActivityLogItem } from '../../types/report';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);

  useEffect(() => {
    notificationsApi.getNotifications().then(setNotifications).catch(console.error);
    notificationsApi.getActivityLogs().then(setActivityLogs).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Alerts & Audit Trail</h1>
        <p className="text-xs text-slate-400 mt-1">Real-time system notifications and security activity logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-400" /> Priority System Alerts
            </h3>
            <Badge variant="blue">{notifications.length} Alerts</Badge>
          </div>
          <div className="divide-y divide-slate-800/80">
            {notifications.map((n) => (
              <div key={n.id} className="py-3 flex items-start gap-3 text-xs">
                {n.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-white">{n.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity Logs */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <History className="h-4 w-4 text-purple-400" /> Audit Log History
            </h3>
            <Badge variant="purple">{activityLogs.length} Events</Badge>
          </div>
          <div className="divide-y divide-slate-800/80">
            {activityLogs.map((log) => (
              <div key={log.id} className="py-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-400">{log.user_name}</span>
                  <span className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-slate-200 mt-0.5 font-medium">[{log.module}] {log.action}</p>
                <p className="text-slate-400 text-[11px]">{log.details}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
