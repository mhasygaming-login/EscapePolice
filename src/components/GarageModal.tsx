import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types/game';
import { api } from '../services/api';
import { sound } from '../services/audio';
import {
  Palette,
  Sparkles,
  Check,
  Flame,
  Zap,
  Gauge,
  Volume2,
  Sliders,
  Activity,
  Gamepad2,
} from 'lucide-react';
import { CAR_CATALOG, getCarModel, drawCar2D, CarModelData } from '../services/cars';
import { BrandLogo } from './BrandLogo';

interface GarageModalProps {
  user: UserProfile | null;
  onUpdateUser: (updated: UserProfile) => void;
  onBackToGame?: () => void;
}

const AVATAR_OPTIONS = ['🏎️', '⚡', '🤖', '👾', '👑', '🕶️', '💀', '🐯', '🚀', '💎', '🔥', '🦾'];

const TITLE_OPTIONS = [
  'CYBER ACE',
  'OUTLAW KING',
  'DRIFT MASTER',
  'ROAD WARRIOR',
  'SPEED DEMON',
  'NITRO EMPEROR',
  'STREET PHANTOM',
  'MAXXX OVERLORD',
];

const COLOR_PALETTES = [
  { name: 'Championship White', hex: '#f8fafc', oem: 'Honda / GT3' },
  { name: 'Bayside Blue', hex: '#0284c7', oem: 'Nissan GTR' },
  { name: 'Rosso Corsa', hex: '#dc2626', oem: 'Supercar Red' },
  { name: 'Grigio Telesto', hex: '#475569', oem: 'Nardo Grey' },
  { name: 'Cyan Volt', hex: '#00f0ff', oem: 'Cyber Neon' },
  { name: 'Hot Magenta', hex: '#ff2d6b', oem: 'Synthwave' },
  { name: 'Hyper Gold', hex: '#ffb703', oem: 'Gold Rush' },
  { name: 'Electric Violet', hex: '#7c5cff', oem: 'Ultra Violet' },
  { name: 'Acid Emerald', hex: '#06ffa5', oem: 'Green Hell' },
  { name: 'Midnight Carbon', hex: '#0f172a', oem: 'Stealth Black' },
];

const TRAIL_EFFECTS = [
  { id: 'cyan_plasma', name: 'Plasma Biru', color: '#00f0ff' },
  { id: 'magenta_laser', name: 'Laser Magenta', color: '#ff2d6b' },
  { id: 'amber_sparks', name: 'Percikan Api Emas', color: '#ffb703' },
  { id: 'none', name: 'Standar Polos', color: '#64748b' },
];

const BRAND_TABS = ['SEMUA', 'HONDA', 'TOYOTA', 'NISSAN', 'BMW', 'PORSCHE', 'LAMBORGHINI', 'MAZDA', 'FORD'];

