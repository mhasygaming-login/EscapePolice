import React, { useEffect, useState } from 'react';
import { useOnlineStatus } from '../hooks';
import { api } from '../services';
import { UserProfile } from '../types';
import { WifiOff, CheckCircle2 } from 'lucide-react';

interface OfflineIndicatorProps {
  onSyncSuccess?: (user?: UserProfile) => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSyncSuccess }) => {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showSyncedToast, setShowSyncedToast] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // Sync offline progress to server when connection returns
      api.syncOfflineQueue()
        .then(() => api.syncCloudData())
        .then((res) => {
          if (res?.user && onSyncSuccess) {
            onSyncSuccess(res.user);
          }
          setShowSyncedToast(true);
          setTimeout(() => {
            setShowSyncedToast(false);
            setWasOffline(false);
          }, 3500);
        })
        .catch(() => {
          setWasOffline(false);
        });
    }
  }, [isOnline, wasOffline, onSyncSuccess]);

  if (!isOnline) {
    return (
      <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-500/95 backdrop-blur-md px-3.5 py-1 text-xs font-mono font-bold text-black shadow-lg shadow-amber-500/20 border border-amber-300/40 animate-pulse">
        <WifiOff className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>MODE OFFLINE — Skor & progres tersimpan di perangkat</span>
      </div>
    );
  }

  if (showSyncedToast) {
    return (
      <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-emerald-500/95 backdrop-blur-md px-3.5 py-1 text-xs font-mono font-bold text-white shadow-lg shadow-emerald-500/20 border border-emerald-300/40 animate-fadeIn">
        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>TERHUBUNG KEMBALI — Progres offline berhasil disinkronkan ke Cloud</span>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;
