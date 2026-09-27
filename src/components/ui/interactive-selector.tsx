import React, { useEffect, useState, useCallback } from "react";
import {
  Flame,
  Gauge,
  Leaf,
  Play,
  Siren,
  Skull,
  Building2,
  Snowflake,
  Trees,
  Mountain,
  MapPin,
  ShieldAlert,
  Car,
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

// Map Background Images
const MAP_IMG_KOTA = "/maps/kota.jpg";
const MAP_IMG_SALJU = "/maps/salju.jpg";
const MAP_IMG_PADANG_PASIR = "/maps/padang_pasir.jpg";
const MAP_IMG_HUTAN = "/maps/hutan.jpg";
const MAP_IMG_PEGUNUNGAN = "/maps/pegunungan.jpg";

// Difficulty Background Images (User Custom Assets)
const DIFF_IMG_SANTAI = "/difficulties/santai.jpg";
const DIFF_IMG_NORMAL = "/difficulties/normal.jpg";
const DIFF_IMG_SULIT = "/difficulties/sulit.jpg";
const DIFF_IMG_MAXXX = "/difficulties/maxxx.jpg";

// 5 Pilihan Peta (Maps) - Visual Vibes Profesional
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
      "linear-gradient(180deg, rgba(0, 240, 255, 0.12) 0%, rgba(7, 9, 20, 0.92) 100%)",
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
      "linear-gradient(180deg, rgba(56, 189, 248, 0.15) 0%, rgba(8, 16, 32, 0.92) 100%)",
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
      "linear-gradient(180deg, rgba(251, 146, 60, 0.15) 0%, rgba(24, 12, 8, 0.92) 100%)",
  },
  {
    id: "hutan",
    title: "HUTAN NEON",
    shortLabel: "HUTAN",
    subtitle: "Hutan Hujan Tropis",
    description: "Pohon purba rimbun berpadu pilar neon hijau dan aspal basah",
    badge: "TROPIS",
    image: MAP_IMG_HUTAN,
    position: "center center",
    icon: Trees,
    color: "#34d399",
    gradientOverlay:
      "linear-gradient(180deg, rgba(52, 211, 153, 0.15) 0%, rgba(6, 22, 16, 0.92) 100%)",
  },
  {
    id: "pegunungan",
    title: "PEGUNUNGAN",
    shortLabel: "GUNUNG",
    subtitle: "Skyline Canyon Pass",
    description: "Jalanan berliku tajam di lereng tebing tinggi menembus awan",
    badge: "CANYON",
    image: MAP_IMG_PEGUNUNGAN,
    position: "center center",
    icon: Mountain,
    color: "#c084fc",
    gradientOverlay:
      "linear-gradient(180deg, rgba(192, 132, 252, 0.15) 0%, rgba(20, 10, 32, 0.92) 100%)",
  },
];

// 4 Pilihan Tingkat Kesulitan
export const DIFFICULTY_SELECTOR_OPTIONS: SelectorOption[] = [
  {
    id: "santai",
    title: "SANTAI",
    shortLabel: "SANTAI",
    subtitle: "Mode Santai",
    description: "Trafik lengang, polisi ramah berpatroli santai tanpa terburu-buru",
    badge: "EASY",
    image: DIFF_IMG_SANTAI,
    position: "center center",
    icon: Leaf,
    color: "#34d399",
    gradientOverlay:
      "linear-gradient(180deg, rgba(52, 211, 153, 0.12) 0%, rgba(7, 9, 20, 0.92) 100%)",
  },
  {
    id: "normal",
    title: "NORMAL",
    shortLabel: "NORMAL",
    subtitle: "Tantangan Standar",
    description: "Kecepatan balapan seimbang dengan formasi armada patroli reguler",
    badge: "BALANCED",
    image: DIFF_IMG_NORMAL,
    position: "center center",
    icon: Gauge,
    color: "#00e5ff",
    gradientOverlay:
      "linear-gradient(180deg, rgba(0, 229, 255, 0.12) 0%, rgba(7, 9, 20, 0.92) 100%)",
  },
  {
    id: "sulit",
    title: "SULIT",
    shortLabel: "SULIT",
    subtitle: "Kejaran Agresif",
    description: "Polisi agresif, barikade kawat berduri (*Spike Strip*) & unit SUV tangguh",
    badge: "CHALLENGE",
    image: DIFF_IMG_SULIT,
    position: "center center",
    icon: Flame,
    color: "#f59e0b",
    gradientOverlay:
      "linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(7, 9, 20, 0.92) 100%)",
  },
  {
    id: "maxxx",
    title: "MAXXX",
    shortLabel: "MAXXX",
    subtitle: "Kejaran Brutal",
    description: "Armada helikopter tempur, tembakan gelombang EMP & kejaran tanpa ampun",
    badge: "EXTREME",
    image: DIFF_IMG_MAXXX,
    position: "center center",
    icon: Skull,
    color: "#f43f5e",
    gradientOverlay:
      "linear-gradient(180deg, rgba(244, 63, 94, 0.18) 0%, rgba(7, 9, 20, 0.94) 100%)",
  },
];

