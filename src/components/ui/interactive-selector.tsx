import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Building2,
  Snowflake,
  Flame,
  Trees,
  Mountain,
  Leaf,
  Gauge,
  Skull,
  Play,
  Siren,
  Car,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  MapPin,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { GameMapId } from "../../types/maps";
import { sound } from "../../services/audio";

export type DifficultyId = "santai" | "normal" | "sulit" | "maxxx";

export interface SelectorOption {
  id: string;
  title: string;
  shortLabel: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  image: string;
  position: string;
  icon: LucideIcon;
  color: string;
  gradientOverlay: string;
}

// Background Images Peta
const MAP_IMG_KOTA = "/maps/kota.jpg";
const MAP_IMG_SALJU = "/maps/salju.jpg";
const MAP_IMG_PADANG_PASIR = "/maps/padang_pasir.jpg";
const MAP_IMG_HUTAN = "/maps/hutan.jpg";
const MAP_IMG_PEGUNUNGAN = "/maps/pegunungan.jpg";

// Background Images Tingkat Kesulitan
const DIFF_IMG_SANTAI = "/difficulties/santai.jpg";
const DIFF_IMG_NORMAL = "/difficulties/normal.jpg";
const DIFF_IMG_SULIT = "/difficulties/sulit.jpg";
const DIFF_IMG_MAXXX = "/difficulties/maxxx.jpg";

// 5 Pilihan Arena Peta
export const MAP_SELECTOR_OPTIONS: SelectorOption[] = [
  {
    id: "kota",
    title: "METROPOLIS KOTA",
    shortLabel: "KOTA",
    subtitle: "Kota Cyberpunk",
    description: "Jalan tol layang Neocities dengan pencakar langit megah",
    badge: "NEOCITIES",
    image: MAP_IMG_KOTA,
    position: "center center",
    icon: Building2,
    color: "#00f0ff",
    gradientOverlay:
      "linear-gradient(180deg, rgba(0, 240, 255, 0.1) 0%, rgba(7, 9, 20, 0.9) 100%)",
  },
  {
    id: "salju",
    title: "PUNCAK SALJU",
    shortLabel: "SALJU",
    subtitle: "Arktik & Aurora",
    description: "Hutan pinus beku, kabin hangat & gemerlap aurora borealis",
    badge: "ARKTIS",
    image: MAP_IMG_SALJU,
    position: "center center",
    icon: Snowflake,
    color: "#38bdf8",
    gradientOverlay:
      "linear-gradient(180deg, rgba(56, 189, 248, 0.1) 0%, rgba(8, 16, 32, 0.9) 100%)",
  },
  {
    id: "padang_pasir",
    title: "PADANG PASIR",
    shortLabel: "PASIR",
    subtitle: "Ngarai Outlaw",
    description: "Tebing merah eksotis, bukit pasir emas & aspal gurun panas",
    badge: "OUTLAW",
    image: MAP_IMG_PADANG_PASIR,
    position: "center center",
    icon: Flame,
    color: "#fb923c",
    gradientOverlay:
      "linear-gradient(180deg, rgba(251, 146, 60, 0.1) 0%, rgba(24, 12, 8, 0.9) 100%)",
  },
  {
    id: "hutan",
    title: "HUTAN NEON",
    shortLabel: "HUTAN",
    subtitle: "Hutan Tropis",
    description: "Pohon purba rimbun berpadu pilar neon hijau dan aspal basah",
    badge: "TROPIS",
    image: MAP_IMG_HUTAN,
    position: "center center",
    icon: Trees,
    color: "#34d399",
    gradientOverlay:
      "linear-gradient(180deg, rgba(52, 211, 153, 0.1) 0%, rgba(6, 22, 16, 0.9) 100%)",
  },
  {
    id: "pegunungan",
    title: "PEGUNUNGAN",
    shortLabel: "GUNUNG",
    subtitle: "Canyon Skyline",
    description: "Jalanan berliku tajam di lereng tebing tinggi menembus awan",
    badge: "CANYON",
    image: MAP_IMG_PEGUNUNGAN,
    position: "center center",
    icon: Mountain,
    color: "#c084fc",
    gradientOverlay:
      "linear-gradient(180deg, rgba(192, 132, 252, 0.1) 0%, rgba(20, 10, 32, 0.9) 100%)",
  },
];

