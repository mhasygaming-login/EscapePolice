import React, { useState } from 'react';
import { CarModelData, sound } from '../../services';
import {
  Gauge,
  Zap,
  Compass,
  Scale,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Award,
  Flame,
} from 'lucide-react';

export interface CarPerformanceComparisonProps {
  currentCar: CarModelData;
  equippedCar?: CarModelData;
  allCars?: CarModelData[];
  onSelectCar?: (carId: string) => void;
  accentColor?: string;
}

export const CarPerformanceComparison: React.FC<CarPerformanceComparisonProps> = ({
  currentCar,
  equippedCar,
  allCars = [],
  onSelectCar,
  accentColor = '#00f0ff',
}) => {
  // If no equipped car is passed, fallback to current car or first in list
  const baselineCar = equippedCar || (allCars.length > 0 ? allCars[0] : currentCar);

  // Target comparison vehicle: defaults to baseline equipped car or another car if identical
  const [compareTargetId, setCompareTargetId] = useState<string>(() => {
    if (baselineCar.id !== currentCar.id) return baselineCar.id;
    const alternative = allCars.find(c => c.id !== currentCar.id);
    return alternative ? alternative.id : currentCar.id;
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'compare' | 'single'>('compare');

  const compareCar = allCars.find(c => c.id === compareTargetId) || baselineCar;
  const isComparingSameCar = currentCar.id === compareCar.id;

  // Convert raw 0-100 speed stat to approximate real-world metric
  const formatSpeedMetric = (val: number) => {
    const kmh = Math.round(230 + (val - 70) * 4.2);
    return `${kmh} km/h`;
  };

  // Convert raw 0-100 accel stat to 0-100 km/h sprint estimation
  const formatAccelMetric = (val: number) => {
    const sec = Math.max(2.4, 5.2 - (val - 70) * 0.09).toFixed(1);
    return `${sec}s (0-100)`;
  };

  // Convert handling stat to lateral cornering Gs
  const formatHandlingMetric = (val: number) => {
    const g = (0.95 + (val - 70) * 0.015).toFixed(2);
    return `${g}G Grip`;
  };

  // Key performance specs definitions
  const performanceMetrics = [
    {
      id: 'speed',
      label: 'Top Speed',
      sublabel: 'Kecepatan Puncak',
      icon: Gauge,
      currentVal: currentCar.stats.speed,
      compareVal: compareCar.stats.speed,
      format: formatSpeedMetric,
      gradient: 'from-[#00f0ff] via-[#38bdf8] to-[#0284c7]',
      glowColor: 'rgba(0,240,255,0.4)',
    },
    {
      id: 'accel',
      label: 'Acceleration',
      sublabel: 'Akselerasi 0-100',
      icon: Zap,
      currentVal: currentCar.stats.accel ?? 85,
      compareVal: compareCar.stats.accel ?? 85,
      format: formatAccelMetric,
      gradient: 'from-[#ffb703] via-[#fb8500] to-[#f72585]',
      glowColor: 'rgba(255,183,3,0.4)',
    },
    {
      id: 'handling',
      label: 'Handling & Grip',
      sublabel: 'Kontrol & Manuver',
      icon: Compass,
      currentVal: currentCar.stats.handling,
      compareVal: compareCar.stats.handling,
      format: formatHandlingMetric,
      gradient: 'from-[#34d399] via-[#10b981] to-[#059669]',
      glowColor: 'rgba(52,211,153,0.4)',
    },
  ];

  // Calculate overall performance delta
  const speedDiff = currentCar.stats.speed - compareCar.stats.speed;
  const accelDiff = (currentCar.stats.accel ?? 85) - (compareCar.stats.accel ?? 85);
  const handlingDiff = currentCar.stats.handling - compareCar.stats.handling;
  const totalScoreDiff = speedDiff + accelDiff + handlingDiff;

  // Determine strategic advantage commentary
  const getAdvantageSummary = () => {
    if (isComparingSameCar) {
      return {
        verdict: 'MEMILIH KENDARAAN SAMA',
        detail: 'Pilih mobil lain dari daftar pembanding untuk melihat perbedaan performa secara komparatif.',
        color: 'text-gray-400',
        badgeBg: 'bg-white/5 border-white/10 text-gray-300',
      };
    }
    if (speedDiff > 3 && accelDiff > 3 && handlingDiff >= 0) {
      return {
        verdict: 'UNGGUL TELAK DI SEMUA SEKTOR',
        detail: `${currentCar.shortName} mendominasi lintasan lurus dan akselerasi keluar tikungan dibanding ${compareCar.shortName}.`,
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
      };
    }
    if (handlingDiff > 5) {
      return {
        verdict: 'MASTER TIKUNGAN & DRIFTING',
        detail: `${currentCar.shortName} memiliki grip dan kestabilan jauh lebih lincah (+${handlingDiff} Grip) untuk meloloskan diri dari kepungan polisi.`,
        color: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
      };
    }
    if (speedDiff > 5) {
      return {
        verdict: 'MONSTER KECEPATAN TERTINGGI',
        detail: `Dapur pacu ${currentCar.shortName} unggul telak (+${speedDiff} Top Speed) untuk balapan trek lurus dan jalan tol.`,
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
      };
    }
    if (totalScoreDiff < -5) {
      return {
        verdict: 'PROFIL LEBIH RINGAN / SPESIFIK',
        detail: `${compareCar.shortName} memiliki rating rata-rata lebih tinggi. Namun ${currentCar.shortName} tetap lincah untuk gaya berkendara taktis.`,
        color: 'text-[#ff2d6b]',
        badgeBg: 'bg-[#ff2d6b]/15 border-[#ff2d6b]/40 text-[#ff2d6b]',
      };
    }
    return {
      verdict: 'PERFORMA SEIMBANG (BALANCED)',
      detail: `Kedua mobil memiliki karakteristik seimbang dengan selisih yang kompetitif di setiap tikungan.`,
      color: 'text-cyan-300',
      badgeBg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200',
    };
  };

  const advantage = getAdvantageSummary();

  return (
    <div className="w-full flex flex-col gap-3 rounded-[14px] bg-[#0c101d]/80 backdrop-blur-md border border-cyan-500/30 p-3.5 sm:p-4 shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all select-none">
      {/* 1. HEADER & MODE TOGGLE */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.25)]">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-black text-[12px] sm:text-[13px] uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <span>ENGINE STATS & COMPARISON</span>
            </h3>
            <p className="text-[10px] font-mono text-[#8a99b5]">
              Analisis Komparatif Performa Mesin & Traksi
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Compare vs Single */}
        <div className="flex items-center p-0.5 rounded-lg bg-black/60 border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => {
              sound.play('click');
              setViewMode('compare');
            }}
            className={`px-2.5 py-1 rounded-[6px] text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'compare'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Bandingkan
          </button>
          <button
            type="button"
            onClick={() => {
              sound.play('click');
              setViewMode('single');
            }}
            className={`px-2.5 py-1 rounded-[6px] text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'single'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Tunggal
          </button>
        </div>
      </div>

      {/* 2. DUAL VEHICLE COMPARISON SELECTOR BAR */}
      {viewMode === 'compare' && (
        <div className="relative flex items-center justify-between gap-2 p-2 rounded-xl bg-black/50 border border-white/10">
          {/* Left Car: Active Selected */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-mono text-cyan-400 font-bold block leading-none mb-0.5">
                Pratinjau
              </span>
              <span className="text-[12px] font-display font-black text-white truncate block">
                {currentCar.shortName}
              </span>
            </div>
          </div>

          {/* Center VS Badge */}
          <div className="shrink-0 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-display font-black text-gray-300">
            VS
          </div>

          {/* Right Car: Comparison Target with Dropdown Selector */}
          <div className="flex-1 min-w-0 relative">
            <button
              type="button"
              onClick={() => {
                sound.play('click');
                setIsDropdownOpen(prev => !prev)}
              }
              className="w-full flex items-center justify-between gap-1 p-1.5 rounded-lg bg-[#141b2d] hover:bg-[#1a233a] border border-white/15 hover:border-cyan-400/50 text-left transition-all cursor-pointer"
            >
              <div className="min-w-0">
                <span className="text-[8.5px] uppercase font-mono text-[#8a99b5] font-bold block leading-none mb-0.5">
                  Lawan Banding
                </span>
                <span className="text-[11.5px] font-display font-bold text-gray-200 truncate block">
                  {compareCar.shortName}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 sm:w-64 max-h-56 overflow-y-auto rounded-xl bg-[#090d1a] border border-cyan-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.9),0_0_15px_rgba(0,240,255,0.2)] p-1 z-30 custom-scrollbar">
                <div className="px-2 py-1 text-[9px] font-mono text-gray-400 border-b border-white/10 mb-1">
                  PILIH MOBIL UNTUK DIBANDINGKAN:
                </div>
                {allCars.map(c => {
                  const isCurrent = c.id === currentCar.id;
                  const isSelectedCompare = c.id === compareCar.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        sound.play('click');
                        setCompareTargetId(c.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11px] font-display font-bold transition-all cursor-pointer ${
                        isSelectedCompare
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[13px]">{c.country.slice(0, 2)}</span>
                        <span className="truncate">{c.name}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-[8.5px] font-mono text-cyan-400 px-1 py-0.2 rounded bg-cyan-400/10">
                          Aktif
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. PERFORMANCE STATS VISUALIZATION BARS */}
      <div className="flex flex-col gap-3 pt-1">
        {performanceMetrics.map(stat => {
          const StatIcon = stat.icon;
          const diff = stat.currentVal - stat.compareVal;
          const hasDiff = !isComparingSameCar && viewMode === 'compare';

          return (
            <div
              key={stat.id}
              className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 transition-all"
            >
              {/* Stat Header & Values */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <StatIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <span className="text-[11px] sm:text-[11.5px] font-display font-bold text-gray-200">
                      {stat.label}
                    </span>
                    <span className="text-[9px] font-mono text-[#718096] ml-1.5 hidden sm:inline">
                      ({stat.sublabel})
                    </span>
                  </div>
                </div>

                {/* Values & Delta Indicator */}
                <div className="flex items-center gap-2 font-mono tabular-nums">
                  {/* Current Car Value */}
                  <span className="text-[13px] font-display font-black text-cyan-300">
                    {stat.currentVal}
                    <span className="text-[10px] text-gray-400 font-normal">/100</span>
                  </span>

                  {/* Compared Car Value & Delta (in compare mode) */}
                  {hasDiff && (
                    <div className="flex items-center gap-1.5 text-[10.5px]">
                      <span className="text-gray-400">vs {stat.compareVal}</span>
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[5px] text-[10px] font-black tracking-tight ${
                          diff > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                            : diff < 0
                            ? 'bg-[#ff2d6b]/20 text-[#ff2d6b] border border-[#ff2d6b]/40 shadow-[0_0_8px_rgba(255,45,107,0.3)]'
                            : 'bg-white/10 text-gray-400'
                        }`}
                      >
                        {diff > 0 ? (
                          <>
                            <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                            <span>+{diff}</span>
                          </>
                        ) : diff < 0 ? (
                          <>
                            <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                            <span>{diff}</span>
                          </>
                        ) : (
                          <>
                            <Minus className="w-2.5 h-2.5" />
                            <span>0</span>
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dual Visual Progress Bars */}
              <div className="flex flex-col gap-1 w-full pt-0.5">
                {/* 1. Current Car Bar (Cyan Neon High-Intensity) */}
                <div className="w-full h-2 rounded-full bg-[#0a0f1d] border border-white/10 overflow-hidden relative p-[1px]">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${stat.gradient} transition-all duration-400 ease-out relative shadow-[0_0_10px_rgba(0,240,255,0.5)]`}
                    style={{ width: `${Math.max(5, stat.currentVal)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/35 to-transparent" />
                  </div>
                </div>

                {/* 2. Compared Car Bar (Ghost / Secondary Bar in compare mode) */}
                {hasDiff && (
                  <div className="w-full h-1.5 rounded-full bg-[#0a0f1d]/70 border border-white/5 overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gray-500 via-gray-300 to-gray-400 opacity-60 transition-all duration-400 ease-out"
                      style={{ width: `${Math.max(5, stat.compareVal)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Real World Performance Estimate Footer */}
              <div className="flex items-center justify-between text-[9px] font-mono text-[#8a99b5] pt-0.5">
                <span>Estimasi Lap: {stat.format(stat.currentVal)}</span>
                {hasDiff && (
                  <span className="text-gray-400">
                    Lawan: {stat.format(stat.compareVal)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. POWERTRAIN & ENGINE SPECS CHIPS */}
      <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-black/40 border border-white/5 text-[10.5px]">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[8.5px] font-mono uppercase text-[#718096] block leading-none mb-0.5">
              Tenaga Mesin
            </span>
            <span className="font-display font-black text-amber-300 truncate block">
              {currentCar.hp} HP
              {viewMode === 'compare' && !isComparingSameCar && (
                <span className={`ml-1 text-[9px] font-mono ${currentCar.hp >= compareCar.hp ? 'text-emerald-400' : 'text-[#ff2d6b]'}`}>
                  ({currentCar.hp >= compareCar.hp ? `+${currentCar.hp - compareCar.hp}` : currentCar.hp - compareCar.hp})
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[8.5px] font-mono uppercase text-[#718096] block leading-none mb-0.5">
              Tipe Mesin
            </span>
            <span className="font-mono text-gray-200 truncate block text-[10px]" title={currentCar.engine}>
              {currentCar.engine.split(' ')[0]} {currentCar.engine.split(' ')[1] || ''}
            </span>
          </div>
        </div>
      </div>

      {/* 5. STRATEGIC ADVANTAGE VERDICT BANNER */}
      {viewMode === 'compare' && (
        <div className="p-2.5 rounded-xl bg-[#080d1a] border border-white/10 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider">
                ANALISIS KOMPARASI:
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-display font-black uppercase tracking-wider ${advantage.badgeBg}`}>
              {advantage.verdict}
            </span>
          </div>
          <p className="text-[11px] text-gray-300 font-medium leading-relaxed">
            {advantage.detail}
          </p>
        </div>
      )}
    </div>
  );
};
