import React, { useState } from 'react';
import { NotificationItem, UserProfile } from '../types/game';
import { sound } from '../services/audio';
import { Bell, CheckCheck, X, Trophy, Swords, Zap, Info, ShieldAlert } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  user: UserProfile | null;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  user,
}) => {
  const [pushStatus, setPushStatus] = useState<string>(() => {
    try {
      return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied';
    } catch {
      return 'denied';
    }
  });

  if (!isOpen) return null;

  const requestBrowserPushPermission = async () => {
    sound.play('click');
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.requestPermission) {
        const perm = await Notification.requestPermission();
        setPushStatus(perm);
        if (perm === 'granted') {
          try {
            new Notification('Escape the Police', {
              body: 'Notifikasi push browser berhasil diaktifkan!',
              icon: '/favicon.ico',
            });
          } catch {
            // Ignored if notifications restricted in sandbox
          }
          sound.play('powerup');
        }
      }
    } catch (err) {
      console.warn('Push notification unavailable in this environment:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'score_beaten':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'tournament_alert':
        return <Zap className="w-4 h-4 text-rose-400" />;
      case 'achievement':
        return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0a0a14] border-l border-white/10 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              <h2 className="font-display font-extrabold text-base text-white">PUSAT NOTIFIKASI</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Browser Push Permission Banner */}
          {typeof window !== 'undefined' && 'Notification' in window && pushStatus !== 'granted' && (
            <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-2">
              <div className="text-[11px] text-gray-300">
                Aktifkan push notification browser untuk update turnamen real-time.
              </div>
              <button
                onClick={requestBrowserPushPermission}
                className="px-2.5 py-1 rounded bg-cyan-500 text-black text-[10px] font-bold uppercase shrink-0"
              >
                Aktifkan
              </button>
            </div>
          )}

          {/* Mark read button */}
          {notifications.some(n => !n.read) && (
            <div className="flex justify-end mb-3">
              <button
                onClick={() => {
                  sound.play('click');
                  onMarkAllRead();
                }}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline font-bold"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Tandai Semua Dibaca
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-xs">
                Belum ada notifikasi baru saat ini.
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    n.read
                      ? 'bg-white/5 border-white/5 text-gray-400'
                      : 'bg-white/10 border-cyan-500/30 text-white shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/10 shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-display font-bold text-xs truncate">{n.title}</div>
                        <span className="text-[9px] text-gray-500 shrink-0">
                          {new Date(n.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-300 mt-1 leading-normal">{n.message}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 text-center">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
            Sinkronisasi Notifikasi Server Real-Time
          </span>
        </div>
      </div>
    </div>
  );
};
