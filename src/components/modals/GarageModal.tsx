import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { api, sound, CAR_CATALOG, getCarModel, CarModelData } from '../../services';
import {
  RefreshCw,
  Check,
  Flame,
  Activity,
  Palette,
  Shield,
  Crown,
  Layers,
} from 'lucide-react';
import {
  RadarChart,
  ColorSwatchPicker,
  DEFAULT_COLOR_SWATCHES,
  TrailEffectList,
  DEFAULT_TRAIL_ITEMS,
  AvatarGrid,
  DEFAULT_AVATARS,
  TitleBadgeList,
  DEFAULT_TITLES,
  ShowroomStage,
} from '../garage';

export interface GarageModalProps {
  user: UserProfile | null;
  onUpdateUser: (updated: UserProfile) => void;
  onBackToGame?: () => void;
  carsList?: CarModelData[];
  unlockedAvatars?: string[];
  unlockedTitles?: string[];
  onSelectCar?: (carId: string) => void;
  onSelectColor?: (colorHex: string) => void;
  onSelectTrail?: (trailId: string) => void;
  onSelectAvatar?: (avatar: string) => void;
  onSelectTitle?: (title: string) => void;
}

type TrailEffectType = 'none' | 'cyan_plasma' | 'magenta_laser' | 'amber_sparks';
type SidebarTab = 'telemetry' | 'visual' | 'identity' | 'all';