export const GarageModal: React.FC<GarageModalProps> = ({ user, onUpdateUser, onBackToGame }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '🏎️');
  const [selectedTitle, setSelectedTitle] = useState(user?.title || 'CYBER ACE');
  const [selectedModel, setSelectedModel] = useState<string>(user?.carModel || 'civic_fl5');
  const [selectedColor, setSelectedColor] = useState(user?.carColor || '#f8fafc');
  const [selectedTrail, setSelectedTrail] = useState<any>(user?.trailEffect || 'cyan_plasma');
  const [activeBrandFilter, setActiveBrandFilter] = useState('SEMUA');
  const [testingNitro, setTestingNitro] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const nitroTimeoutRef = useRef<any>(null);

  const currentCar = getCarModel(selectedModel);

  // Sync state when user prop updates
  useEffect(() => {
    if (user) {
      if (user.avatar) setSelectedAvatar(user.avatar);
      if (user.title) setSelectedTitle(user.title);
      if (user.carModel) setSelectedModel(user.carModel);
      if (user.carColor) setSelectedColor(user.carColor);
      if (user.trailEffect) setSelectedTrail(user.trailEffect);
    }
  }, [user?.id, user?.carModel, user?.carColor, user?.avatar, user?.title, user?.trailEffect]);

  // Trigger nitro exhaust preview
  const handleTestNitro = () => {
    sound.ensureContext();
    sound.play('nitro');
    setTestingNitro(true);
    if (nitroTimeoutRef.current) clearTimeout(nitroTimeoutRef.current);
    nitroTimeoutRef.current = setTimeout(() => {
      setTestingNitro(false);
    }, 1600);
  };

  const handleRevEngine = () => {
    sound.ensureContext();
    sound.playEngineRev(selectedModel);
  };

  // Live 2D Vehicle Canvas Render
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animId = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark asphalt floor
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Technical blueprint grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Measurement guide markers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

      // Car Center
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + Math.sin(frame * 0.04) * 2;
      const carW = 68;
      const carH = 126;

      // Draw high-precision 2D car
      drawCar2D(ctx, {
        x: cx,
        y: cy,
        width: carW,
        height: carH,
        model: selectedModel,
        color: selectedColor,
        isNitro: testingNitro,
        frameCount: frame,
        showShadow: true,
        showUnderglow: true,
      });

      // Trail preview particles
      if (selectedTrail !== 'none') {
        const tColor = TRAIL_EFFECTS.find(t => t.id === selectedTrail)?.color || '#00f0ff';
        for (let i = 0; i < (testingNitro ? 12 : 5); i++) {
          const px = cx + (Math.random() - 0.5) * 20;
          const py = cy + carH / 2 + Math.random() * (testingNitro ? 45 : 25) + 5;
          ctx.fillStyle = tColor;
          ctx.beginPath();
          ctx.arc(px, py, Math.random() * 3 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedColor, selectedModel, selectedTrail, testingNitro]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    sound.play('click');

    const updates = {
      avatar: selectedAvatar,
      title: selectedTitle,
      carModel: selectedModel,
      carColor: selectedColor,
      trailEffect: selectedTrail,
    };

    const res = await api.updateProfile(user.id, updates);
    if (res.user) {
      onUpdateUser(res.user);
      sound.play('powerup');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
    setSaving(false);
  };

  // Filter cars by brand tab
  const filteredCars = CAR_CATALOG.filter(c => {
    if (activeBrandFilter === 'SEMUA') return true;
    return c.brand.toUpperCase() === activeBrandFilter.toUpperCase();
  });

  return (
    <div className="w-full max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
      {/* 1. Standardized Header Banner (CSS Grid Alignment) */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0d0f1e] to-[#0a0a14] border border-purple-500/30 p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center shadow-xl">
        <div className="md:col-span-8 lg:col-span-9 space-y-1">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase tracking-widest mb-1.5">
            <Palette className="w-4 h-4" />
            <span>Kustomisasi & Armada Kendaraan</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white tracking-wide">
            GARASI & ARMADA MOBIL 2D
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl pt-0.5">
            Pilih mobil impian dari OEM ternama, atur warna cat neon, efek knalpot, serta identitas pembalap.
          </p>
        </div>

        <div className="md:col-span-4 lg:col-span-3 flex md:justify-end items-center gap-2.5 flex-wrap">
          {onBackToGame && (
            <button
              type="button"
              onClick={() => {
                sound.play('click');
                if (user) {
                  const updates = {
                    avatar: selectedAvatar,
                    title: selectedTitle,
                    carModel: selectedModel,
                    carColor: selectedColor,
                    trailEffect: selectedTrail,
                  };
                  const updatedUser = { ...user, ...updates };
                  onUpdateUser(updatedUser);
                  api.updateProfile(user.id, updates).catch(() => {});
                }
                onBackToGame();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-black text-xs uppercase tracking-wider shadow-md shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Main Balapan (Solo)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-display font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-500/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" /> Tersimpan!
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Simpan
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Standardized 12-Column Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
        {/* Left Column (4 cols): Live 2D Vehicle Canvas & Performance Telemetry */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center relative overflow-hidden shadow-md">
            {/* Top Car Identity Tag with Brand Logo */}
            <div className="w-full flex items-center justify-between mb-3 text-left">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
                  <BrandLogo brand={currentCar.brand} size={34} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase block">
                    {currentCar.brand}
                  </span>
                  <div className="font-display font-black text-white text-base leading-tight truncate">
                    {currentCar.name}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-white/10 text-gray-300 border border-white/10 shrink-0 ml-2">
                {currentCar.category}
              </span>
            </div>

            {/* Canvas 2D Live Vector Render */}
            <div className="relative w-full max-w-[260px] mx-auto">
              <canvas
                ref={previewCanvasRef}
                width={260}
                height={270}
                className="w-full h-[270px] rounded-xl border border-white/10 my-1 shadow-inner bg-black/40"
              />
              {/* Scale ruler watermark */}
              <div className="absolute bottom-2 right-3 text-[9px] font-mono text-gray-500 pointer-events-none">
                TOP-DOWN 2D BLUEPRINT
              </div>
            </div>

            {/* Test Actions below preview */}
            <div className="grid grid-cols-12 gap-2 w-full mt-2">
              <button
                type="button"
                onClick={handleTestNitro}
                className={`col-span-9 py-2 px-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  testingNitro
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                {testingNitro ? 'Nitro Aktif!' : 'Tes Nitro'}
              </button>

              <button
                type="button"
                onClick={handleRevEngine}
                className="col-span-3 py-2 px-2 rounded-xl text-xs font-bold font-display bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Rev Mesin Audio"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                Rev
              </button>
            </div>

            {/* Performance Telemetry: 3 Core Metrics Only */}
            <div className="w-full mt-4 pt-4 border-t border-white/10 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-display font-black tracking-widest text-cyan-400 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
                  Telemetri Performa
                </div>
                <span className="text-[9px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  3 SPESIFIKASI
                </span>
              </div>

              {/* Metric 1: Kecepatan Maksimum */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-black/40 border border-cyan-500/25 hover:border-cyan-500/40 transition-all shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-sm shrink-0">
                      <Gauge className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white leading-none">Kecepatan Maksimum</div>
                      <div className="text-[9px] font-mono text-cyan-400/80 mt-0.5">TOP SPEED INDEX</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-display font-black text-cyan-300 tracking-tight">{currentCar.stats.speed}</span>
                    <span className="text-[10px] font-mono text-gray-400 ml-1">/ 100</span>
                  </div>
                </div>
                <div className="relative w-full h-2 bg-black/60 rounded-full overflow-hidden border border-cyan-500/30 p-[1px]">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-sky-300 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-500 ease-out"
                    style={{ width: `${currentCar.stats.speed}%` }}
                  />
                </div>
              </div>

              {/* Metric 2: Horse Power */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/40 to-black/40 border border-amber-500/25 hover:border-amber-500/40 transition-all shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white leading-none">Horse Power</div>
                      <div className="text-[9px] font-mono text-amber-400/80 mt-0.5 truncate max-w-[130px]">{currentCar.engine}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-display font-black text-amber-300 tracking-tight">{currentCar.hp}</span>
                    <span className="text-[10px] font-mono font-bold text-amber-400/90 ml-1">HP</span>
                  </div>
                </div>
                <div className="relative w-full h-2 bg-black/60 rounded-full overflow-hidden border border-amber-500/30 p-[1px]">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-500 ease-out"
                    style={{ width: `${currentCar.stats.horsepower}%` }}
                  />
                </div>
              </div>

              {/* Metric 3: Manuver & Handling */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-950/40 to-black/40 border border-purple-500/25 hover:border-purple-500/40 transition-all shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400 shadow-sm shrink-0">
                      <Sliders className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white leading-none">Manuver & Handling</div>
                      <div className="text-[9px] font-mono text-purple-400/80 mt-0.5">AGILITY & CORNERING</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-display font-black text-purple-300 tracking-tight">{currentCar.stats.handling}</span>
                    <span className="text-[10px] font-mono text-gray-400 ml-1">/ 100</span>
                  </div>
                </div>
                <div className="relative w-full h-2 bg-black/60 rounded-full overflow-hidden border border-purple-500/30 p-[1px]">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-fuchsia-300 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)] transition-all duration-500 ease-out"
                    style={{ width: `${currentCar.stats.handling}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Car Model Catalog & Customization Sections */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {/* Brand Filter Tabs & Model Selection Card */}
          <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider">
                Pilih Model Mobil
              </label>
              <span className="text-[11px] text-gray-400 font-mono">{filteredCars.length} Model Tersedia</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {BRAND_TABS.map(brand => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setActiveBrandFilter(brand)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeBrandFilter === brand
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {brand !== 'SEMUA' && (
                    <BrandLogo brand={brand} size={14} className="opacity-90 shrink-0" />
                  )}
                  <span>{brand}</span>
                </button>
              ))}
            </div>

            {/* Car Model Cards Grid - Standardized Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3.5">
              {filteredCars.map(car => {
                const isSelected = selectedModel === car.id;
                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => {
                      setSelectedModel(car.id);
                      sound.playEngineRev(car.id);
                    }}
                    className={`group p-3 sm:p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                      {/* Logo Brand Container */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center p-2 shrink-0 transition-all ${
                          isSelected
                            ? 'bg-cyan-950/70 border border-cyan-400/50 shadow-inner'
                            : 'bg-black/60 border border-white/10 group-hover:border-white/20'
                        }`}
                      >
                        <BrandLogo brand={car.brand} size={34} />
                      </div>

                      {/* Merek & Nama Mobil & 3 Core Stats */}
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block truncate">
                          {car.brand}
                        </span>
                        <div className="font-display font-bold text-sm text-white leading-tight truncate">
                          {car.name}
                        </div>
                        {/* 3 Core Stats Badges */}
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono">
                          <span className="text-cyan-300 font-bold flex items-center gap-0.5" title="Kecepatan Maksimum">
                            <Gauge className="w-2.5 h-2.5 inline text-cyan-400" /> {car.stats.speed}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-amber-300 font-bold flex items-center gap-0.5" title="Horse Power">
                            <Zap className="w-2.5 h-2.5 inline text-amber-400" /> {car.hp} HP
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-purple-300 font-bold flex items-center gap-0.5" title="Manuver & Handling">
                            <Sliders className="w-2.5 h-2.5 inline text-purple-400" /> {car.stats.handling}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Active Checkmark Pill */}
                    <div className="shrink-0 pl-1">
                      {isSelected ? (
                        <span className="w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center text-xs font-black shadow-md shadow-cyan-400/40">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full border border-white/15 group-hover:border-white/30 block" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color & Trail Effects: Standardized 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Color Palette */}
            <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col justify-between">
              <div>
                <label className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider block mb-3">
                  Warna Bodi & Livery Neon
                </label>
                <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                  {COLOR_PALETTES.map(col => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => {
                        setSelectedColor(col.hex);
                        sound.play('click');
                      }}
                      className={`h-9 rounded-xl border-2 transition-transform cursor-pointer relative flex items-center justify-center ${
                        selectedColor === col.hex ? 'scale-110 ring-2 ring-white shadow-md' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: col.hex, borderColor: col.hex }}
                      title={`${col.name} (${col.oem})`}
                    >
                      {selectedColor === col.hex && (
                        <Check className={`w-4 h-4 ${['#f8fafc', '#00f0ff', '#06ffa5', '#ffb703'].includes(col.hex) ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-white/5">
                Warna terpilih: <span className="text-white font-bold">{COLOR_PALETTES.find(c => c.hex === selectedColor)?.name || selectedColor}</span>
              </div>
            </div>

            {/* Trail Effects */}
            <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col justify-between">
              <div>
                <label className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider block mb-3">
                  Efek Trail Knalpot
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {TRAIL_EFFECTS.map(tr => (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() => {
                        setSelectedTrail(tr.id as any);
                        sound.play('click');
                      }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold font-display flex items-center justify-between border transition-all cursor-pointer ${
                        selectedTrail === tr.id
                          ? 'bg-white/10 border-white/40 text-white shadow-sm'
                          : 'bg-white/5 border-transparent text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tr.color }} />
                        {tr.name}
                      </span>
                      {selectedTrail === tr.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-white/5">
                Pancar gas knalpot visual saat berakselerasi
              </div>
            </div>
          </div>

          {/* Avatar & Driver Titles: Standardized 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Avatar Picker */}
            <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-md">
              <label className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider block mb-3">
                Avatar Pengemudi
              </label>
              <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                {AVATAR_OPTIONS.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(av);
                      sound.play('click');
                    }}
                    className={`w-full aspect-square rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                      selectedAvatar === av
                        ? 'bg-purple-500/30 border-2 border-purple-400 scale-105 shadow-md shadow-purple-500/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Badges */}
            <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-md">
              <label className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider block mb-3">
                Gelar / Title Kehormatan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TITLE_OPTIONS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSelectedTitle(t);
                      sound.play('click');
                    }}
                    className={`p-2 rounded-xl text-[11px] font-display font-bold tracking-wider uppercase transition-all cursor-pointer text-center truncate ${
                      selectedTitle === t
                        ? 'bg-amber-400 text-black shadow-sm font-black ring-1 ring-amber-300'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