// 4 Pilihan Tingkat Kesulitan
export const DIFFICULTY_SELECTOR_OPTIONS: SelectorOption[] = [
  {
    id: "santai",
    title: "SANTAI",
    shortLabel: "SANTAI",
    subtitle: "Mode Santai",
    description: "Trafik lengang, polisi berpatroli dengan kecepatan standar",
    badge: "EASY",
    image: DIFF_IMG_SANTAI,
    position: "center center",
    icon: Leaf,
    color: "#34d399",
    gradientOverlay:
      "linear-gradient(180deg, rgba(52, 211, 153, 0.1) 0%, rgba(6, 22, 16, 0.9) 100%)",
  },
  {
    id: "normal",
    title: "NORMAL",
    shortLabel: "NORMAL",
    subtitle: "Standar Kota",
    description: "Kecepatan imbang, barikade jalan aktif dan taktik pengejaran",
    badge: "NORMAL",
    image: DIFF_IMG_NORMAL,
    position: "center center",
    icon: Gauge,
    color: "#00f0ff",
    gradientOverlay:
      "linear-gradient(180deg, rgba(0, 240, 255, 0.1) 0%, rgba(7, 9, 20, 0.9) 100%)",
  },
  {
    id: "sulit",
    title: "SULIT",
    shortLabel: "SULIT",
    subtitle: "Agresif Brutal",
    description: "Helikopter patroli, taktik pit manuver & spike strip jalanan",
    badge: "HARD",
    image: DIFF_IMG_SULIT,
    position: "center center",
    icon: Flame,
    color: "#f59e0b",
    gradientOverlay:
      "linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, rgba(24, 16, 8, 0.9) 100%)",
  },
  {
    id: "maxxx",
    title: "MAXXX",
    shortLabel: "MAXXX",
    subtitle: "Pengejaran Ekstrem",
    description: "Armada interceptor cepat, serangan EMP konstan & blokade penuh",
    badge: "MAXXX",
    image: DIFF_IMG_MAXXX,
    position: "center center",
    icon: Skull,
    color: "#f43f5e",
    gradientOverlay:
      "linear-gradient(180deg, rgba(244, 63, 94, 0.1) 0%, rgba(26, 6, 12, 0.9) 100%)",
  },
];

export interface InteractiveSelectorProps {
  selectedMapId?: GameMapId;
  onSelectMap?: (mapId: GameMapId) => void;
  defaultDifficulty?: DifficultyId;
  onDifficultyChange?: (difficulty: DifficultyId) => void;
  carName?: string;
  carHp?: number;
  fleetCount?: number;
  onChangeCar?: () => void;
  onOpenFleet?: () => void;
  onStart?: (diff: DifficultyId, map: GameMapId) => void;
  initialMode?: "map" | "difficulty";
}

