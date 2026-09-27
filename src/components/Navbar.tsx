import React from 'react';
import { UserProfile, ActiveTab } from '../types/game';
import {
  Trophy,
  Users,
  Gamepad2,
  Car,
  BarChart3,
  Calendar,
  Compass,
  Bell,
  Volume2,
  VolumeX,
  Settings,
  Share2
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  user: UserProfile | null;
  activeTab: ActiveTab;
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
    <header className="w-full bg-[#070a0f]/95 backdrop-blur-md border-b border-[#00E5FF]/20 px-3 py-2.5 sm:px-6 sticky top-0 z-40 shadow-[0_4px_25px_rgba(0,229,255,0.08)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo Kiri: ESCAPE POLICE */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeTab('game')}
            className="flex items-center gap-2.5 group text-left focus:outline-none cursor-pointer transition-transform hover:scale-105"
            title="Escape Police: Cyber Pursuit"
          >
            <div className="relative">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.5)]">
                <img
                  src="/cyber_pursuit_logo.jpg"
                  alt="Escape Police Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
            </div>
            <div className="font-display font-black text-sm sm:text-base tracking-wider text-white">
              ESCAPE <span className="text-[#00E5FF] text-glow-cyan">POLICE</span>
            </div>
          </button>
        </div>

        {/* Menu Navigasi Tengah (Pill Style Tabs) */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#0d131f]/90 p-1.5 rounded-2xl border border-[#00E5FF]/20 shadow-inner">
          {/* [SOLO] */}
          <button
            onClick={() => changeTab('game')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              activeTab === 'game'
                ? 'bg-[#00E5FF] text-black font-black shadow-[0_0_15px_rgba(0,229,255,0.6)] scale-100'
                : 'text-gray-400 hover:text-white hover:bg-white/5 hover:scale-105'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Solo
          </button>

          {/* [PETA] */}
          <button
            onClick={() => changeTab('maps')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              activeTab === 'maps'
                ? 'bg-[#00E5FF] text-black font-black shadow-[0_0_15px_rgba(0,229,255,0.6)] scale-100'
                : 'text-gray-400 hover:text-white hover:bg-white/5 hover:scale-105'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Peta</span>
          </button>

          {/* MULTIPLAYER */}
          <button
            onClick={() => changeTab('multiplayer')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              activeTab === 'multiplayer'
                ? 'bg-[#00E5FF] text-black font-black shadow-[0_0_15px_rgba(0,229,255,0.6)] scale-100'
                : 'text-gray-400 hover:text-white hover:bg-white/5 hover:scale-105'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Multiplayer
          </button>

          {/* PERINGKAT */}
          <button
            onClick={() => changeTab('leaderboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-[#00E5FF] text-black font-black shadow-[0_0_15px_rgba(0,229,255,0.6)] scale-100'
                : 'text-gray-400 hover:text-white hover:bg-white/5 hover:scale-105'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Peringkat
          </button>

          {/* GARASI */}
          <button
            onClick={() => changeTab('garage')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              activeTab === 'garage'
                ? 'bg-[#00E5FF] text-black font-black shadow-[0_0_15px_rgba(0,229,255,0.6)] scale-100'
                : 'text-gray-400 hover:text-white hover:bg-white/5 hover:scale-105'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            Garasi
          </button>

          {/* TURNAMEN */}
          <button
            onClick={() => changeTab('tournaments')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              activeTab === 'tournaments'
                ? 'bg-[#00E5FF] text-black font-black shadow-[0_0_15px_rgba(0,229,255,0.6)] scale-100'
                : 'text-gray-400 hover:text-white hover:bg-white/5 hover:scale-105'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Turnamen
          </button>

          {/* ANALITIK */}
          <button
            onClick={() => changeTab('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#00E5FF] text-black font-black shadow-[0_0_15px_rgba(0,229,255,0.6)] scale-100'
                : 'text-gray-400 hover:text-white hover:bg-white/5 hover:scale-105'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analitik
          </button>
        </nav>

        {/* Sisi Kanan Utility Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-[#0d131f] hover:bg-[#141e30] text-gray-300 hover:text-[#00E5FF] border border-[#00E5FF]/20 hover:border-[#00E5FF]/60 hover:scale-105 transition-all duration-200 cursor-pointer shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={effectiveSoundMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {effectiveSoundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#00E5FF]" />}
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-xl bg-[#0d131f] hover:bg-[#141e30] text-gray-300 hover:text-[#00E5FF] border border-[#00E5FF]/20 hover:border-[#00E5FF]/60 hover:scale-105 transition-all duration-200 cursor-pointer relative shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {effectiveUnread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Tombol [BAGIKAN] (Outline Cyan, border neon glowing, teks bold) */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#00E5FF]/10 hover:bg-[#00E5FF]/25 border border-[#00E5FF] text-[#00E5FF] hover:text-white text-xs font-display font-black uppercase tracking-wider shadow-[0_0_12px_rgba(0,229,255,0.4)] hover:shadow-[0_0_20px_rgba(0,229,255,0.7)] hover:scale-105 transition-all duration-200 cursor-pointer min-h-[44px]"
              title="Bagikan Link Game ke Teman"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Bagikan</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-[#0d131f] hover:bg-[#141e30] text-gray-300 hover:text-[#00E5FF] border border-[#00E5FF]/20 hover:border-[#00E5FF]/60 hover:scale-105 transition-all duration-200 cursor-pointer shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile */}
          {user ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-[#0d131f] hover:bg-[#141e30] border border-[#00E5FF]/20 hover:border-[#00E5FF]/60 hover:scale-105 transition-all duration-200 cursor-pointer shadow-sm min-h-[44px]"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs border font-bold"
                style={{ borderColor: user.carColor, backgroundColor: `${user.carColor}22` }}
              >
                {user.avatar || '🏎️'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-white max-w-[90px] truncate leading-none">
                  {user.username}
                </span>
                <span className="text-[10px] text-[#00E5FF] font-mono leading-tight">
                  {(user.stats?.totalBounty || 0).toLocaleString()} ⚡
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#00F0FF] text-black font-display font-black text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(0,229,255,0.4)] hover:scale-105 transition-all duration-200 cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Masuk
            </button>
          )}
        </div>
      </div>

      {/* Tablet & Mobile Nav Bar (Professional Responsive Auto-Layout) */}
      <div className="flex lg:hidden items-center justify-start sm:justify-center gap-1.5 sm:gap-2 mt-2 pt-2 border-t border-[#00E5FF]/20 overflow-x-auto scrollbar-none text-[11px] font-bold uppercase px-0.5">
        {[
          { id: 'game', label: 'Solo', icon: Gamepad2 },
          { id: 'maps', label: 'Peta', icon: Compass },
          { id: 'multiplayer', label: 'Multiplayer', icon: Users },
          { id: 'leaderboard', label: 'Peringkat', icon: Trophy },
          { id: 'garage', label: 'Garasi', icon: Car },
          { id: 'tournaments', label: 'Turnamen', icon: Calendar },
          { id: 'analytics', label: 'Analitik', icon: BarChart3 },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => changeTab(item.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                isActive
                  ? 'text-black bg-[#00E5FF] font-black shadow-[0_0_12px_rgba(0,229,255,0.5)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
