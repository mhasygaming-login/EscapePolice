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
  type LucideIcon,
} from "lucide-react";
import { GameMapId } from "../../types/maps";
import { sound } from "../../services/audio";

export type DifficultyId = "santai" | "normal" | "sulit" | "maxxx";

export interface SelectorOption {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  image: string;
  position: string;
  icon: LucideIcon;
  color: string;
  gradientOverlay: string;
}

// Background assets
const HERO_IMAGE = "/cyberpunk_lobby_bg.jpg";

// Map Background Images
const MAP_IMG_KOTA = "/maps/kota.jpg";
const MAP_IMG_SALJU = "/maps/salju.jpg";
const MAP_IMG_PADANG_PASIR = "/maps/padang_pasir.jpg";
const MAP_IMG_HUTAN = "/maps/hutan.jpg";
const MAP_IMG_PEGUNUNGAN = "/maps/pegunungan.jpg";

// 5 Pilihan Peta (Maps) - Tema Visual & Vibes Khas
export const MAP_SELECTOR_OPTIONS: SelectorOption[] = [
  {
    id: "kota",
    title: "METROPOLIS KOTA",
    subtitle: "Kota Cyberpunk",
    description: "Jalan Tol Layang Neocities & Gedung Bertingkat",
    image: MAP_IMG_KOTA,
    position: "center center",
    icon: Building2,
    color: "#00f0ff",
    gradientOverlay: "linear-gradient(180deg, rgba(0, 240, 255, 0.15) 0%, rgba(7, 8, 20, 0.88) 100%)",
  },
  {
    id: "salju",
    title: "PUNCAK SALJU",
    subtitle: "Arktik & Aurora",
    description: "Hutan Pinus Beku, Kabin Hangat & Aurora Borealis",
    image: MAP_IMG_SALJU,
    position: "center center",
    icon: Snowflake,
    color: "#38bdf8",
    gradientOverlay: "linear-gradient(180deg, rgba(56, 189, 248, 0.18) 0%, rgba(9, 18, 34, 0.88) 100%)",
  },
  {
    id: "padang_pasir",
    title: "PADANG PASIR",
    subtitle: "Ngarai Outlaw",
    description: "Tebing Merah, Bukit Pasir Emas & Aspal Gurun",
    image: MAP_IMG_PADANG_PASIR,
    position: "center center",
    icon: Flame,
    color: "#fb923c",
    gradientOverlay: "linear-gradient(180deg, rgba(251, 146, 60, 0.18) 0%, rgba(28, 14, 8, 0.88) 100%)",
  },
  {
    id: "hutan",
    title: "HUTAN NEON",
    subtitle: "Hutan Hujan Tropis",
    description: "Pohon Purba, Tabung Neon Hijau & Aspal Basah",
    image: MAP_IMG_HUTAN,
    position: "center center",
    icon: Trees,
    color: "#34d399",
    gradientOverlay: "linear-gradient(180deg, rgba(52, 211, 153, 0.18) 0%, rgba(6, 24, 18, 0.88) 100%)",
  },
  {
    id: "pegunungan",
    title: "PEGUNUNGAN",
    subtitle: "Skyline Canyon Pass",
    description: "Jalanan Berliku Tajam di Lereng Tebing Curam",
    image: MAP_IMG_PEGUNUNGAN,
    position: "center center",
    icon: Mountain,
    color: "#c084fc",
    gradientOverlay: "linear-gradient(180deg, rgba(192, 132, 252, 0.18) 0%, rgba(22, 11, 35, 0.88) 100%)",
  },
];