export const GarageModal: React.FC<GarageModalProps> = ({
  user,
  onUpdateUser,
  onBackToGame,
  carsList = CAR_CATALOG,
  unlockedAvatars,
  unlockedTitles,
  onSelectCar: propOnSelectCar,
  onSelectColor: propOnSelectColor,
  onSelectTrail: propOnSelectTrail,
  onSelectAvatar: propOnSelectAvatar,
  onSelectTitle: propOnSelectTitle,
}) => {
  // Active customizer state
  const [selectedModel, setSelectedModel] = useState<string>(user?.carModel || 'lamborghini_aventador');
  const [selectedColor, setSelectedColor] = useState<string>(user?.carColor || '#ffb703');
  const [selectedTrail, setSelectedTrail] = useState<TrailEffectType>(
    (user?.trailEffect as TrailEffectType) || 'magenta_laser'
  );
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatar || '🏎️');
  const [selectedTitle, setSelectedTitle] = useState<string>(user?.title || 'DRIFT MASTER');

  // Sidebar compact tab switcher
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('telemetry');

  // Sync / feedback status
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Sync state if user prop changes
  useEffect(() => {
    if (user) {
      if (user.carModel) setSelectedModel(user.carModel);
      if (user.carColor) setSelectedColor(user.carColor);
      if (user.trailEffect) setSelectedTrail(user.trailEffect);
      if (user.avatar) setSelectedAvatar(user.avatar);
      if (user.title) setSelectedTitle(user.title);
    }
  }, [user]);

  const currentCar = getCarModel(selectedModel);

  // Handlers with props callback support
  const handleSelectCar = (carId: string) => {
    setSelectedModel(carId);
    if (propOnSelectCar) propOnSelectCar(carId);
  };

  const handleSelectColor = (hex: string) => {
    setSelectedColor(hex);
    if (propOnSelectColor) propOnSelectColor(hex);
  };

  const handleSelectTrail = (trailId: string) => {
    const validTrail = (trailId as TrailEffectType) || 'none';
    setSelectedTrail(validTrail);
    if (propOnSelectTrail) propOnSelectTrail(validTrail);
  };

  const handleSelectAvatar = (avatar: string) => {
    setSelectedAvatar(avatar);
    if (propOnSelectAvatar) propOnSelectAvatar(avatar);
  };

  const handleSelectTitle = (title: string) => {
    setSelectedTitle(title);
    if (propOnSelectTitle) propOnSelectTitle(title);
  };

  // Sync & Save to Profile API
  const handleSyncProfile = async () => {
    sound.ensureContext();
    sound.play('click');
    setIsSyncing(true);

    const updates = {
      carModel: selectedModel,
      carColor: selectedColor,
      trailEffect: selectedTrail,
      avatar: selectedAvatar,
      title: selectedTitle,
    };

    try {
      if (user?.id) {
        const res = await api.updateProfile(user.id, updates);
        if (res.user) {
          onUpdateUser(res.user);
        }
      } else if (user) {
        onUpdateUser({ ...user, ...updates });
      }

      sound.play('powerup');
      setSyncMessage('Profil & Kustomisasi Berhasil Disinkronkan!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err) {
      console.warn('Sync profile error:', err);
      setSyncMessage('Gagal menyinkronkan profil ke server.');
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Launch into Solo Race Grid
  const handleLaunchToGrid = () => {
    sound.ensureContext();
    sound.play('click');

    if (user) {
      const updates = {
        carModel: selectedModel,
        carColor: selectedColor,
        trailEffect: selectedTrail,
        avatar: selectedAvatar,
        title: selectedTitle,
      };
      onUpdateUser({ ...user, ...updates });
      if (user.id) {
        api.updateProfile(user.id, updates).catch(() => {});
      }
    }

    if (onBackToGame) {
      onBackToGame();
    }
  };

  // Dynamic Radar Chart Telemetry Stats from currently selected car
  const telemetryStats = [
    {
      label: 'Kecepatan',
      key: 'speed',
      value: currentCar.stats.speed,
      displayValue: `${currentCar.stats.speed}/100`,
      max: 100,
    },
    {
      label: 'HP Mesin',
      key: 'hp',
      value: Math.min(100, Math.round((currentCar.hp / 850) * 100)),
      displayValue: `${Math.min(100, Math.round((currentCar.hp / 850) * 100))}/100`,
      max: 100,
    },
    {
      label: 'Handling',
      key: 'handling',
      value: currentCar.stats.handling,
      displayValue: `${currentCar.stats.handling}/100`,
      max: 100,
    },
    {
      label: 'Akselerasi',
      key: 'accel',
      value: currentCar.stats.accel,
      displayValue: `${currentCar.stats.accel}/100`,
      max: 100,
    },
    {
      label: 'Armor',
      key: 'armor',
      value: currentCar.stats.armor,
      displayValue: `${currentCar.stats.armor}/100`,
      max: 100,
    },
  ];

  return (
    <div
      className="w-full h-auto lg:h-[calc(100vh-64px)] lg:max-h-[calc(100vh-64px)] bg-[#070814] text-white py-2 sm:py-3 px-3 sm:px-5 lg:px-6 selection:bg-cyan-500 selection:text-black overflow-y-auto lg:overflow-hidden relative flex flex-col justify-start"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0, 240, 255, 0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 240, 255, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px',
      }}
    >
      {/* Toast Notification Alert */}
      {syncMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/90 border border-emerald-400 text-emerald-300 font-display font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-2 animate-bounce">
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
          <span>{syncMessage}</span>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0 space-y-2.5 sm:space-y-3">
        {/* ========================================================================= */}
        {/* HEADER SECTION (Compact Cyberpunk Header)                                 */}
        {/* ========================================================================= */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-cyan-500/20 shrink-0">
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-display font-black tracking-[0.14em] uppercase text-white drop-shadow-[0_0_12px_rgba(0,240,255,0.55)] leading-tight">
              GUDANG & ARMADA NEO-DRIFT
            </h1>
            <p className="text-[11px] sm:text-xs text-gray-400 tracking-wide font-medium mt-0.5">
              Kustomisasi Di Jaringan Cyberpunk.
            </p>
          </div>

          {/* Right Action Pill Outline Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Button 1: Siap - Cyan Outline */}
            <button
              type="button"
              onClick={handleLaunchToGrid}
              className="px-4 py-1.5 sm:py-2 rounded-full border border-[#00f0ff] text-[#00f0ff] bg-transparent hover:bg-[#00f0ff]/10 hover:shadow-[0_0_16px_rgba(0,240,255,0.45)] font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              title="Simpan & Siap Balapan"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Siap</span>
            </button>

            {/* Button 2: Sinkronisasi Profil - Magenta Outline */}
            <button
              type="button"
              onClick={handleSyncProfile}
              disabled={isSyncing}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#ff2d6b] text-[#ff2d6b] bg-transparent hover:bg-[#ff2d6b]/10 hover:shadow-[0_0_16px_rgba(255,45,107,0.45)] font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Profil'}</span>
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* MAIN SPLIT AREA (Kolom Kiri Showroom vs Kolom Kanan Sidebar)             */}
        {/* ========================================================================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 xl:gap-4 min-h-0 items-stretch overflow-hidden">
          {/* KOLOM KIRI (SHOWROOM MOBIL - LEBIH LEBAR) */}
          <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 flex flex-col h-full min-h-0">
            <ShowroomStage
              cars={carsList}
              selectedCar={currentCar}
              selectedColor={selectedColor}
              selectedTrail={selectedTrail}
              onSelectCar={handleSelectCar}
            />
          </div>

          {/* KOLOM KANAN (SIDEBAR KUSTOMISASI - COMPACT & CLEAN) */}
          <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 flex flex-col h-full min-h-0 gap-2">
            {/* Quick Segmented Cyber Switcher (Sangat Rapi & Bebas Scroll) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/10 shrink-0 select-none">
              <button
                type="button"
                onClick={() => {
                  sound.play('click');
                  setActiveSidebarTab('telemetry');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg font-display font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer truncate ${
                  activeSidebarTab === 'telemetry'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title="Performance Telemetry"
              >
                <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">Telemetri</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.play('click');
                  setActiveSidebarTab('visual');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg font-display font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer truncate ${
                  activeSidebarTab === 'visual'
                    ? 'bg-[#ff2d6b]/20 text-[#ff2d6b] border border-[#ff2d6b]/60 shadow-[0_0_10px_rgba(255,45,107,0.3)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title="Cat Bodi & Efek Trail"
              >
                <Palette className="w-3 h-3 text-[#ff2d6b] shrink-0" />
                <span className="truncate">Tampilan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.play('click');
                  setActiveSidebarTab('identity');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg font-display font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer truncate ${
                  activeSidebarTab === 'identity'
                    ? 'bg-[#ffb703]/20 text-[#ffb703] border border-[#ffb703]/60 shadow-[0_0_10px_rgba(255,183,3,0.3)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title="Avatar Pilot & Gelar Kehormatan"
              >
                <Shield className="w-3 h-3 text-[#ffb703] shrink-0" />
                <span className="truncate">Pilot</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.play('click');
                  setActiveSidebarTab('all');
                }}
                className={`py-1.5 px-2.5 rounded-lg font-display font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeSidebarTab === 'all'
                    ? 'bg-white/20 text-white border border-white/40 shadow-xs'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                }`}
                title="Tampilkan Semua Panel"
              >
                <Layers className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">Semua</span>
              </button>
            </div>

            {/* Scrollable Container for Customization Panels */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
              {/* ------------------------------------------------------------------- */}
              {/* PANEL 1: PERFORMANCE TELEMETRY                                      */}
              {/* ------------------------------------------------------------------- */}
              {(activeSidebarTab === 'telemetry' || activeSidebarTab === 'all') && (
                <div className="rounded-[12px] bg-[rgba(10,10,25,0.6)] backdrop-blur-md border border-cyan-500/30 p-3 sm:p-3.5 shadow-[0_0_16px_rgba(0,240,255,0.12)] transition-all">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <h3 className="font-display font-black text-[11px] uppercase tracking-widest text-cyan-300">
                        PERFORMANCE TELEMETRY
                      </h3>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase">
                      {currentCar.brand}
                    </span>
                  </div>

                  <RadarChart
                    stats={telemetryStats}
                    size={200}
                    accentColor="#00f0ff"
                  />
                </div>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* PANEL 2: WARNA BODI & LIVERY NEON                                   */}
              {/* ------------------------------------------------------------------- */}
              {(activeSidebarTab === 'visual' || activeSidebarTab === 'all') && (
                <div className="rounded-[12px] bg-[rgba(10,10,25,0.6)] backdrop-blur-md border border-[#ffb703]/30 p-3 sm:p-3.5 shadow-[0_0_16px_rgba(255,183,3,0.12)] transition-all">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#ffb703]" />
                      <h3 className="font-display font-black text-[11px] uppercase tracking-widest text-amber-300">
                        WARNA BODI & LIVERY NEON
                      </h3>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase">
                      8 Opsi Cat
                    </span>
                  </div>

                  <ColorSwatchPicker
                    colors={DEFAULT_COLOR_SWATCHES}
                    selectedColor={selectedColor}
                    onSelectColor={handleSelectColor}
                  />
                </div>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* PANEL 3: EFEK TRAIL KNALPOT                                         */}
              {/* ------------------------------------------------------------------- */}
              {(activeSidebarTab === 'visual' || activeSidebarTab === 'all') && (
                <div className="rounded-[12px] bg-[rgba(10,10,25,0.6)] backdrop-blur-md border border-[#ff2d6b]/30 p-3 sm:p-3.5 shadow-[0_0_16px_rgba(255,45,107,0.12)] transition-all">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#ff2d6b]" />
                      <h3 className="font-display font-black text-[11px] uppercase tracking-widest text-[#ff2d6b]">
                        EFEK TRAIL KNALPOT
                      </h3>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase">
                      Exhaust FX
                    </span>
                  </div>

                  <TrailEffectList
                    trails={DEFAULT_TRAIL_ITEMS}
                    selectedTrail={selectedTrail}
                    onSelectTrail={handleSelectTrail}
                  />
                </div>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* PANEL 4: AVATAR PENGEMUDI                                           */}
              {/* ------------------------------------------------------------------- */}
              {(activeSidebarTab === 'identity' || activeSidebarTab === 'all') && (
                <div className="rounded-[12px] bg-[rgba(10,10,25,0.6)] backdrop-blur-md border border-cyan-500/30 p-3 sm:p-3.5 shadow-[0_0_16px_rgba(0,240,255,0.12)] transition-all">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      <h3 className="font-display font-black text-[11px] uppercase tracking-widest text-cyan-300">
                        AVATAR PENGEMUDI
                      </h3>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase">
                      Identitas Pilot
                    </span>
                  </div>

                  <AvatarGrid
                    avatars={unlockedAvatars && unlockedAvatars.length > 0 ? unlockedAvatars : DEFAULT_AVATARS}
                    selectedAvatar={selectedAvatar}
                    onSelectAvatar={handleSelectAvatar}
                  />
                </div>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* PANEL 5: GELAR / TITLE KEHORMATAN                                   */}
              {/* ------------------------------------------------------------------- */}
              {(activeSidebarTab === 'identity' || activeSidebarTab === 'all') && (
                <div className="rounded-[12px] bg-[rgba(10,10,25,0.6)] backdrop-blur-md border border-[#ffb703]/30 p-3 sm:p-3.5 shadow-[0_0_16px_rgba(255,183,3,0.12)] transition-all">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-[#ffb703]" />
                      <h3 className="font-display font-black text-[11px] uppercase tracking-widest text-amber-300">
                        GELAR / TITLE KEHORMATAN
                      </h3>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase">
                      Honor Badges
                    </span>
                  </div>

                  <TitleBadgeList
                    titles={DEFAULT_TITLES}
                    selectedTitle={selectedTitle}
                    unlockedTitles={unlockedTitles}
                    onSelectTitle={handleSelectTitle}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
