import React, { useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  MultiplayerRoom,
  DifficultyLevel,
  NotificationItem,
  ActiveTab,
  GameMapId,
} from './types';
import { api, socket, sound } from './services';
import {
  Navbar,
  GameCanvas,
  MultiplayerLobby,
  LeaderboardModal,
  GarageModal,
  TournamentsModal,
  AnalyticsModal,
  MapSelectModal,
  AuthModal,
  SettingsModal,
  NotificationsDrawer,
  AuthScreen,
  ErrorBoundary,
  ShareModal,
  OfflineIndicator,
} from './components';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('game');

  // User State & Auth Flow
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [authScreenTab, setAuthScreenTab] = useState<'login' | 'register'>('login');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('NORMAL');

  // Map Selection & 3D Camera Mode State
  const [selectedMapId, setSelectedMapId] = useState<GameMapId>(() => {
    try {
      const saved = localStorage.getItem('cyber_pursuit_map');
      if (saved && ['kota', 'salju', 'padang_pasir', 'hutan', 'pegunungan'].includes(saved)) {
        return saved as GameMapId;
      }
    } catch {}
    return 'kota';
  });

  const [isMapSelectOpen, setIsMapSelectOpen] = useState(false);

  const handleSelectMap = (mapId: GameMapId) => {
    setSelectedMapId(mapId);
    try {
      localStorage.setItem('cyber_pursuit_map', mapId);
    } catch {}
  };

  // Multiplayer Game Room State
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);
  const [initialInviteRoom, setInitialInviteRoom] = useState<string | null>(null);

  // Check URL parameters for room invite codes on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let roomCode = urlParams.get('room') || urlParams.get('join');
      if (!roomCode && window.location.hash) {
        const hashMatch = window.location.hash.match(/room=([A-Za-z0-9_-]+)/i);
        if (hashMatch) roomCode = hashMatch[1];
      }
      if (roomCode) {
        const clean = roomCode.trim().toUpperCase();
        setInitialInviteRoom(clean);
        setActiveTab('multiplayer');
      }
    } catch {}
  }, []);

  // Modals & Drawers
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cloud Sync Status
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // Initialize user & session
  useEffect(() => {
    const initApp = async () => {
      // Auto-load profile if valid registered or offline session exists
      const profile = await api.getProfile();
      if (profile) {
        setCurrentUser(profile);
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // Mode offline tanpa internet: langsung berikan pengemudi offline agar game langsung bisa dimainkan
        const offlineDriver = api.getOrCreateOfflineUser();
        setCurrentUser(offlineDriver);
      } else {
        setCurrentUser(null);
      }
      setIsAuthChecking(false);

      // Check offline queue sync
      if (navigator.onLine) {
        setCloudSyncStatus('syncing');
        await api.syncOfflineQueue();
        setCloudSyncStatus('synced');
      } else {
        setCloudSyncStatus('offline');
      }
    };

    initApp();

    // Listen to online/offline network events
    const handleOnline = async () => {
      setCloudSyncStatus('syncing');
      await api.syncOfflineQueue();
      setCloudSyncStatus('synced');
    };
    const handleOffline = () => {
      setCloudSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // WebSocket connection & push notification listener
  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    socket.connect(currentUser.id);

    // Initial load of user notifications
    api.getNotifications(currentUser.id).then(notifs => {
      if (Array.isArray(notifs)) {
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }
    }).catch(() => {});

    const unbindNotif = socket.on('push_notification', (data: any) => {
      const notif: NotificationItem = data?.notification || data;
      if (!notif || !notif.title) return;

      setNotifications(prev => [notif, ...prev.filter(n => n.id !== notif.id)]);
      setUnreadCount(c => c + 1);
      sound.play('coin');

      // Native browser notification if allowed
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notif.title, {
            body: notif.message,
            icon: '/favicon.ico',
          });
        } catch {}
      }
    });

    const unbindRoomState = socket.on('room_state', (data: any) => {
      if (!data?.room) return;
      setActiveRoom(data.room);

      if (data.room.status === 'in_game' || data.room.status === 'countdown') {
        setActiveTab('game');
      } else if (data.room.status === 'waiting') {
        // If players voted/reset to return to lobby
        setActiveTab('multiplayer');
      }
    });

    const unbindCountdown = socket.on('countdown_tick', (data: any) => {
      if (data?.room) setActiveRoom(data.room);
      setActiveTab('game');
    });

    const unbindRaceStart = socket.on('race_start', (data: any) => {
      if (data?.room) setActiveRoom(data.room);
      setActiveTab('game');
    });

    return () => {
      unbindNotif();
      unbindRoomState();
      unbindCountdown();
      unbindRaceStart();
    };
  }, [currentUser?.id]);

  // Handle start match from multiplayer lobby
  const handleStartMultiplayerMatch = useCallback((room: MultiplayerRoom) => {
    setActiveRoom(room);
    setInitialInviteRoom(null);
    setActiveTab('game');
  }, []);

  // Handle leaving multiplayer room
  const handleLeaveMultiplayer = useCallback(() => {
    socket.send({ type: 'leave_room' });
    setActiveRoom(null);
    setInitialInviteRoom(null);
    setActiveTab('multiplayer');
  }, []);

  // Handle rematch in current room
  const handleRematchMultiplayer = useCallback(() => {
    socket.send({ type: 'rematch_room' });
  }, []);

  // Handle return to room lobby
  const handleReturnToLobby = useCallback(() => {
    socket.send({ type: 'return_to_lobby' });
    setActiveTab('multiplayer');
  }, []);

  // Mark all notifications read
  const handleMarkAllNotifRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    if (currentUser?.id) {
      api.markNotificationRead(currentUser.id);
    }
  };

  const handleToggleSound = () => {
    const next = !isSoundMuted;
    setIsSoundMuted(next);
    sound.muted = next;
    if (!next) sound.play('click');
  };

  const handleLogout = async () => {
    if (currentUser?.id) {
      await api.logout(currentUser.id);
    } else {
      await api.logout();
    }
    socket.disconnect();
    setCurrentUser(null);
    setAuthScreenTab('register'); // Otomatis kembali ke halaman pendaftaran ulang
    setIsAuthOpen(false);
    setIsSettingsOpen(false);
  };

  // Loading indicator saat inisialisasi sesi
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#070814] flex items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-display font-bold uppercase tracking-wider text-gray-400">
            Memuat Sistem Balap...
          </span>
        </div>
      </div>
    );
  }

  // Jika player baru atau sudah log out: halaman pertama yang muncul adalah halaman login/register
  if (!currentUser) {
    return (
      <AuthScreen
        initialTab={authScreenTab}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAuthScreenTab('login');
        }}
      />
    );
  }

  return (
    <div
      className={`min-h-[100dvh] bg-[#070814] text-white flex flex-col selection:bg-cyan-500 selection:text-black overflow-x-hidden ${
        currentUser?.layoutSettings?.scanlines ? 'crt-scanlines' : ''
      }`}
    >
      {/* Offline/Online Network & Cloud Status Banner */}
      <OfflineIndicator
        onSyncSuccess={(updatedUser) => {
          if (updatedUser) {
            setCurrentUser(updatedUser);
          }
        }}
      />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={tab => {
          if (tab !== 'game') {
            setActiveRoom(null);
          }
          setActiveTab(tab);
        }}
        onSelectTab={tab => {
          // If leaving game, clear active multiplayer room if any
          if (tab !== 'game') {
            setActiveRoom(null);
          }
          setActiveTab(tab);
        }}
        user={currentUser}
        unreadNotifsCount={unreadCount}
        unreadNotifCount={unreadCount}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        cloudStatus={cloudSyncStatus}
        isOnline={cloudSyncStatus !== 'offline'}
        isSyncing={cloudSyncStatus === 'syncing'}
        onTriggerSync={async () => {
          setCloudSyncStatus('syncing');
          const syncRes = await api.syncCloudData();
          if (syncRes?.user) {
            setCurrentUser(syncRes.user);
          }
          setCloudSyncStatus('synced');
        }}
        isSoundMuted={isSoundMuted}
        soundMuted={isSoundMuted}
        onToggleSound={handleToggleSound}
      />

      {/* Main Screen Container */}
      <main className="flex-1 flex flex-col items-center justify-start w-full relative">
        <ErrorBoundary>
          {(activeTab === 'game' || activeTab === 'maps') && (
            <GameCanvas
              user={currentUser}
              difficulty={difficulty}
              onChangeDifficulty={setDifficulty}
              multiplayerRoom={activeRoom}
              onLeaveMultiplayer={handleLeaveMultiplayer}
              onRematchMultiplayer={handleRematchMultiplayer}
              onReturnToLobby={handleReturnToLobby}
              onOpenMultiplayer={() => setActiveTab('multiplayer')}
              onOpenGarage={() => setActiveTab('garage')}
              onOpenLeaderboard={() => setActiveTab('leaderboard')}
              selectedMapId={selectedMapId}
              onSelectMap={handleSelectMap}
              onOpenMapSelect={() => setIsMapSelectOpen(true)}
              onScoreSubmitted={async () => {
                const updated = await api.getProfile();
                if (updated) setCurrentUser(updated);
              }}
            />
          )}

          {activeTab === 'multiplayer' && (
            <MultiplayerLobby
              user={currentUser}
              initialRoomCode={initialInviteRoom}
              onStartMatch={handleStartMultiplayerMatch}
              onBackToSolo={() => {
                setActiveRoom(null);
                setInitialInviteRoom(null);
                setActiveTab('game');
              }}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardModal
              user={currentUser}
              onOpenAuth={() => setIsAuthOpen(true)}
              onBackToGame={() => setActiveTab('game')}
            />
          )}

          {activeTab === 'garage' && (
            <GarageModal
              user={currentUser}
              onUpdateUser={updated => setCurrentUser(updated)}
              onBackToGame={() => setActiveTab('game')}
            />
          )}

          {activeTab === 'tournaments' && (
            <TournamentsModal
              user={currentUser}
              onBackToGame={() => setActiveTab('game')}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsModal
              user={currentUser}
              onBackToGame={() => setActiveTab('game')}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Modals & Slide-overs */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={user => setCurrentUser(user)}
        onLogout={handleLogout}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={currentUser}
        onUpdateUser={updated => setCurrentUser(updated)}
        onLogout={handleLogout}
        onOpenAuth={() => {
          setIsSettingsOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <NotificationsDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotifRead}
        user={currentUser}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomCode={activeRoom?.code}
      />

      <MapSelectModal
        isOpen={isMapSelectOpen || activeTab === 'maps'}
        onClose={() => {
          setIsMapSelectOpen(false);
          if (activeTab === 'maps') setActiveTab('game');
        }}
        selectedMapId={selectedMapId}
        onSelectMap={handleSelectMap}
        onStartGameWithMap={(mapId) => {
          handleSelectMap(mapId);
          setIsMapSelectOpen(false);
          setActiveTab('game');
        }}
      />
    </div>
  );
}
