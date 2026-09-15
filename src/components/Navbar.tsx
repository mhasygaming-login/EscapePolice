import React from 'react';
import { UserProfile } from '../types/game';
import {
  Trophy,
  Users,
  Gamepad2,
  Palette,
  BarChart3,
  Calendar,
  Bell,
  Cloud,
  CloudOff,
  Volume2,
  VolumeX,
  Settings,
  ShieldCheck,
  User,
  Flame,
  Share2
} from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  activeTab: 'game' | 'multiplayer' | 'leaderboard' | 'garage' | 'tournaments' | 'analytics' | 'achievements';
  setActiveTab?: (tab: any) => void;
  onSelectTab?: (tab: any) => void;
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenShare?: () => void;
  unreadNotifsCount?: number;
  unreadNotifCount?: number;
  isOnline?: boolean;
  isSyncing?: boolean;
  onTriggerSync?: () => void;
  cloudStatus?: 'synced' | 'syncing' | 'offline';
  soundMuted?: boolean;
  isSoundMuted?: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onSelectTab,
  onOpenAuth,
  onOpenNotifications,
  onOpenSettings,
  onOpenShare,
  unreadNotifsCount,
  unreadNotifCount,
  isOnline: propIsOnline,
  isSyncing: propIsSyncing,
  onTriggerSync,
  cloudStatus,
  soundMuted: propSoundMuted,
  isSoundMuted,
  onToggleSound,
}) => {
  const changeTab = (tab: any) => {
    if (typeof onSelectTab === 'function') {
      onSelectTab(tab);
    } else if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    }
  };

  const effectiveUnread = unreadNotifsCount ?? unreadNotifCount ?? 0;
  const effectiveSoundMuted = propSoundMuted ?? isSoundMuted ?? false;
  const isOnline = propIsOnline !== undefined ? propIsOnline : cloudStatus !== 'offline';
  const isSyncing = propIsSyncing !== undefined ? propIsSyncing : cloudStatus === 'syncing';

  return (
    <header className="w-full bg-[#080812]/95 backdrop-blur-md border-b border-white/10 px-3 py-2.5 sm:px-6 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeTab('game')}
            className="flex items-center gap-2 group text-left focus:outline-none cursor-pointer"
            title="Escape Police"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
              <span>🚨</span>
            </div>
            <div className="font-display font-black text-sm sm:text-base tracking-wider text-white">
              ESCAPE <span className="text-cyan-400">POLICE</span>
            </div>
          </button>
        </div>

        {/* Center Nav Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => changeTab('game')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'game'
                ? 'bg-cyan-500 text-black shadow-sm font-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Solo
          </button>

          <button
            onClick={() => changeTab('multiplayer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'multiplayer'
                ? 'bg-fuchsia-500 text-white shadow-sm font-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Multiplayer
          </button>

          <button
            onClick={() => changeTab('leaderboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-amber-400 text-black shadow-sm font-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Peringkat
          </button>

          <button
            onClick={() => changeTab('garage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'garage'
                ? 'bg-purple-500 text-white shadow-sm font-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Garasi
          </button>

          <button
            onClick={() => changeTab('tournaments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'tournaments'
                ? 'bg-rose-500 text-white shadow-sm font-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Turnamen
          </button>

          <button
            onClick={() => changeTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-emerald-500 text-black shadow-sm font-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analitik
          </button>
        </nav>

        {/* Right Tools & User Info */}
        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={effectiveSoundMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {effectiveSoundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Cloud Sync Status Icon */}
          <button
            onClick={() => onTriggerSync && onTriggerSync()}
            disabled={isSyncing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer relative"
            title={isOnline ? 'Tersinkronisasi ke Cloud' : 'Offline'}
          >
            {isOnline ? (
              <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-gray-400'}`} />
            ) : (
              <CloudOff className="w-4 h-4 text-rose-400" />
            )}
            <span
              className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer relative"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {effectiveUnread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {/* Share Public Link */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              title="Bagikan Link Game ke Teman"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bagikan</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Account Button */}
          {user ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs border"
                style={{ borderColor: user.carColor, backgroundColor: `${user.carColor}22` }}
              >
                {user.avatar || '🏎️'}
              </div>
              <span className="text-xs font-bold text-white hidden sm:inline max-w-[80px] truncate">
                {user.username}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-bold tracking-wider hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              Masuk
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav Drawer Row */}
      <div className="flex md:hidden items-center justify-around gap-1 mt-2 pt-2 border-t border-white/10 overflow-x-auto text-[11px] font-bold uppercase">
        <button
          onClick={() => changeTab('game')}
          className={`px-2 py-1 rounded ${activeTab === 'game' ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-400'}`}
        >
          Solo
        </button>
        <button
          onClick={() => changeTab('multiplayer')}
          className={`px-2 py-1 rounded ${activeTab === 'multiplayer' ? 'text-fuchsia-400 bg-fuchsia-500/10' : 'text-gray-400'}`}
        >
          Multiplayer
        </button>
        <button
          onClick={() => changeTab('leaderboard')}
          className={`px-2 py-1 rounded ${activeTab === 'leaderboard' ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400'}`}
        >
          Peringkat
        </button>
        <button
          onClick={() => changeTab('garage')}
          className={`px-2 py-1 rounded ${activeTab === 'garage' ? 'text-purple-400 bg-purple-500/10' : 'text-gray-400'}`}
        >
          Garasi
        </button>
        <button
          onClick={() => changeTab('tournaments')}
          className={`px-2 py-1 rounded ${activeTab === 'tournaments' ? 'text-rose-400 bg-rose-500/10' : 'text-gray-400'}`}
        >
          Turnamen
        </button>
        <button
          onClick={() => changeTab('analytics')}
          className={`px-2 py-1 rounded ${activeTab === 'analytics' ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-400'}`}
        >
          Analitik
        </button>
      </div>
    </header>
  );
};