export interface InteractiveSelectorProps {
  selectedMapId?: GameMapId;
  onSelectMap?: (id: GameMapId) => void;
  defaultDifficulty?: DifficultyId;
  onDifficultyChange?: (id: DifficultyId) => void;
  carName?: string;
  carHp?: number;
  fleetCount?: number;
  onChangeCar?: () => void;
  onStart?: (difficulty: DifficultyId, mapId: GameMapId) => void;
  onOpenFleet?: () => void;
  initialMode?: "map" | "difficulty";
}

export const InteractiveSelector: React.FC<InteractiveSelectorProps> = ({
  selectedMapId = "kota",
  onSelectMap,
  defaultDifficulty = "normal",
  onDifficultyChange,
  carName = "GT-R Nismo",
  carHp = 600,
  fleetCount = 20,
  onChangeCar,
  onStart,
  onOpenFleet,
  initialMode = "map",
}) => {
  const [activeMode, setActiveMode] = useState<"map" | "difficulty">(initialMode);

  const [activeMapIndex, setActiveMapIndex] = useState(() => {
    const idx = MAP_SELECTOR_OPTIONS.findIndex((m) => m.id === selectedMapId);
    return idx >= 0 ? idx : 0;
  });

  const [activeDiffIndex, setActiveDiffIndex] = useState(() => {
    const idx = DIFFICULTY_SELECTOR_OPTIONS.findIndex((d) => d.id === defaultDifficulty);
    return idx >= 0 ? idx : 1;
  });

  useEffect(() => {
    const idx = MAP_SELECTOR_OPTIONS.findIndex((m) => m.id === selectedMapId);
    if (idx >= 0 && idx !== activeMapIndex) {
      setActiveMapIndex(idx);
    }
  }, [selectedMapId, activeMapIndex]);

  useEffect(() => {
    const idx = DIFFICULTY_SELECTOR_OPTIONS.findIndex((d) => d.id === defaultDifficulty);
    if (idx >= 0 && idx !== activeDiffIndex) {
      setActiveDiffIndex(idx);
    }
  }, [defaultDifficulty, activeDiffIndex]);

  const currentOptions = activeMode === "map" ? MAP_SELECTOR_OPTIONS : DIFFICULTY_SELECTOR_OPTIONS;
  const currentActiveIndex = activeMode === "map" ? activeMapIndex : activeDiffIndex;

  const handleOptionClick = useCallback(
    (index: number) => {
      sound.play("click");
      if (activeMode === "map") {
        setActiveMapIndex(index);
        const chosenMap = MAP_SELECTOR_OPTIONS[index].id as GameMapId;
        onSelectMap?.(chosenMap);
      } else {
        setActiveDiffIndex(index);
        const chosenDiff = DIFFICULTY_SELECTOR_OPTIONS[index].id as DifficultyId;
        onDifficultyChange?.(chosenDiff);
      }
    },
    [activeMode, onSelectMap, onDifficultyChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIdx = (currentActiveIndex + 1) % currentOptions.length;
        handleOptionClick(nextIdx);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIdx = (currentActiveIndex - 1 + currentOptions.length) % currentOptions.length;
        handleOptionClick(prevIdx);
      }
    },
    [currentActiveIndex, currentOptions.length, handleOptionClick]
  );

  const selectedMapOption = MAP_SELECTOR_OPTIONS[activeMapIndex] || MAP_SELECTOR_OPTIONS[0];
  const selectedDiffOption =
    DIFFICULTY_SELECTOR_OPTIONS[activeDiffIndex] || DIFFICULTY_SELECTOR_OPTIONS[1];

  const activeOption = currentOptions[currentActiveIndex] || currentOptions[0];
  const ActiveIcon = activeOption.icon;
  const activeColor = activeOption.color || "#00e5ff";

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="relative flex w-full flex-col p-3 sm:p-4 md:p-5 text-white select-none focus:outline-none"
    >
      {/* ── 1. Tactical Command Header & Mode Switcher ────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/10 mb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff] animate-pulse" />
            <span className="text-[9.5px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              LOBBY BALAPAN · PERSIAPAN MISI
            </span>
          </div>
          <h2 className="text-base sm:text-lg md:text-xl font-display font-black tracking-wider text-white uppercase mt-0.5">
            PILIH {activeMode === "map" ? "ARENA LINTASAN" : "TINGKAT KESULITAN"}
          </h2>
        </div>

        {/* Mode Switcher Tabs: ARENA & KESULITAN (Bersih & Tanpa Angka) */}
        <div className="flex items-center gap-1 p-1 bg-black/60 border border-white/10 rounded-xl w-full sm:w-auto shadow-inner">
          <button
            type="button"
            onClick={() => {
              sound.play("click");
              setActiveMode("map");
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 min-h-[38px] rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer active:scale-95 ${
              activeMode === "map"
                ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>ARENA</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.play("click");
              setActiveMode("difficulty");
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 min-h-[38px] rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer active:scale-95 ${
              activeMode === "difficulty"
                ? "bg-fuchsia-500 text-white shadow-[0_0_12px_rgba(255,45,107,0.4)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>KESULITAN</span>
          </button>
        </div>
      </div>

      {/* ── 2. Unified Telemetry Quick-Config Bar (3 Columns, Pristine Auto-Layout) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 mb-2.5">
        {/* Card 1: Mobil Aktif */}
        <div className="bg-[#0b0f1c]/90 border border-white/10 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-sm transition-colors hover:border-white/20 min-h-[50px] sm:min-h-[52px]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Car className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider font-mono block leading-none mb-0.5">
                Mobil Aktif
              </span>
              <div className="font-display font-bold text-white text-xs sm:text-[13px] truncate leading-tight">
                {carName}{" "}
                <span className="text-cyan-400 font-mono text-[10px] font-bold tabular-nums">
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
            className="px-2.5 py-1 min-h-[36px] rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center justify-center active:scale-95"
          >
            Ganti
          </button>
        </div>

        {/* Card 2: Arena Terpilih */}
        <button
          type="button"
          onClick={() => {
            sound.play("click");
            setActiveMode("map");
          }}
          className={`border rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 text-left transition-all cursor-pointer min-h-[50px] sm:min-h-[52px] ${
            activeMode === "map"
              ? "bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_12px_rgba(0,229,255,0.15)] ring-1 ring-cyan-500/30"
              : "bg-[#0b0f1c]/90 border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${selectedMapOption.color}15`,
                borderColor: `${selectedMapOption.color}40`,
                color: selectedMapOption.color,
              }}
            >
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider font-mono block leading-none mb-0.5">
                Arena Terpilih
              </span>
              <div className="font-display font-bold text-white text-xs sm:text-[13px] truncate leading-tight">
                {selectedMapOption.title}
              </div>
            </div>
          </div>
          <span
            className={`text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
              activeMode === "map"
                ? "bg-cyan-500 text-black font-extrabold"
                : "text-cyan-400 bg-cyan-500/10"
            }`}
          >
            {activeMode === "map" ? "AKTIF" : "UBAH"}
          </span>
        </button>

        {/* Card 3: Level Kesulitan */}
        <button
          type="button"
          onClick={() => {
            sound.play("click");
            setActiveMode("difficulty");
          }}
          className={`border rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 text-left transition-all cursor-pointer min-h-[50px] sm:min-h-[52px] ${
            activeMode === "difficulty"
              ? "bg-fuchsia-950/30 border-fuchsia-500/50 shadow-[0_0_12px_rgba(255,45,107,0.15)] ring-1 ring-fuchsia-500/30"
              : "bg-[#0b0f1c]/90 border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${selectedDiffOption.color}15`,
                borderColor: `${selectedDiffOption.color}40`,
                color: selectedDiffOption.color,
              }}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider font-mono block leading-none mb-0.5">
                Level Kesulitan
              </span>
              <div className="font-display font-bold text-white text-xs sm:text-[13px] truncate flex items-center gap-1.5 leading-tight">
                <span>{selectedDiffOption.title}</span>
                <span
                  className="text-[8.5px] px-1.5 py-0.2 rounded font-mono font-bold uppercase"
                  style={{
                    backgroundColor: `${selectedDiffOption.color}25`,
                    color: selectedDiffOption.color,
                  }}
                >
                  {selectedDiffOption.badge}
                </span>
              </div>
            </div>
          </div>
          <span
            className={`text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
              activeMode === "difficulty"
                ? "bg-fuchsia-500 text-white font-extrabold"
                : "text-fuchsia-400 bg-fuchsia-500/10"
            }`}
          >
            {activeMode === "difficulty" ? "AKTIF" : "UBAH"}
          </span>
        </button>
      </div>

      {/* ── 3. Desktop Interactive Expanding Accordion Deck (Screen >= md) ─────── */}
      <div
        role="radiogroup"
        aria-label={activeMode === "map" ? "Pilihan Arena Peta" : "Pilihan Tingkat Kesulitan"}
        className="hidden md:flex relative h-[190px] sm:h-[205px] lg:h-[220px] w-full flex-row items-stretch overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black/40 mb-3"
      >
        {currentOptions.map((option, index) => {
          const isActive = currentActiveIndex === index;
          const Icon = option.icon;
          const accentColor = option.color || "#00e5ff";

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={option.title}
              onClick={() => handleOptionClick(index)}
              className="relative min-w-[65px] lg:min-w-[75px] overflow-hidden text-left transition-[flex,border-color,box-shadow,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 group cursor-pointer"
              style={{
                flex: isActive ? "5 1 0%" : "1 1 0%",
                borderWidth: "2px",
                borderStyle: "solid",
                borderColor: isActive ? accentColor : "rgba(255, 255, 255, 0.08)",
                boxShadow: isActive
                  ? `0 12px 30px rgba(0,0,0,0.6), 0 0 16px ${accentColor}40`
                  : "none",
                zIndex: isActive ? 10 : 1,
              }}
            >
              {/* Background Photo */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                style={{
                  backgroundImage: `url('${option.image}')`,
                  filter: isActive ? "brightness(0.95) contrast(1.05)" : "brightness(0.55)",
                }}
              />

              {/* Gradient Scrim for Legibility */}
              <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                  background: isActive
                    ? "linear-gradient(180deg, rgba(8, 11, 20, 0.20) 0%, rgba(8, 11, 20, 0.55) 40%, rgba(8, 11, 20, 0.95) 100%)"
                    : "linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.8) 100%)",
                }}
              />

              {/* Top Accent Line for Active */}
              {isActive && (
                <div
                  className="absolute top-0 inset-x-0 h-1 z-20 shadow-[0_0_8px_currentColor]"
                  style={{ backgroundColor: accentColor, color: accentColor }}
                />
              )}

              {/* ACTIVE CARD CONTENT */}
              {isActive ? (
                <div className="relative z-10 w-full h-full flex flex-col justify-between p-3.5 sm:p-4">
                  {/* Top Badge & Indicator */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9.5px] font-mono font-bold tracking-wider uppercase border shadow-sm backdrop-blur-md"
                      style={{
                        backgroundColor: `${accentColor}25`,
                        borderColor: `${accentColor}50`,
                        color: accentColor,
                      }}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{option.badge || "TERPILIH"}</span>
                    </span>

                    <span className="text-[10px] font-mono text-gray-300 font-bold bg-black/60 px-2 py-0.5 rounded border border-white/10">
                      {index + 1}/{currentOptions.length}
                    </span>
                  </div>

                  {/* Bottom Info: Title, Subtitle, Description */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${accentColor}30`,
                          borderColor: accentColor,
                          color: accentColor,
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-display font-black text-base lg:text-lg tracking-wider text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] truncate">
                        {option.title}
                      </h3>
                    </div>

                    {option.subtitle && (
                      <div className="text-[11px] font-semibold text-gray-300 pl-9 truncate">
                        {option.subtitle}
                      </div>
                    )}

                    {option.description && (
                      <p className="text-[11px] text-gray-300/90 pl-9 line-clamp-2 max-w-lg leading-snug">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* INACTIVE CARD CONTENT (Clean Centered with shortLabel, Never Truncated) */
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-3 px-1 group-hover:bg-white/[0.03] transition-colors">
                  <span className="text-[9.5px] font-mono text-gray-400 font-bold">
                    0{index + 1}
                  </span>

                  <div
                    className="w-8 h-8 rounded-xl bg-black/70 border border-white/15 flex items-center justify-center text-gray-300 group-hover:text-white group-hover:border-white/40 group-hover:scale-110 transition-all duration-300 shadow-md backdrop-blur-sm"
                    style={{ color: accentColor }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="w-full text-center">
                    <span className="block text-[9.5px] font-display font-bold uppercase tracking-wider text-gray-300 group-hover:text-white truncate px-0.5">
                      {option.shortLabel}
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── 3B. Mobile & Tablet Card Deck (Screen < md, Clean & Collision-Free) ── */}
      <div className="flex md:hidden flex-col gap-2 mb-3">
        {/* Active Hero Card Preview */}
        <div
          className="relative h-[135px] sm:h-[145px] w-full rounded-2xl overflow-hidden border-2 shadow-xl p-3 flex flex-col justify-between"
          style={{
            borderColor: activeColor,
            boxShadow: `0 8px 24px rgba(0,0,0,0.7), 0 0 16px ${activeColor}30`,
          }}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${activeOption.image}')`,
              filter: "brightness(0.9) contrast(1.05)",
            }}
          />
          {/* Gradient Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b15] via-[#080b15]/60 to-[#080b15]/30 pointer-events-none" />

          {/* Top Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold tracking-wider uppercase border backdrop-blur-md"
              style={{
                backgroundColor: `${activeColor}25`,
                borderColor: `${activeColor}50`,
                color: activeColor,
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span>{activeOption.badge || "TERPILIH"}</span>
            </span>

            <span className="text-[9.5px] font-mono text-gray-300 font-bold bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
              {currentActiveIndex + 1}/{currentOptions.length}
            </span>
          </div>

          {/* Bottom Info */}
          <div className="relative z-10 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${activeColor}30`,
                  borderColor: activeColor,
                  color: activeColor,
                }}
              >
                <ActiveIcon className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-display font-black text-sm sm:text-base tracking-wider text-white uppercase truncate">
                {activeOption.title}
              </h3>
            </div>
            {activeOption.description && (
              <p className="text-[10.5px] text-gray-300 line-clamp-2 pl-8 leading-snug">
                {activeOption.description}
              </p>
            )}
          </div>
        </div>

        {/* Thumbnail Selector Strip (Full Touch Target, No Overlap) */}
        <div
          className={`grid gap-1.5 ${
            currentOptions.length === 5 ? "grid-cols-5" : "grid-cols-4"
          }`}
        >
          {currentOptions.map((opt, i) => {
            const isSelected = currentActiveIndex === i;
            const OptIcon = opt.icon;
            const itemColor = opt.color || "#00e5ff";

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleOptionClick(i)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl border min-h-[44px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer active:scale-95 ${
                  isSelected
                    ? "bg-white/15 shadow-md"
                    : "bg-black/50 border-white/10 hover:border-white/25 hover:bg-white/5 text-gray-400"
                }`}
                style={{
                  borderColor: isSelected ? itemColor : undefined,
                  boxShadow: isSelected ? `0 0 10px ${itemColor}40` : undefined,
                }}
              >
                <OptIcon
                  className="w-3.5 h-3.5 mb-0.5"
                  style={{ color: isSelected ? itemColor : undefined }}
                />
                <span
                  className={`text-[9px] font-display font-bold uppercase tracking-wider truncate w-full text-center ${
                    isSelected ? "text-white" : "text-gray-400"
                  }`}
                >
                  {opt.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Standardized Action Controls Bar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2.5 border-t border-white/10">
        {/* Left: Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Primary Action: MULAI MAIN */}
          <button
            id="btn-start-game"
            type="button"
            onClick={() => {
              sound.play("click");
              const mapId = MAP_SELECTOR_OPTIONS[activeMapIndex].id as GameMapId;
              const diffId = DIFFICULTY_SELECTOR_OPTIONS[activeDiffIndex].id as DifficultyId;
              onStart?.(diffId, mapId);
            }}
            className="flex-1 sm:flex-initial px-6 sm:px-8 h-11 sm:h-12 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-[#00d2eb] hover:from-cyan-300 hover:to-cyan-400 text-black font-display font-black text-xs sm:text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.45)] hover:shadow-[0_0_30px_rgba(0,229,255,0.65)] hover:scale-[1.03] active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>MULAI MAIN</span>
          </button>

          {/* Secondary Action: Armada Polisi */}
          <button
            id="btn-open-police-fleet"
            type="button"
            onClick={() => {
              sound.play("click");
              onOpenFleet?.();
            }}
            className="px-3.5 h-11 sm:h-12 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 hover:text-white font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm min-h-[44px] shrink-0"
          >
            <Siren className="w-3.5 h-3.5 text-cyan-400" />
            <span>Armada Polisi ({fleetCount})</span>
          </button>
        </div>

        {/* Right: Clean Keyboard Controls Guide */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] text-gray-400 font-mono">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[9.5px] border border-white/15">
              W A S D
            </kbd>
            <span>Kemudi</span>
          </div>
          <span className="text-gray-600">·</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[9.5px] border border-white/15">
              SPASI
            </kbd>
            <span>Turbo</span>
          </div>
          <span className="text-gray-600">·</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[9.5px] border border-white/15">
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