// 4 Pilihan Tingkat Kesulitan
export const DIFFICULTY_SELECTOR_OPTIONS: SelectorOption[] = [
  {
    id: "santai",
    title: "SANTAI",
    subtitle: "Mode Santai",
    description: "Trafik lengang, polisi lambat & ramah",
    badge: "EASY",
    image: HERO_IMAGE,
    position: "8% center",
    icon: Leaf,
    color: "#34d399",
    gradientOverlay: "linear-gradient(180deg, rgba(52, 211, 153, 0.16) 0%, rgba(7, 8, 20, 0.88) 100%)",
  },
  {
    id: "normal",
    title: "NORMAL",
    subtitle: "Tantangan Standar",
    description: "Kecepatan seimbang, barikade standar",
    badge: "BALANCED",
    image: HERO_IMAGE,
    position: "36% center",
    icon: Gauge,
    color: "#00e5ff",
    gradientOverlay: "linear-gradient(180deg, rgba(0, 229, 255, 0.18) 0%, rgba(7, 8, 20, 0.88) 100%)",
  },
  {
    id: "sulit",
    title: "SULIT",
    subtitle: "Kejaran Agresif",
    description: "Polisi agresif, SUV patroli & spike strips",
    badge: "CHALLENGE",
    image: HERO_IMAGE,
    position: "64% center",
    icon: Flame,
    color: "#f59e0b",
    gradientOverlay: "linear-gradient(180deg, rgba(245, 158, 11, 0.20) 0%, rgba(7, 8, 20, 0.88) 100%)",
  },
  {
    id: "maxxx",
    title: "MAXXX",
    subtitle: "Kejaran Brutal",
    description: "Armada helikopter, EMP & kejaran tanpa ampun",
    badge: "EXTREME",
    image: HERO_IMAGE,
    position: "92% center",
    icon: Skull,
    color: "#f43f5e",
    gradientOverlay: "linear-gradient(180deg, rgba(244, 63, 94, 0.22) 0%, rgba(7, 8, 20, 0.90) 100%)",
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

  const [animatedOptions, setAnimatedOptions] = useState<number[]>([]);

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

  useEffect(() => {
    setAnimatedOptions([]);
    const currentList = activeMode === "map" ? MAP_SELECTOR_OPTIONS : DIFFICULTY_SELECTOR_OPTIONS;
    const timers = currentList.map((_, i) =>
      setTimeout(() => setAnimatedOptions((prev) => [...prev, i]), 70 * i)
    );
    return () => timers.forEach(clearTimeout);
  }, [activeMode]);

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
  const selectedDiffOption = DIFFICULTY_SELECTOR_OPTIONS[activeDiffIndex] || DIFFICULTY_SELECTOR_OPTIONS[1];

  return (
    <section
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="relative flex w-full flex-col items-center justify-center p-3.5 sm:p-5 text-[var(--ep-text)] select-none focus:outline-none"
    >
      {/* ── 1. Standardized Header Grid ────────────────────────────────────────── */}
      <div className="w-full max-w-[900px] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pb-3 border-b border-white/10 mb-3.5">
        <div className="sm:col-span-7">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black tracking-wider uppercase text-white leading-tight">
            ESCAPE <span className="text-[var(--ep-accent)] text-glow-cyan">POLICE</span>
          </h1>
          <p className="text-[11px] text-gray-400 font-medium hidden sm:block mt-0.5">
            Kejar-kejaran Kecepatan Tinggi Lawan Armada Polisi di Jalan Raya
          </p>
        </div>

        {/* Mode Switcher Tabs (Map vs Difficulty) */}
        <div className="sm:col-span-5 flex items-center justify-start sm:justify-end">
          <div className="grid grid-cols-2 gap-1 p-1 bg-black/60 border border-white/10 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                sound.play("click");
                setActiveMode("map");
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeMode === "map"
                  ? "bg-cyan-500 text-black shadow-sm shadow-cyan-500/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Arena ({MAP_SELECTOR_OPTIONS.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.play("click");
                setActiveMode("difficulty");
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeMode === "difficulty"
                  ? "bg-fuchsia-500 text-white shadow-sm shadow-fuchsia-500/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Kesulitan ({DIFFICULTY_SELECTOR_OPTIONS.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Standardized Configuration & Telemetry Grid (3 Columns) ───────── */}
      <div className="w-full max-w-[900px] grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-3.5">
        {/* Card 1: Active Car */}
        <div className="bg-[#0b0c19]/90 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm">
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Mobil Aktif
            </span>
            <div className="font-display font-black text-white text-xs sm:text-sm truncate">
              {carName}{" "}
              <span className="text-[var(--ep-accent)] font-mono text-[10px]">
                ({carHp} HP)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.play("click");
              onChangeCar?.();
            }}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
          >
            Ganti
          </button>
        </div>

        {/* Card 2: Selected Map */}
        <button
          type="button"
          onClick={() => {
            sound.play("click");
            setActiveMode("map");
          }}
          className={`border rounded-xl p-2.5 flex items-center justify-between gap-2 text-left transition-all cursor-pointer ${
            activeMode === "map"
              ? "bg-cyan-950/30 border-cyan-500/40 shadow-sm shadow-cyan-500/10"
              : "bg-[#0b0c19]/90 border-white/10 hover:border-white/20"
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Peta Lokasi
            </span>
            <div className="font-display font-bold text-white text-xs sm:text-sm truncate flex items-center gap-1.5">
              <span style={{ color: selectedMapOption.color }}>●</span>
              <span>{selectedMapOption.title}</span>
            </div>
          </div>
          <span className="text-[10px] text-cyan-400 font-bold uppercase font-mono">
            Ubah
          </span>
        </button>

        {/* Card 3: Selected Difficulty */}
        <button
          type="button"
          onClick={() => {
            sound.play("click");
            setActiveMode("difficulty");
          }}
          className={`border rounded-xl p-2.5 flex items-center justify-between gap-2 text-left transition-all cursor-pointer ${
            activeMode === "difficulty"
              ? "bg-fuchsia-950/30 border-fuchsia-500/40 shadow-sm shadow-fuchsia-500/10"
              : "bg-[#0b0c19]/90 border-white/10 hover:border-white/20"
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Level Kesulitan
            </span>
            <div className="font-display font-bold text-white text-xs sm:text-sm truncate flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: selectedDiffOption.color }}
              />
              <span>{selectedDiffOption.title}</span>
              <span
                className="text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold"
                style={{
                  backgroundColor: `${selectedDiffOption.color}25`,
                  color: selectedDiffOption.color,
                }}
              >
                {selectedDiffOption.badge}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-fuchsia-400 font-bold uppercase font-mono">
            Ubah
          </span>
        </button>
      </div>

      {/* ── 3. Options Interactive Accordion Grid ────────────────────────────── */}
      <div
        role="radiogroup"
        aria-label={activeMode === "map" ? "Pilihan Arena Peta" : "Pilihan Tingkat Kesulitan"}
        className="options relative flex h-[clamp(210px,32vh,280px)] w-full max-w-[900px] flex-col items-stretch overflow-hidden rounded-2xl md:h-[clamp(185px,26vh,250px)] md:flex-row shadow-2xl border border-[var(--ep-border)]/50"
      >
        {currentOptions.map((option, index) => {
          const isActive = currentActiveIndex === index;
          const isShown = animatedOptions.includes(index);
          const Icon = option.icon;
          const accentColor = option.color || "var(--ep-accent)";

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={option.title}
              onClick={() => handleOptionClick(index)}
              className="option relative flex min-h-[44px] min-w-0 flex-col justify-end overflow-hidden text-left transition-all duration-500 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ep-accent)] md:min-h-0 md:min-w-[54px]"
              style={{
                backgroundImage: `${option.gradientOverlay}, url('${option.image}')`,
                backgroundSize: isActive ? "cover, auto 100%" : "cover, auto 120%",
                backgroundPosition: `center, ${option.position}`,
                backgroundRepeat: "no-repeat",
                backgroundColor: "var(--ep-surface)",
                backfaceVisibility: "hidden",
                opacity: isShown ? 1 : 0,
                transform: isShown ? "translateX(0)" : "translateX(-30px)",
                borderWidth: "2px",
                borderStyle: "solid",
                borderColor: isActive ? accentColor : "var(--ep-border)",
                cursor: "pointer",
                boxShadow: isActive
                  ? `0 20px 60px rgba(0,0,0,0.50), 0 0 24px ${accentColor}55`
                  : "0 10px 30px rgba(0,0,0,0.30)",
                flex: isActive ? "6 1 0%" : "1 1 0%",
                zIndex: isActive ? 10 : 1,
                willChange: "flex-grow, box-shadow, background-size, background-position",
              }}
            >
              {/* Bottom vignette shadow */}
              <span
                aria-hidden
                className="shadow pointer-events-none absolute inset-x-0 h-[100px] transition-all duration-500 ease-out"
                style={{
                  bottom: isActive ? "0" : "-30px",
                  boxShadow: isActive
                    ? "inset 0 -100px 100px -100px var(--ep-bg), inset 0 -100px 100px -60px var(--ep-bg)"
                    : "inset 0 -100px 0px -100px var(--ep-bg), inset 0 -100px 0px -60px var(--ep-bg)",
                }}
              />

              {/* Label: Icon + Info */}
              <span className="label pointer-events-none absolute inset-x-0 bottom-3 z-[2] flex h-11 w-full items-center justify-start gap-3 px-3">
                <span
                  className="icon flex h-10 w-10 min-w-10 max-w-10 flex-shrink-0 flex-grow-0 items-center justify-center rounded-xl border-2 bg-[var(--ep-surface-glass)] shadow-md backdrop-blur-[10px] transition-all duration-200"
                  style={{
                    borderColor: isActive ? accentColor : "var(--ep-border)",
                    boxShadow: isActive ? `0 0 14px ${accentColor}66` : "none",
                  }}
                >
                  <Icon
                    size={20}
                    style={{ color: isActive ? accentColor : "var(--ep-text)" }}
                  />
                </span>

                <span className="info relative text-[var(--ep-text)] overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span
                      className="main block text-sm sm:text-base font-display font-extrabold transition-all duration-500 ease-out tracking-wide uppercase truncate"
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? "translateX(0)" : "translateX(15px)",
                      }}
                    >
                      {option.title}
                    </span>
                    {option.badge && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono"
                        style={{
                          backgroundColor: `${accentColor}30`,
                          color: accentColor,
                          opacity: isActive ? 1 : 0,
                        }}
                      >
                        {option.badge}
                      </span>
                    )}
                  </div>

                  {option.description && (
                    <span
                      className="sub block text-xs text-[var(--ep-text-muted)] transition-all duration-500 ease-out truncate max-w-[280px] sm:max-w-[380px]"
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? "translateX(0)" : "translateX(15px)",
                      }}
                    >
                      {option.description}
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 4. Standardized Action Controls Grid ─────────────────────────────── */}
      <div className="mt-4 w-full max-w-[900px] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Left (8 cols): Primary & Secondary Buttons */}
        <div className="sm:col-span-8 flex items-center gap-3 w-full">
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
            className="flex-1 sm:flex-none px-8 h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-display font-black text-sm sm:text-base tracking-widest flex items-center justify-center gap-2.5 shadow-[0_0_24px_rgba(0,229,255,0.4)] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Play size={18} fill="currentColor" strokeWidth={2.5} />
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
            className="px-4 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-cyan-400 hover:text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm min-h-[44px]"
          >
            <Siren size={15} />
            <span>Armada Polisi ({fleetCount})</span>
          </button>
        </div>

        {/* Right (4 cols): Minimalist Controls Guide */}
        <div className="sm:col-span-4 hidden sm:flex items-center justify-end gap-1.5 text-[11px] text-gray-400 font-mono">
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">WASD</kbd>
          <span>Kemudi</span>
          <span className="text-gray-600">·</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">SPASI</kbd>
          <span>Nitro</span>
          <span className="text-gray-600">·</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">E</kbd>
          <span>EMP</span>
        </div>
      </div>
    </section>
  );
};

export default InteractiveSelector;
