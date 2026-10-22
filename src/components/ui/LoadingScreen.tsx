import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FastForward, Zap, Shield, Radio, Volume2 } from 'lucide-react';
import { sound } from '../../services';

interface LoadingScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
  isReady?: boolean;
  carModel?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onFinish,
  minDurationMs = 2200,
  isReady = true,
  carModel = 'civic_fl5',
}) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const finishedRef = useRef(false);
  
  // Strict single-trigger flag for 50% engine rev sound
  const hasRevTriggeredRef = useRef(false);

  const letters = ['L', 'O', 'A', 'D', 'I', 'N', 'G'];

  // 1. Audio Preloading & Autoplay Policy Handling
  useEffect(() => {
    // Warm up the AudioContext immediately
    try {
      sound.ensureContext();
    } catch {}

    // Register passive one-time gesture listeners to seamlessly unlock AudioContext
    const unlockAudio = () => {
      try {
        const ctx = sound.ensureContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      } catch {}
    };

    const unlockEvents = ['pointerdown', 'touchstart', 'keydown', 'click'];
    unlockEvents.forEach(evt => window.addEventListener(evt, unlockAudio, { once: true, passive: true }));

    return () => {
      unlockEvents.forEach(evt => window.removeEventListener(evt, unlockAudio));
    };
  }, []);

  // 2. Smooth progress incrementing to 100%
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const calculatedProgress = Math.min(100, (elapsed / minDurationMs) * 100);

      setProgress(prev => {
        // Natural ease-out progression
        const target = calculatedProgress;
        const next = prev + (target - prev) * 0.25 + 0.5;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(100, next);
      });
    }, 30);

    return () => clearInterval(interval);
  }, [minDurationMs]);

  // 3. Dynamic 'engine-rev' sound trigger strictly once at 50% synchronized with CSS scale pulse
  const triggerEngineRev = useCallback(() => {
    if (hasRevTriggeredRef.current) return;
    hasRevTriggeredRef.current = true;

    // Trigger audio safely handling browser autoplay policies
    try {
      const ctx = sound.ensureContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      sound.playRetroSynthEngineRev(carModel);
    } catch {
      // Audio autoplay policy fallback gracefully handled
    }

    // Trigger synchronized visual scale pulse & neon glow burst
    setIsPulsing(true);
    const pulseTimer = setTimeout(() => {
      setIsPulsing(false);
    }, 750);
    return () => clearTimeout(pulseTimer);
  }, [carModel]);

  useEffect(() => {
    if (progress >= 50 && !hasRevTriggeredRef.current) {
      triggerEngineRev();
    }
  }, [progress, triggerEngineRev]);

  // 4. Handle completion when progress reaches 100% and system isReady
  useEffect(() => {
    if (progress >= 100 && isReady && !finishedRef.current) {
      finishedRef.current = true;
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
        const completeTimer = setTimeout(() => {
          if (onFinish) onFinish();
        }, 400); // 400ms fade-out transition
        return () => clearTimeout(completeTimer);
      }, 250);
      return () => clearTimeout(exitTimer);
    }
  }, [progress, isReady, onFinish]);

  const handleSkip = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setProgress(100);
    setIsExiting(true);
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 250);
  };

  // Status message based on current progress bracket
  const getStatusText = (pct: number) => {
    if (isPulsing) return '⚡ TURBO SYNTH ENGINE REV ENGAGED [50%]';
    if (pct < 28) return 'INITIALIZING CYBER ENGINE & AUDIO DRIVERS';
    if (pct < 58) return 'CACHING NEON TRACKS & VEHICLE FLEET';
    if (pct < 88) return 'SYNCING DRIVER PROFILE & MULTIPLAYER GRID';
    return 'SYSTEM OPTIMIZED. LAUNCHING CYBER PURSUIT';
  };

  return (
    <div
      role="status"
      aria-label="Loading Escape the Police: Cyber Pursuit"
      onClick={() => {
        // Transparent user-interaction unlock for AudioContext
        try {
          const ctx = sound.ensureContext();
          if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
        } catch {}
      }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 sm:p-10 bg-[#070814] select-none overflow-hidden transition-opacity duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isExiting ? 'opacity-0 pointer-events-none scale-102' : 'opacity-100'
      }`}
    >
      {/* 1. ATMOSPHERIC BACKGROUND EFFECTS */}
      {/* Ambient Cyber Grid */}
      <div className="absolute inset-0 bg-subtle-grid opacity-60 pointer-events-none" />

      {/* Central Cyber Glow (intensifies dynamically on 50% engine rev pulse) */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[300px] sm:h-[420px] bg-gradient-to-r from-[#00f0ff]/15 via-[#e12afb]/12 to-[#00f0ff]/15 blur-[90px] rounded-full pointer-events-none transition-all duration-300 ${
          isPulsing ? 'scale-125 opacity-100 !bg-gradient-to-r !from-[#00f0ff]/30 !via-[#e12afb]/25 !to-[#00f0ff]/30 blur-[110px]' : 'opacity-60'
        }`}
      />

      {/* Speed Streaks in the distance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-[28%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/20 to-transparent animate-speed-streak ${
            isPulsing ? '!h-[2px] !via-[#00f0ff]/60' : ''
          }`}
          style={{ animationDelay: '0s' }}
        />
        <div
          className={`absolute top-[62%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e12afb]/25 to-transparent animate-speed-streak ${
            isPulsing ? '!h-[2px] !via-[#e12afb]/70' : ''
          }`}
          style={{ animationDelay: '0.6s' }}
        />
        <div
          className={`absolute top-[82%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/15 to-transparent animate-speed-streak ${
            isPulsing ? '!h-[2px] !via-[#00f0ff]/50' : ''
          }`}
          style={{ animationDelay: '1.1s' }}
        />
      </div>

      {/* 2. TOP BAR - SYSTEM BRAND & TELEMETRY */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-[8px] bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] transition-all duration-300 ${
              isPulsing
                ? 'shadow-[0_0_20px_rgba(0,240,255,0.7)] scale-110 !border-[#00f0ff]'
                : 'shadow-[0_0_12px_rgba(0,240,255,0.25)]'
            }`}
          >
            <Zap className={`w-4 h-4 fill-current ${isPulsing ? 'text-white' : 'animate-pulse'}`} />
          </div>
          <div>
            <div className="font-display font-extrabold text-[13px] tracking-[0.18em] text-white flex items-center gap-1.5">
              <span>CYBER PURSUIT</span>
              <span className="text-[#00f0ff] text-[10px] tracking-normal font-mono-code px-1.5 py-0.5 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/25">
                v2.4
              </span>
            </div>
            <div className="text-[10px] font-mono-code text-[#62708b] tracking-wider uppercase">
              HIGH-OCTANE SYSTEM BOOT
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 font-mono-code text-[11px] text-[#718096]">
          {isPulsing ? (
            <span className="flex items-center gap-1.5 text-[#00f0ff] animate-pulse">
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              <span className="font-bold">SYNTH REV ENGAGED · 50%</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#34d399] animate-pulse" />
              <span className="text-[#9aa5ba]">AUDIO</span>
              <span className="text-[#34d399] font-semibold">PRELOADED</span>
            </span>
          )}
          <span className="text-[#2a3449]">·</span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="text-[#9aa5ba]">SECURITY</span>
            <span className="text-[#00f0ff] font-semibold">ENCRYPTED</span>
          </span>
        </div>
      </header>

      {/* 3. CENTER CONTENT - ANIMATED LOADING TEXT & CAR PROGRESS BAR */}
      <div className="relative z-10 w-full max-w-xl sm:max-w-2xl flex flex-col items-center justify-center my-auto px-4">
        {/* Subtle decorative top rule */}
        <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff]/60 to-transparent mb-6" />

        {/* Centerpiece: Staggered Gradient Shimmer LOADING Text */}
        <div className="flex items-baseline justify-center select-none mb-3">
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl tracking-[0.22em] uppercase flex items-center pl-[0.22em]">
            {letters.map((char, idx) => (
              <span
                key={`${char}-${idx}`}
                className="animate-shimmer-letter transition-transform hover:scale-110 cursor-default"
                style={{
                  animationDelay: `${idx * 85}ms`,
                }}
              >
                {char}
              </span>
            ))}
          </h1>

          {/* Rhythmic Pulsing Cyber Dots */}
          <span className="inline-flex items-center gap-1 ml-1.5 sm:ml-2.5 pb-2">
            <span
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-pulse"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#e12afb] shadow-[0_0_8px_#e12afb] animate-pulse"
              style={{ animationDelay: '200ms' }}
            />
            <span
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-pulse"
              style={{ animationDelay: '400ms' }}
            />
          </span>
        </div>

        {/* Sub-headline slogan */}
        <p className="text-[12px] sm:text-[13px] font-manrope font-medium text-[#7d8ba1] tracking-[0.14em] uppercase text-center mb-10">
          Retro-Futuristic Police Pursuit Racing
        </p>

        {/* 4. PROGRESS BAR CONTAINER WITH SPORTS CAR SILHOUETTE ON TOP */}
        <div className="w-full relative pt-12 pb-2">
          {/* Sports Car Silhouette Riding On Progress Bar */}
          <div
            className={`absolute top-0 -translate-y-[4px] -translate-x-1/2 pointer-events-none transition-all duration-100 ease-out z-20 ${
              isPulsing ? 'scale-115 -translate-y-2' : ''
            }`}
            style={{
              left: `${Math.max(4, Math.min(96, progress))}%`,
            }}
          >
            <div className="relative animate-car-bounce flex flex-col items-center">
              {/* Dual Plasma Exhaust Burst (surges violently on 50% engine rev pulse) */}
              <div className="absolute top-[16px] -left-[14px] flex flex-col gap-[3px] pointer-events-none">
                <span
                  className={`rounded-full bg-gradient-to-l from-[#00f0ff] via-[#e12afb] to-transparent animate-exhaust shadow-[0_0_8px_#00f0ff] transition-all duration-200 ${
                    isPulsing ? 'w-8 h-[5px] scale-x-150 !shadow-[0_0_18px_#00f0ff]' : 'w-4 h-[3px]'
                  }`}
                />
                <span
                  className={`rounded-full bg-gradient-to-l from-[#00f0ff] to-transparent animate-exhaust shadow-[0_0_6px_#00f0ff] transition-all duration-200 ${
                    isPulsing ? 'w-6 h-[4px] scale-x-125 !shadow-[0_0_14px_#e12afb]' : 'w-3 h-[2px]'
                  }`}
                  style={{ animationDelay: '60ms' }}
                />
              </div>

              {/* Sports Car SVG Silhouette */}
              <svg
                width="64"
                height="28"
                viewBox="0 0 84 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-all duration-200 ${
                  isPulsing
                    ? 'filter drop-shadow-[0_4px_18px_rgba(0,240,255,0.95)]'
                    : 'filter drop-shadow-[0_4px_10px_rgba(0,240,255,0.45)]'
                }`}
              >
                {/* Car Body Silhouette */}
                <path
                  d="M4 22L12 14L22 10L36 9L54 9L68 15L78 19L82 23L81 26L77 27H8L4 25V22Z"
                  fill="#0e1322"
                  stroke={isPulsing ? '#ffffff' : '#00f0ff'}
                  strokeWidth={isPulsing ? '2' : '1.5'}
                />

                {/* Roofline & Cockpit Cabin */}
                <path
                  d="M26 10L35 3L53 3L63 11L54 11L33 11L26 10Z"
                  fill="#151b2f"
                  stroke="#22d3ee"
                  strokeWidth="1.2"
                />

                {/* Front Windshield Glow */}
                <path
                  d="M54 4L62 10H52L46 4H54Z"
                  fill="url(#windshield-glow)"
                  opacity={isPulsing ? '1' : '0.8'}
                />

                {/* Cyber GT Rear Wing / Spoiler */}
                <path
                  d="M6 14L3 8H13L10 14"
                  stroke={isPulsing ? '#ff70e0' : '#e12afb'}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Neon Taillight Bar (Red/Magenta) */}
                <rect x="4" y="21" width="3" height="4" rx="1" fill="#ff1361" className="animate-pulse" />
                <line x1="4" y1="23" x2="1" y2="23" stroke="#ff1361" strokeWidth={isPulsing ? '3' : '2'} strokeLinecap="round" />

                {/* Headlight Neon Beam (Cyan) */}
                <polygon points="80,21 83,23 80,25" fill="#00f0ff" />
                <line x1="82" y1="23" x2="84" y2="23" stroke="#ffffff" strokeWidth={isPulsing ? '3' : '2'} strokeLinecap="round" />

                {/* Front & Rear Wheels (Cyan Glowing Rims) */}
                {/* Rear Wheel */}
                <circle cx="21" cy="26" r="6.5" fill="#070913" stroke="#22d3ee" strokeWidth="1.8" />
                <circle
                  cx="21"
                  cy="26"
                  r={isPulsing ? '4' : '3'}
                  fill="#00f0ff"
                  className="animate-ping"
                  style={{ animationDuration: isPulsing ? '0.6s' : '1.2s' }}
                />

                {/* Front Wheel */}
                <circle cx="66" cy="26" r="6.5" fill="#070913" stroke="#22d3ee" strokeWidth="1.8" />
                <circle
                  cx="66"
                  cy="26"
                  r={isPulsing ? '4' : '3'}
                  fill="#00f0ff"
                  className="animate-ping"
                  style={{ animationDuration: isPulsing ? '0.6s' : '1.2s' }}
                />

                {/* Gradients */}
                <defs>
                  <linearGradient id="windshield-glow" x1="46" y1="4" x2="62" y2="10" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00f0ff" stopOpacity="0.8" />
                    <stop offset="1" stopColor="#e12afb" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Speed flare below wheels */}
              <div
                className={`h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent blur-[1px] mt-[1px] transition-all duration-200 ${
                  isPulsing ? 'w-16 !via-white' : 'w-10'
                }`}
              />
            </div>
          </div>

          {/* Progress Bar Track with synchronized CSS 'scale' pulse & neon glow burst */}
          <div className={`relative w-full ${isPulsing ? 'animate-neon-pulse-burst' : ''}`}>
            {/* Synchronized Expanding Shockwave Halo (fires precisely at 50% engine rev) */}
            {isPulsing && (
              <div className="absolute -inset-1 rounded-full border-2 border-[#00f0ff] animate-shockwave-burst pointer-events-none" />
            )}

            <div
              className={`w-full rounded-full bg-[#0d1222] p-[1.5px] overflow-hidden transition-all duration-300 ${
                isPulsing
                  ? 'h-3.5 border border-[#00f0ff] shadow-[0_0_35px_rgba(0,240,255,1),0_0_65px_rgba(225,42,251,0.85)] ring-2 ring-[#00f0ff]/60'
                  : 'h-2.5 border border-[#1b233a] shadow-[inset_0_1px_4px_rgba(0,0,0,0.8),0_0_15px_rgba(0,240,255,0.12)]'
              }`}
            >
              {/* Active Progress Fill */}
              <div
                className={`h-full rounded-full bg-gradient-to-r from-[#00f0ff] via-[#38bdf8] to-[#e12afb] transition-all duration-100 ease-out relative ${
                  isPulsing ? 'shadow-[0_0_26px_rgba(0,240,255,1)] brightness-150' : 'shadow-[0_0_14px_rgba(0,240,255,0.7)]'
                }`}
                style={{ width: `${progress}%` }}
              >
                {/* Highlight Glint */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/35 to-transparent" />
              </div>
            </div>
          </div>

          {/* Track Markers (0%, 25%, 50%, 75%, 100%) */}
          <div className="w-full flex justify-between px-1 mt-2 text-[9px] font-mono-code text-[#4a5568]">
            <span>0%</span>
            <span>25%</span>
            <span
              className={`transition-all duration-300 ${
                isPulsing
                  ? 'text-[#00f0ff] font-bold scale-125 drop-shadow-[0_0_10px_#00f0ff]'
                  : progress >= 50
                  ? 'text-[#22d3ee] font-semibold'
                  : 'text-[#4a5568]'
              }`}
            >
              50%{isPulsing ? ' ⚡REV' : ''}
            </span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 5. TELEMETRY & DIGITAL PERCENTAGE DISPLAY */}
        <div className="w-full flex items-center justify-between gap-4 mt-2">
          {/* Dynamic Status Text */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isPulsing
                  ? 'bg-[#ffffff] shadow-[0_0_12px_#00f0ff] scale-125 animate-ping'
                  : 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-ping'
              }`}
            />
            <span
              className={`text-[11px] sm:text-[12px] font-mono-code tracking-[0.06em] truncate transition-colors duration-200 ${
                isPulsing ? 'text-[#00f0ff] font-bold drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-[#a0aec0]'
              }`}
            >
              {getStatusText(progress)}
            </span>
          </div>

          {/* Numeric Percentage */}
          <div
            className={`font-mono-code font-bold text-[16px] sm:text-[18px] tracking-tight shrink-0 transition-all duration-200 ${
              isPulsing
                ? 'text-white scale-110 drop-shadow-[0_0_16px_rgba(0,240,255,0.9)]'
                : 'text-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
            }`}
          >
            {Math.round(progress)}
            <span className="text-[12px] text-[#718096] font-normal ml-0.5">%</span>
          </div>
        </div>
      </div>

      {/* 6. FOOTER - QUICK CONTROLS & SKIP BUTTON */}
      <footer className="relative z-10 w-full max-w-4xl flex items-center justify-between pb-2 border-t border-[#131a2b] pt-4">
        <div className="text-[11px] font-manrope text-[#606d84] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]/50" />
          <span>Gunakan tombol panah atau tombol layar sentuh untuk mengemudi</span>
        </div>

        {/* Skip Button (Touch target >= 44px) */}
        <button
          type="button"
          onClick={handleSkip}
          className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-[10px] bg-[#0c111f] hover:bg-[#131b2e] border border-[#202940] hover:border-[#00f0ff]/50 text-[#9aa5ba] hover:text-[#00f0ff] font-manrope font-semibold text-[12px] tracking-wider inline-flex items-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
        >
          <span>LEWATI</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
};
