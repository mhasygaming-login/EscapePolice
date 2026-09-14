import React, { useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  MultiplayerRoom,
  DifficultyLevel,
  NotificationItem,
} from './types/game';
import { api } from './services/api';
import { socket } from './services/socket';
import { sound } from './services/audio';
import { Navbar } from './components/Navbar';
import { GameCanvas } from './components/GameCanvas';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GarageModal } from './components/GarageModal';
import { TournamentsModal } from './components/TournamentsModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'game' | 'multiplayer' | 'leaderboard' | 'garage' | 'tournaments' | 'analytics'>('game');

  // User State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('NORMAL');

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

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cloud Sync Status
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // Initialize user & session
  useEffect(() => {
    const initApp = async () => {
      // Auto-load profile or initialize guest
      const profile = await api.getProfile();
      if (profile) {
        setCurrentUser(profile);
      } else {
        const guest = await api.guestLogin();
        if (guest.user) {
          setCurrentUser(guest.user);
        }
      }

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
    if (currentUser?.id) {
      socket.connect(currentUser.id);
    }

    const unbindNotif = socket.on('push_notification', (notif: NotificationItem) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(c => c + 1);
      sound.play('coin');

      // Native browser notification if allowed
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/favicon.ico',
        });
      }
    });

    const unbindRoomState = socket.on('room_state', (data: any) => {
      if (!data?.room) return;
      setActiveRoom(data.room);

      if (data.room.status === 'in_game') {
        setActiveTab('game');
      } else if (data.room.status === 'waiting') {
        // If players voted/reset to return to lobby
        setActiveTab('multiplayer');
      }
    });

    return () => {
      unbindNotif();
      unbindRoomState();
    };
  }, [currentUser?.id]);

  // Handle start match from multiplayer lobby
  const handleStartMultiplayerMatch = useCallback((room: MultiplayerRoom) => {
    setActiveRoom(room);
    setActiveTab('game');
  }, []);

  // Handle leaving multiplayer room
  const handleLeaveMultiplayer = useCallback(() => {
    socket.send({ type: 'leave_room' });
    setActiveRoom(null);
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
  };

  const handleToggleSound = () => {
    const next = !isSoundMuted;
    setIsSoundMuted(next);
    sound.muted = next;
    if (!next) sound.play('click');
  };

  return (
    <div
      className={`min-h-screen bg-[#070814] text-white flex flex-col selection:bg-cyan-500 selection:text-black ${
        currentUser?.layoutSettings?.scanlines ? 'crt-scanlines' : ''
      }`}
    >
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
        onOpenAuth={() => setIsAuthOpen(true)}
        cloudStatus={cloudSyncStatus}
        isOnline={cloudSyncStatus !== 'offline'}
        isSyncing={cloudSyncStatus === 'syncing'}
        onTriggerSync={async () => {
          setCloudSyncStatus('syncing');
          await api.syncOfflineQueue();
          setCloudSyncStatus('synced');
        }}
        isSoundMuted={isSoundMuted}
        soundMuted={isSoundMuted}
        onToggleSound={handleToggleSound}
      />

      {/* Main Screen Container */}
      <main className="flex-1 flex flex-col items-center justify-start w-full relative">
        {activeTab === 'game' && (
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
              setActiveTab('game');
            }}
          />
        )}

        {activeTab === 'leaderboard' && <LeaderboardModal user={currentUser} />}

        {activeTab === 'garage' && (
          <GarageModal
            user={currentUser}
            onUpdateUser={updated => setCurrentUser(updated)}
          />
        )}

        {activeTab === 'tournaments' && <TournamentsModal user={currentUser} />}

        {activeTab === 'analytics' && <AnalyticsModal user={currentUser} />}
      </main>

      {/* Modals & Slide-overs */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={user => setCurrentUser(user)}
        onLogout={async () => {
          await api.logout();
          setCurrentUser(null);
          // auto re-init guest
          const guest = await api.guestLogin();
          if (guest.user) setCurrentUser(guest.user);
          setIsAuthOpen(false);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={currentUser}
        onUpdateUser={updated => setCurrentUser(updated)}
      />

      <NotificationsDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotifRead}
        user={currentUser}
      />
    </div>
  );
}