export const InteractiveSelector: React.FC<InteractiveSelectorProps> = ({
  selectedMapId = "kota",
  onSelectMap,
  defaultDifficulty = "normal",
  onDifficultyChange,
  carName = "Civic Type R",
  carHp = 320,
  fleetCount = 20,
  onChangeCar,
  onOpenFleet,
  onStart,
}) => {
  // Map index tracking
  const [activeMapIndex, setActiveMapIndex] = useState(() => {
    const idx = MAP_SELECTOR_OPTIONS.findIndex((m) => m.id === selectedMapId);
    return idx >= 0 ? idx : 0;
  });

  // Difficulty index tracking
  const [activeDiffIndex, setActiveDiffIndex] = useState(() => {
    const idx = DIFFICULTY_SELECTOR_OPTIONS.findIndex((d) => d.id === defaultDifficulty);
    return idx >= 0 ? idx : 1;
  });

  // Sync props to internal state
  useEffect(() => {
    const idx = MAP_SELECTOR_OPTIONS.findIndex((m) => m.id === selectedMapId);
    if (idx >= 0 && idx !== activeMapIndex) {
      setActiveMapIndex(idx);
    }
  }, [selectedMapId]);

  useEffect(() => {
    const idx = DIFFICULTY_SELECTOR_OPTIONS.findIndex((d) => d.id === defaultDifficulty);
    if (idx >= 0 && idx !== activeDiffIndex) {
      setActiveDiffIndex(idx);
    }
  }, [defaultDifficulty]);

  // Handler update map
  const setMap = useCallback(
    (newIndex: number) => {
      const normalized = (newIndex + MAP_SELECTOR_OPTIONS.length) % MAP_SELECTOR_OPTIONS.length;
      sound.play("click");
      setActiveMapIndex(normalized);
      onSelectMap?.(MAP_SELECTOR_OPTIONS[normalized].id as GameMapId);
    },
    [onSelectMap]
  );

  // Handler update difficulty
  const setDiff = useCallback(
    (newIndex: number) => {
      const normalized = (newIndex + DIFFICULTY_SELECTOR_OPTIONS.length) % DIFFICULTY_SELECTOR_OPTIONS.length;
      sound.play("click");
      setActiveDiffIndex(normalized);
      onDifficultyChange?.(DIFFICULTY_SELECTOR_OPTIONS[normalized].id as DifficultyId);
    },
    [onDifficultyChange]
  );

  // Swipe / Drag helper states for Left Box (Map)
  const mapTouchStart = useRef<number | null>(null);
  const handleMapTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    mapTouchStart.current = clientX;
  };
  const handleMapTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (mapTouchStart.current === null) return;
    const clientX = "changedTouches" in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = clientX - mapTouchStart.current;
    if (diff > 40) {
      setMap(activeMapIndex - 1);
    } else if (diff < -40) {
      setMap(activeMapIndex + 1);
    }
    mapTouchStart.current = null;
  };

  // Swipe / Drag helper states for Right Box (Difficulty)
  const diffTouchStart = useRef<number | null>(null);
  const handleDiffTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    diffTouchStart.current = clientX;
  };
  const handleDiffTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (diffTouchStart.current === null) return;
    const clientX = "changedTouches" in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = clientX - diffTouchStart.current;
    if (diff > 40) {
      setDiff(activeDiffIndex - 1);
    } else if (diff < -40) {
      setDiff(activeDiffIndex + 1);
    }
    diffTouchStart.current = null;
  };

  const currentMap = MAP_SELECTOR_OPTIONS[activeMapIndex] || MAP_SELECTOR_OPTIONS[0];
  const currentDiff = DIFFICULTY_SELECTOR_OPTIONS[activeDiffIndex] || DIFFICULTY_SELECTOR_OPTIONS[1];

  const handleLaunch = () => {
    sound.play("click");
    onStart?.(currentDiff.id as DifficultyId, currentMap.id as GameMapId);
  };

  return (
    <div className="flex w-full flex-col px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-white select-none focus:outline-none">
      {/* ── 1. Top Header: AutoLayout Bersih, Lebar & Rapi ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-white/10 mb-3.5 sm:mb-4 lg:mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff] animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              LOBBY BALAPAN · PERSIAPAN MISI
            </span>
          </div>
          <h1 className="text-sm sm:text-base md:text-lg font-display font-black tracking-wide text-white uppercase mt-0.5">
            PILIH ARENA & TINGKAT KESULITAN
          </h1>
        </div>

        {/* Petunjuk Geser / Klik */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-[10px] sm:text-[11px] font-mono text-gray-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "6s" }} />
          <span>Klik Baris atau Geser Kartu</span>
        </div>
      </div>

      {/* ── 2. DUA KOTAK UTAMA (AUTO LAYOUT: 2 KOLOM LEBAR & JARAK LAPANG) ────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 2xl:gap-8 mb-3.5 sm:mb-4 lg:mb-5">
        {/* ── KOTAK KIRI: MAPS (PILIHAN ARENA) ────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden border flex flex-col justify-between transition-all duration-300 bg-[#080c18]/90 shadow-xl"
          style={{
            borderColor: `${currentMap.color}50`,
            boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 20px ${currentMap.color}20`,
          }}
        >
          {/* Header Kotak Kiri */}
          <div className="flex items-center justify-between px-3.5 py-2 sm:px-4 sm:py-2.5 border-b border-white/10 bg-black/35 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center border shrink-0"
                style={{
                  backgroundColor: `${currentMap.color}20`,
                  borderColor: `${currentMap.color}50`,
                  color: currentMap.color,
                }}
              >
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[8.5px] font-mono font-bold text-gray-400 uppercase tracking-widest block leading-none">
                  KOTAK KIRI · ARENA
                </span>
                <span className="text-xs sm:text-[13px] font-display font-black uppercase text-white tracking-wider truncate block">
                  {currentMap.title}
                </span>
              </div>
            </div>

            {/* Counter Badge */}
            <span
              className="px-2 py-0.5 rounded text-[9.5px] font-mono font-black uppercase tracking-wider border shrink-0"
              style={{
                backgroundColor: `${currentMap.color}15`,
                borderColor: `${currentMap.color}40`,
                color: currentMap.color,
              }}
            >
              {activeMapIndex + 1}/{MAP_SELECTOR_OPTIONS.length}
            </span>
          </div>

          {/* Area Gambar dengan Tinggi Proporsional & Bebas Scroll */}
          <div
            className="relative h-[125px] sm:h-[140px] md:h-[150px] lg:h-[160px] xl:h-[170px] w-full overflow-hidden cursor-grab active:cursor-grabbing group select-none"
            onTouchStart={handleMapTouchStart}
            onTouchEnd={handleMapTouchEnd}
            onMouseDown={handleMapTouchStart}
            onMouseUp={handleMapTouchEnd}
          >
            {/* Background Image: Jernih & Terang */}
            <div
              key={currentMap.id}
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105 animate-fadeIn"
              style={{
                backgroundImage: `url('${currentMap.image}')`,
                filter: "brightness(0.92) contrast(1.05)",
              }}
            />

            {/* Gradient Scrim Minimalis */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

            {/* Tombol Geser Kiri */}
            <button
              type="button"
              aria-label="Peta Sebelumnya"
              onClick={(e) => {
                e.stopPropagation();
                setMap(activeMapIndex - 1);
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/35 hover:bg-black/65 text-white/80 hover:text-white border border-white/20 hover:border-cyan-400/60 flex items-center justify-center transition-all duration-200 backdrop-blur-[2px] shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Tombol Geser Kanan */}
            <button
              type="button"
              aria-label="Peta Berikutnya"
              onClick={(e) => {
                e.stopPropagation();
                setMap(activeMapIndex + 1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/35 hover:bg-black/65 text-white/80 hover:text-white border border-white/20 hover:border-cyan-400/60 flex items-center justify-center transition-all duration-200 backdrop-blur-[2px] shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Floating Info Pill di Bagian Bawah Gambar */}
            <div className="absolute bottom-2 inset-x-12 z-10 pointer-events-none flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 shadow-sm max-w-full truncate">
                <span
                  className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-black uppercase tracking-wider border shrink-0"
                  style={{
                    backgroundColor: `${currentMap.color}25`,
                    borderColor: `${currentMap.color}50`,
                    color: currentMap.color,
                  }}
                >
                  {currentMap.badge}
                </span>
                <span className="text-[10.5px] text-gray-200 font-medium truncate">
                  {currentMap.subtitle}
                </span>
              </div>
            </div>
          </div>

          {/* Row Tombol Pilihan Peta (5 Tombol Proporsional) */}
          <div className="p-1.5 sm:p-2 border-t border-white/10 bg-black/25 backdrop-blur-xs">
            <div className="grid grid-cols-5 gap-1 sm:gap-1.5 md:gap-2">
              {MAP_SELECTOR_OPTIONS.map((opt, idx) => {
                const isSelected = activeMapIndex === idx;
                const OptIcon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMap(idx)}
                    className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 sm:px-1 rounded-xl border transition-all cursor-pointer min-h-[40px] sm:min-h-[44px] active:scale-95 ${
                      isSelected
                        ? "bg-white/15 shadow-sm text-white"
                        : "bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.08] text-gray-400 hover:text-white"
                    }`}
                    style={{
                      borderColor: isSelected ? opt.color : undefined,
                      boxShadow: isSelected ? `0 0 10px ${opt.color}35` : undefined,
                    }}
                  >
                    <OptIcon
                      className="w-3.5 h-3.5 mb-0.5 shrink-0"
                      style={{ color: isSelected ? opt.color : undefined }}
                    />
                    <span className="text-[8.5px] sm:text-[9.5px] font-display font-bold uppercase tracking-wider truncate w-full text-center">
                      {opt.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── KOTAK KANAN: KESULITAN (TINGKAT KESULITAN) ───────────────────── */}
        <div
          className="rounded-2xl overflow-hidden border flex flex-col justify-between transition-all duration-300 bg-[#080c18]/90 shadow-xl"
          style={{
            borderColor: `${currentDiff.color}50`,
            boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 20px ${currentDiff.color}20`,
          }}
        >
          {/* Header Kotak Kanan */}
          <div className="flex items-center justify-between px-3.5 py-2 sm:px-4 sm:py-2.5 border-b border-white/10 bg-black/35 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center border shrink-0"
                style={{
                  backgroundColor: `${currentDiff.color}20`,
                  borderColor: `${currentDiff.color}50`,
                  color: currentDiff.color,
                }}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[8.5px] font-mono font-bold text-gray-400 uppercase tracking-widest block leading-none">
                  KOTAK KANAN · KESULITAN
                </span>
                <span className="text-xs sm:text-[13px] font-display font-black uppercase text-white tracking-wider truncate block">
                  {currentDiff.title} ({currentDiff.badge})
                </span>
              </div>
            </div>

            {/* Counter Badge */}
            <span
              className="px-2 py-0.5 rounded text-[9.5px] font-mono font-black uppercase tracking-wider border shrink-0"
              style={{
                backgroundColor: `${currentDiff.color}15`,
                borderColor: `${currentDiff.color}40`,
                color: currentDiff.color,
              }}
            >
              {activeDiffIndex + 1}/{DIFFICULTY_SELECTOR_OPTIONS.length}
            </span>
          </div>

          {/* Area Gambar dengan Tinggi Proporsional & Bebas Scroll */}
          <div
            className="relative h-[125px] sm:h-[140px] md:h-[150px] lg:h-[160px] xl:h-[170px] w-full overflow-hidden cursor-grab active:cursor-grabbing group select-none"
            onTouchStart={handleDiffTouchStart}
            onTouchEnd={handleDiffTouchEnd}
            onMouseDown={handleDiffTouchStart}
            onMouseUp={handleDiffTouchEnd}
          >
            {/* Background Image: Jernih & Terang */}
            <div
              key={currentDiff.id}
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105 animate-fadeIn"
              style={{
                backgroundImage: `url('${currentDiff.image}')`,
                filter: "brightness(0.92) contrast(1.05)",
              }}
            />

            {/* Gradient Scrim Minimalis */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

            {/* Tombol Geser Kiri */}
            <button
              type="button"
              aria-label="Kesulitan Sebelumnya"
              onClick={(e) => {
                e.stopPropagation();
                setDiff(activeDiffIndex - 1);
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/35 hover:bg-black/65 text-white/80 hover:text-white border border-white/20 hover:border-cyan-400/60 flex items-center justify-center transition-all duration-200 backdrop-blur-[2px] shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Tombol Geser Kanan */}
            <button
              type="button"
              aria-label="Kesulitan Berikutnya"
              onClick={(e) => {
                e.stopPropagation();
                setDiff(activeDiffIndex + 1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/35 hover:bg-black/65 text-white/80 hover:text-white border border-white/20 hover:border-cyan-400/60 flex items-center justify-center transition-all duration-200 backdrop-blur-[2px] shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Floating Info Pill di Bagian Bawah Gambar */}
            <div className="absolute bottom-2 inset-x-12 z-10 pointer-events-none flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 shadow-sm max-w-full truncate">
                <span
                  className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-black uppercase tracking-wider border shrink-0"
                  style={{
                    backgroundColor: `${currentDiff.color}25`,
                    borderColor: `${currentDiff.color}50`,
                    color: currentDiff.color,
                  }}
                >
                  {currentDiff.badge}
                </span>
                <span className="text-[10.5px] text-gray-200 font-medium truncate">
                  {currentDiff.subtitle}
                </span>
              </div>
            </div>
          </div>

          {/* Row Tombol Pilihan Kesulitan (4 Tombol Proporsional) */}
          <div className="p-1.5 sm:p-2 border-t border-white/10 bg-black/25 backdrop-blur-xs">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 md:gap-3">
              {DIFFICULTY_SELECTOR_OPTIONS.map((opt, idx) => {
                const isSelected = activeDiffIndex === idx;
                const OptIcon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDiff(idx)}
                    className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 sm:px-1.5 rounded-xl border transition-all cursor-pointer min-h-[40px] sm:min-h-[44px] active:scale-95 ${
                      isSelected
                        ? "bg-white/15 shadow-sm text-white"
                        : "bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.08] text-gray-400 hover:text-white"
                    }`}
                    style={{
                      borderColor: isSelected ? opt.color : undefined,
                      boxShadow: isSelected ? `0 0 10px ${opt.color}35` : undefined,
                    }}
                  >
                    <OptIcon
                      className="w-3.5 h-3.5 mb-0.5 shrink-0"
                      style={{ color: isSelected ? opt.color : undefined }}
                    />
                    <span className="text-[8.5px] sm:text-[9.5px] font-display font-bold uppercase tracking-wider truncate w-full text-center">
                      {opt.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Quick Telemetry Bar: Mobil Aktif & Armada Polisi (Jarak Lapang) ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-3.5 sm:mb-4 lg:mb-5">
        {/* Mobil Aktif */}
        <div className="bg-[#0b0f1c]/80 border border-white/10 hover:border-cyan-500/35 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 shadow-sm transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[8.5px] text-gray-400 font-bold uppercase tracking-wider font-mono block leading-none mb-0.5">
                Mobil Aktif
              </span>
              <div className="font-display font-bold text-white text-xs sm:text-[13px] truncate leading-tight">
                {carName}{" "}
                <span className="text-cyan-400 font-mono text-[10.5px] font-bold tabular-nums ml-1">
                  ({carHp} HP)
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.play("click");
              onChangeCar?.();
            }}
            className="px-3.5 py-1.5 min-h-[34px] sm:min-h-[36px] rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center justify-center active:scale-95"
          >
            Ganti Mobil
          </button>
        </div>

        {/* Armada Polisi */}
        <div className="bg-[#0b0f1c]/80 border border-white/10 hover:border-rose-500/35 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 shadow-sm transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Siren className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[8.5px] text-gray-400 font-bold uppercase tracking-wider font-mono block leading-none mb-0.5">
                Armada Pengejar
              </span>
              <div className="font-display font-bold text-white text-xs sm:text-[13px] truncate leading-tight">
                {fleetCount} Unit Patroli Siaga
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.play("click");
              onOpenFleet?.();
            }}
            className="px-3.5 py-1.5 min-h-[34px] sm:min-h-[36px] rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center justify-center active:scale-95"
          >
            Lihat Armada
          </button>
        </div>
      </div>

      {/* ── 4. Action Launch Bar (Lapang, Sejajar & Bebas Scrolling) ─────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-3.5 border-t border-white/10">
        {/* Tombol Mulai yang Menonjol */}
        <button
          id="btn-start-game"
          type="button"
          onClick={handleLaunch}
          className="w-full sm:w-auto sm:flex-1 max-w-xl px-6 h-11 sm:h-12 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-[#00d2eb] hover:from-cyan-300 hover:to-cyan-400 text-black font-display font-black text-xs sm:text-[13px] tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.45)] hover:shadow-[0_0_30px_rgba(0,229,255,0.7)] hover:scale-[1.01] active:scale-95 transition-all duration-200 cursor-pointer min-h-[44px]"
        >
          <Play className="w-4 h-4 fill-current shrink-0" />
          <span className="truncate">
            MULAI BALAPAN ➜ {currentMap.shortLabel} · {currentDiff.title}
          </span>
        </button>

        {/* Petunjuk Keyboard */}
        <div className="flex items-center justify-center gap-2.5 text-[10px] text-gray-400 font-mono flex-wrap">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[9px] border border-white/15">
              WASD
            </kbd>
            <span>Kemudi</span>
          </div>
          <span className="text-gray-600">·</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[9px] border border-white/15">
              SPASI
            </kbd>
            <span>Nitro</span>
          </div>
          <span className="text-gray-600">·</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[9px] border border-white/15">
              E
            </kbd>
            <span>EMP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveSelector;
