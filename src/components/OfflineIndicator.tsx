import React, { useEffect, useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { api } from '../services/api';
import { UserProfile } from '../types/game';

interface OfflineIndicatorProps {
  onSyncSuccess?: (user?: UserProfile) => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSyncSuccess }) => {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // Silently sync offline progress to server in background
      api.syncCloudData()
        .then((res) => {
          if (res?.user && onSyncSuccess) {
            onSyncSuccess(res.user);
          }
          setWasOffline(false);
        })
        .catch(() => {
          // Graceful fallback
        });
    }
  }, [isOnline, wasOffline, onSyncSuccess]);

  // Clean UI: Background syncing only, no telemetry/status banner cluttering viewport
  return null;
};
export default OfflineIndicator;
