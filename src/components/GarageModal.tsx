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
  Shield,
  Volume2,
  Sliders,
} from 'lucide-react';
import { CAR_CATALOG, getCarModel, drawCar2D, CarModelData } from '../services/cars';

interface GarageModalProps {
  user: UserProfile | null;
  onUpdateUser: (updated: UserProfile) => void;
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

const BRAND_TABS = ['SEMUA', 'HONDA', 'TOYOTA', 'NISSAN', 'BMW', 'LAMBORGHINI', 'LAINNYA'];

export const GarageModal: React.FC<GarageModalProps> = ({ user, onUpdateUser }) => {
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
    sound.play('nearmiss');
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
    if (activeBrandFilter === 'HONDA') return c.brand.toLowerCase().includes('honda');
    if (activeBrandFilter === 'TOYOTA') return c.brand.toLowerCase().includes('toyota');
    if (activeBrandFilter === 'NISSAN') return c.brand.toLowerCase().includes('nissan');
    if (activeBrandFilter === 'BMW') return c.brand.toLowerCase().includes('bmw');
    if (activeBrandFilter === 'LAMBORGHINI') return c.brand.toLowerCase().includes('lamborghini');
    if (activeBrandFilter === 'LAINNYA') {
      return !['honda', 'toyota', 'nissan', 'bmw', 'lamborghini'].some(b =>
        c.brand.toLowerCase().includes(b)
      );
    }
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
        <h1 className="text-xl sm:text-2xl font-display font-black text-white tracking-wider flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-400" />
          Garasi & Model Mobil 2D
        </h1>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-display font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-500/20 transition-all cursor-pointer"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live 2D Vehicle Canvas & Performance Radar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden">
            {/* Top Car Identity Tag */}
            <div className="w-full flex items-start justify-between mb-2 text-left">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase block">
                  {currentCar.brand} • {currentCar.country}
                </span>
                <span className="font-display font-black text-white text-base leading-tight block">
                  {currentCar.name}
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  {currentCar.engine} ({currentCar.hp} HP)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-white/10 text-gray-300 border border-white/10">
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
            <div className="flex items-center gap-2 w-full mt-2">
              <button
                onClick={handleTestNitro}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  testingNitro
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                {testingNitro ? 'Nitro Aktif!' : 'Tes Nitro'}
              </button>

              <button
                onClick={handleRevEngine}
                className="py-1.5 px-3 rounded-lg text-xs font-bold font-display bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                title="Rev Mesin Audio"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                Rev
              </button>
            </div>

            {/* Performance Specs Bars */}
            <div className="w-full mt-4 pt-3 border-t border-white/10 space-y-2 text-left">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Kecepatan Maksimum
                </span>
                <span className="text-white font-mono">{currentCar.stats.speed}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${currentCar.stats.speed}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Akselerasi & Nitro
                </span>
                <span className="text-white font-mono">{currentCar.stats.accel}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${currentCar.stats.accel}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" /> Manuver & Handling
                </span>
                <span className="text-white font-mono">{currentCar.stats.handling}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 transition-all duration-300"
                  style={{ width: `${currentCar.stats.handling}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-rose-400" /> Ketahanan Bodi / Armor
                </span>
                <span className="text-white font-mono">{currentCar.stats.armor}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400 transition-all duration-300"
                  style={{ width: `${currentCar.stats.armor}%` }}
                />
              </div>
            </div>

            {/* Key 2D Features List */}
            <div className="w-full mt-3 pt-3 border-t border-white/10 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                Fitur Khas Desain 2D:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentCar.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-300 font-medium"
                  >
                    • {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Car Model Catalog & Customization */}
        <div className="lg:col-span-8 space-y-6">
          {/* Brand Filter Tabs */}
          <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider">
                Pilih Model Mobil
              </label>
              <span className="text-[11px] text-gray-400">{filteredCars.length} Model Tersedia</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {BRAND_TABS.map(brand => (
                <button
                  key={brand}
                  onClick={() => setActiveBrandFilter(brand)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    activeBrandFilter === brand
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>

            {/* Car Model Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {filteredCars.map(car => {
                const isSelected = selectedModel === car.id;
                return (
                  <button
                    key={car.id}
                    onClick={() => {
                      setSelectedModel(car.id);
                      sound.play('click');
                    }}
                    className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                          {car.brand} • {car.country}
                        </div>
                        <div className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                          {car.shortName}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center text-xs font-bold">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                      {car.desc}
                    </p>

                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-white/5 text-[10px] font-mono text-gray-300">
                      <span className="text-amber-400 font-bold">{car.hp} HP</span>
                      <span>•</span>
                      <span>Spd {car.stats.speed}</span>
                      <span>•</span>
                      <span>Hnd {car.stats.handling}</span>
                      <span>•</span>
                      <span>Arm {car.stats.armor}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color & Trail Effects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Color Palette */}
            <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-5">
              <label className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider block mb-3">
                Warna Bodi & Livery Neon
              </label>
              <div className="grid grid-cols-5 gap-2.5">
                {COLOR_PALETTES.map(col => (
                  <button
                    key={col.hex}
                    onClick={() => {
                      setSelectedColor(col.hex);
                      sound.play('click');
                    }}
                    className={`h-9 rounded-xl border-2 transition-transform cursor-pointer relative flex items-center justify-center ${
                      selectedColor === col.hex ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
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
              <div className="text-[11px] text-gray-400 mt-2.5">
                Warna terpilih: <span className="text-white font-bold">{COLOR_PALETTES.find(c => c.hex === selectedColor)?.name || selectedColor}</span>
              </div>
            </div>

            {/* Trail Effects */}
            <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-5">
              <label className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider block mb-3">
                Efek Trail Knalpot
              </label>
              <div className="space-y-2">
                {TRAIL_EFFECTS.map(tr => (
                  <button
                    key={tr.id}
                    onClick={() => {
                      setSelectedTrail(tr.id as any);
                      sound.play('click');
                    }}
                    className={`w-full p-2 rounded-xl text-xs font-bold font-display flex items-center justify-between border transition-all cursor-pointer ${
                      selectedTrail === tr.id
                        ? 'bg-white/10 border-white/40 text-white'
                        : 'bg-white/5 border-transparent text-gray-400 hover:text-white'
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
          </div>

          {/* Avatar & Driver Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Avatar Picker */}
            <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4">
              <label className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider block mb-2.5">
                Avatar Pengemudi
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATAR_OPTIONS.map(av => (
                  <button
                    key={av}
                    onClick={() => {
                      setSelectedAvatar(av);
                      sound.play('click');
                    }}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                      selectedAvatar === av
                        ? 'bg-purple-500/30 border-2 border-purple-400 scale-105 shadow-md shadow-purple-500/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Badges */}
            <div className="bg-[#0b0c19] border border-white/10 rounded-2xl p-4">
              <label className="text-xs font-display font-bold text-gray-300 uppercase tracking-wider block mb-2.5">
                Gelar / Title
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TITLE_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedTitle(t);
                      sound.play('click');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-display font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      selectedTitle === t
                        ? 'bg-amber-400 text-black shadow-sm font-black'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
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
