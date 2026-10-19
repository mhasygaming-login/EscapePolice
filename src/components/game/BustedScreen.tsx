import React, { useEffect } from 'react';
import { RotateCcw, Trophy, Menu, ChevronRight, Skull, Star, Film } from 'lucide-react';
import { sound } from '../../services';
const cyberpunkRoadblockBg = '/assets/cyberpunk_police_roadblock.jpg';

export interface BustedScreenProps {
  score: number;
  distance: number;
  dodgedCount: number;
  bountyEarned?: number;
  highScore?: number;
  isNewHighScore?: boolean;
  latestLeaderboardRank?: number | null;
  scoreSavedStatus?: 'idle' | 'saving' | 'saved' | 'unregistered';
  activeMap?: {
    id: string;
    name: string;
    icon: string;
  };
  lastReplayId?: string | null;
  onRestart: () => void;
  onOpenLeaderboard?: () => void;
  onWatchReplay?: (replayId?: string) => void;
  onBackToMenu: () => void;
  onOpenMapSelect?: () => void;
}

export const BustedScreen: React.FC<BustedScreenProps> = ({
  score,
  distance,
  dodgedCount,
  bountyEarned,
  highScore,
  isNewHighScore,
  latestLeaderboardRank,
  scoreSavedStatus,
  activeMap,
  lastReplayId,
  onRestart,
  onOpenLeaderboard,
  onWatchReplay,
  onBackToMenu,
  onOpenMapSelect,
}) => {
  // Support quick keyboard restart / menu exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRestart();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        onBackToMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart, onBackToMenu]);

  // Display record: use highScore or score if it's the highest
  const displayRecord = highScore ? Math.max(highScore, score) : score;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Layar Hasil Tertangkap Polisi"
      className="relative w-full h-full max-h-full flex flex-col items-center justify-between overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-cyan-500/30 px-3 py-2 sm:px-6 sm:py-3 select-none animate-fadeIn bg-slate-950 text-white"
    >
      {/* 1. Cinematic Background: Police Roadblock with Wet Asphalt & Rain Reflections */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <img
          src={cyberpunkRoadblockBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen pointer-events-none filter brightness-95 contrast-125 scale-105"
        />

        {/* Ambient Dark Blue & Deep Vignette Overlay for Crisp Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-slate-950/90" />
        <div className="absolute inset-0 bg-radial-vignette opacity-80" />

        {/* Emergency Blue Strobe Light Glow (Left) */}
        <div className="absolute -top-10 -left-10 w-96 h-80 rounded-full bg-blue-600/30 blur-3xl animate-pulse" />

        {/* Emergency Red Strobe Light Glow (Right) */}
        <div
          className="absolute -top-10 -right-10 w-96 h-80 rounded-full bg-red-600/30 blur-3xl animate-pulse"
          style={{ animationDelay: '500ms' }}
        />
      </div>

      {/* 2. Top Bar: Star Shield Logo & Slogan (Left) + Hamburger Menu (Right) */}
      <header className="relative z-10 w-full flex items-center justify-between pt-0.5 pb-1 shrink-0">
        {/* Top-Left: Shield with Star + "T E R T A N G K A P" + Slogan */}
        <div className="flex items-center gap-2 sm:gap-3 select-none">
          <div className="relative w-7 h-8 sm:w-8 sm:h-9 shrink-0 flex items-center justify-center">
            <svg
              className="w-full h-full text-slate-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
              viewBox="0 0 28 32"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M14 2L3 7V16C3 23 14 29 14 29C14 29 25 23 25 16V7L14 2Z"
                fill="#0b1322"
                stroke="#cbd5e1"
                strokeWidth="1.8"
              />
              <polygon
                points="14,7.5 16.2,12.5 21.5,13 17.5,16.5 18.8,21.8 14,19 9.2,21.8 10.5,16.5 6.5,13 11.8,12.5"
                fill="white"
              />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] sm:text-xs font-display font-black tracking-[0.26em] text-white uppercase leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
              T E R T A N G K A P
            </span>
            <span className="text-[7.5px] sm:text-[9px] font-sans font-semibold tracking-[0.14em] text-gray-300 uppercase mt-0.5 sm:mt-1 leading-none">
              BERSAMA MEWUJUDKAN KEAMANAN
            </span>
          </div>
        </div>

        {/* Top-Right: Chamfered Pill Menu Button */}
        <button
          type="button"
          onClick={() => {
            sound.play('click');
            onBackToMenu();
          }}
          className="group relative p-[1.5px] [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_8px,100%_calc(100%-8px),calc(100%-8px)_100%,8px_100%,0_calc(100%-8px),0_8px)] bg-slate-700/60 hover:bg-cyan-400/80 transition-all cursor-pointer shadow-lg active:scale-95"
          title="Kembali ke Menu"
        >
          <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 [clip-path:polygon(7px_0,calc(100%-7px)_0,100%_7px,100%_calc(100%-7px),calc(100%-7px)_100%,7px_100%,0_calc(100%-7px),0_7px)] bg-[#0a1220]/90 group-hover:bg-[#0f1b30] flex items-center justify-center">
            <Menu className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
          </div>
        </button>
      </header>

      {/* 3. Center Dashboard: Expanded Width, Adaptive Height to prevent scrolling when scaled */}
      <main className="relative z-10 w-full max-w-2xl sm:max-w-3xl md:max-w-4xl flex flex-col items-center justify-center my-auto py-0.5 sm:py-1 px-1 sm:px-4">
        {/* Police Emergency Lightbar (Blue on Left, Red on Right) */}
        <div className="relative flex flex-col items-center mb-0.5">
          {/* Volumetric Light Aura Radiating Above */}
          <div className="absolute -top-6 w-44 sm:w-56 h-10 flex items-center justify-between pointer-events-none">
            <div className="w-16 sm:w-24 h-8 sm:h-10 bg-cyan-400/35 blur-xl rounded-full" />
            <div className="w-16 sm:w-24 h-8 sm:h-10 bg-red-500/35 blur-xl rounded-full" />
          </div>

          {/* Aerodynamic Lightbar Fixture */}
          <div className="relative flex items-center justify-center h-4 sm:h-5 px-1 rounded-sm bg-gradient-to-b from-slate-800 via-slate-900 to-black border border-slate-700 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
            {/* Left Strobe: Cyan-Blue LEDs */}
            <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2">
              <div className="w-3 sm:w-4 h-2 sm:h-2.5 rounded-[2px] bg-[#00E5FF] shadow-[0_0_10px_#00E5FF] animate-pulse" />
              <div className="w-3 sm:w-4 h-2 sm:h-2.5 rounded-[2px] bg-[#00B4FF] shadow-[0_0_10px_#00B4FF]" />
              <div className="w-3 sm:w-4 h-2 sm:h-2.5 rounded-[2px] bg-[#0088FF] shadow-[0_0_8px_#0088FF]" />
            </div>

            {/* Center Divider Housing */}
            <div className="w-2.5 sm:w-3.5 h-full bg-slate-950 border-x border-slate-800 mx-0.5 sm:mx-1 flex items-center justify-center">
              <div className="w-1 h-2 sm:h-2.5 rounded-full bg-slate-700" />
            </div>

            {/* Right Strobe: Crimson-Red LEDs */}
            <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2">
              <div className="w-3 sm:w-4 h-2 sm:h-2.5 rounded-[2px] bg-[#FF2E54] shadow-[0_0_8px_#FF2E54]" />
              <div className="w-3 sm:w-4 h-2 sm:h-2.5 rounded-[2px] bg-[#FF0033] shadow-[0_0_10px_#FF0033]" />
              <div className="w-3 sm:w-4 h-2 sm:h-2.5 rounded-[2px] bg-[#FF1744] shadow-[0_0_10px_#FF1744] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Central Metallic Title: TERTANGKAP */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black italic tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] drop-shadow-[0_0_24px_rgba(255,255,255,0.4)] uppercase text-center leading-none mt-0.5">
          TERTANGKAP
        </h1>

        {/* Winged Star Shield Insignia Below Title */}
        <div className="flex items-center justify-center my-1 w-full">
          <svg
            className="w-48 sm:w-60 md:w-72 h-5 sm:h-6 text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]"
            viewBox="0 0 200 24"
            fill="none"
            aria-hidden="true"
          >
            {/* Left Wings */}
            <line x1="22" y1="12" x2="72" y2="12" stroke="currentColor" strokeWidth="1.8" />
            <line x1="38" y1="16" x2="68" y2="16" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.7" />
            <polygon points="74,12 82,7 82,17" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1" />

            {/* Center Shield with Star */}
            <path
              d="M100 2L92 6.5V13C92 18 100 22 100 22C100 22 108 18 108 13V6.5L100 2Z"
              fill="#0b1322"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <polygon
              points="100,6.5 101.8,10.8 106,11.2 102.8,14 103.8,18.2 100,16 96.2,18.2 97.2,14 94,11.2 98.2,10.8"
              fill="white"
            />

            {/* Right Wings */}
            <polygon points="126,12 118,7 118,17" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1" />
            <line x1="128" y1="12" x2="178" y2="12" stroke="currentColor" strokeWidth="1.8" />
            <line x1="132" y1="16" x2="162" y2="16" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.7" />
          </svg>
        </div>

        {/* 4. Center Data Panel: Prominent, Wider & Sleeker Chamfered Card */}
        <div className="relative w-full p-[1.5px] [clip-path:polygon(18px_0,calc(100%-18px)_0,100%_18px,100%_calc(100%-18px),calc(100%-18px)_100%,18px_100%,0_calc(100%-18px),0_18px)] bg-gradient-to-b from-blue-400/50 via-cyan-500/20 to-blue-500/40 shadow-[0_0_35px_rgba(14,116,144,0.35)] my-1 sm:my-1.5">
          <div className="w-full [clip-path:polygon(17px_0,calc(100%-17px)_0,100%_17px,100%_calc(100%-17px),calc(100%-17px)_100%,17px_100%,0_calc(100%-17px),0_17px)] bg-[#070e1c]/90 backdrop-blur-2xl px-4 py-2.5 sm:px-8 sm:py-4 flex flex-col items-center">
            {/* Top Label: SKOR AKHIR */}
            <span className="text-[10px] sm:text-xs font-display font-bold tracking-[0.26em] text-cyan-200 uppercase drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
              SKOR AKHIR
            </span>

            {/* Big Dominant Metallic White Score with Flanking Dashes: — 1456 — */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 my-0.5 sm:my-1.5 w-full">
              <span className="text-xl sm:text-3xl font-light text-cyan-400/60">—</span>
              <span className="text-4xl sm:text-6xl md:text-7xl font-display font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-300 drop-shadow-[0_4px_24px_rgba(255,255,255,0.4)] leading-none">
                {score.toLocaleString()}
              </span>
              <span className="text-xl sm:text-3xl font-light text-cyan-400/60">—</span>
            </div>

            {/* Three Metrics Grid: Jarak, Dihindari, Rekor */}
            <div className="w-full grid grid-cols-3 gap-2 sm:gap-6 mt-2 pt-2 sm:mt-2.5 sm:pt-2.5 border-t border-blue-500/20">
              {/* Metric 1: Skull Icon | JARAK */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-center sm:text-left">
                {/* Skull Circular Badge */}
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full border border-cyan-400/60 bg-slate-900/90 flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.25)] shrink-0">
                  <Skull className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-display font-black text-sm sm:text-xl md:text-2xl text-white tracking-tight leading-none truncate">
                    {distance.toLocaleString()}m
                  </span>
                  <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5 sm:mt-1">
                    JARAK
                  </span>
                </div>
              </div>

              {/* Metric 2: Police Siren Icon | DIHINDARI */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-center sm:text-left border-x border-blue-500/20 px-1 sm:px-3">
                {/* Police Siren Circular Badge */}
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full border border-blue-400/60 bg-slate-900/90 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.25)] shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M7 16C7 11.5 9 6 12 6C15 6 17 11.5 17 16"
                      fill="url(#sirenMetricGrad)"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                    <rect x="5" y="16" width="14" height="3" rx="1" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="12" y1="2" x2="12" y2="5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="6" y1="3" x2="8" y2="5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="18" y1="3" x2="16" y2="5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="sirenMetricGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="50%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-display font-black text-sm sm:text-xl md:text-2xl text-white tracking-tight leading-none truncate">
                    {dodgedCount.toLocaleString()}
                  </span>
                  <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5 sm:mt-1">
                    DIHINDARI
                  </span>
                </div>
              </div>

              {/* Metric 3: Golden Star Icon | REKOR */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-center sm:text-left">
                {/* Star Circular Badge */}
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full border border-amber-400/70 bg-slate-900/90 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)] shrink-0">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-display font-black text-sm sm:text-xl md:text-2xl text-white tracking-tight leading-none truncate">
                    {displayRecord.toLocaleString()}
                  </span>
                  <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5 sm:mt-1">
                    REKOR
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Leaderboard / Bounty Status Badge */}
        {(latestLeaderboardRank || (bountyEarned && bountyEarned > 0) || isNewHighScore || scoreSavedStatus === 'saving') && (
          <div className="w-full py-0.5 px-3 rounded-full bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center gap-2 my-0.5 shadow-[0_0_12px_rgba(0,230,118,0.2)]">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[#00E676] font-display font-bold text-[10px] sm:text-[11px] tracking-wider uppercase truncate">
              {isNewHighScore ? (
                '🌟 REKOR BARU TERCIPTA!'
              ) : latestLeaderboardRank ? (
                `PERINGKAT #${latestLeaderboardRank} DI LEADERBOARD! (LIVE)`
              ) : scoreSavedStatus === 'saving' ? (
                'MENYIMPAN SKOR KE LEADERBOARD...'
              ) : bountyEarned ? (
                `HADIAH BURONAN: +${bountyEarned.toLocaleString()} PTS`
              ) : (
                'SKOR RESMI TERCATAT'
              )}
            </span>
          </div>
        )}

        {/* 5. Primary Glowing Orange Action Button: "LIHAT LEDERBORD" */}
        <div className="w-full mt-1.5 sm:mt-2">
          <button
            id="btn-open-leaderboard-from-gameover"
            type="button"
            onClick={() => {
              sound.play('click');
              if (onOpenLeaderboard) onOpenLeaderboard();
            }}
            className="w-full group relative p-[2px] [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.6)] active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="w-full h-full py-2.5 sm:py-3.5 px-4 sm:px-6 [clip-path:polygon(13px_0,calc(100%-13px)_0,100%_13px,100%_calc(100%-13px),calc(100%-13px)_100%,13px_100%,0_calc(100%-13px),0_13px)] bg-gradient-to-r from-[#993b00] via-[#c25400] to-[#993b00] group-hover:from-[#b34500] group-hover:via-[#db6000] group-hover:to-[#b34500] flex items-center justify-center gap-2.5 sm:gap-3 transition-colors">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <span className="font-display font-black text-xs sm:text-sm md:text-base text-white tracking-[0.16em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                LIHAT LEADERBOARD
              </span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </div>
          </button>
        </div>

        {/* 6. Secondary Chamfered Buttons Row: MAIN LAGI (Left) | MENU (Right) */}
        <div className="w-full grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mt-1.5 sm:mt-2">
          {/* Button: MAIN LAGI */}
          <button
            id="btn-restart-game"
            type="button"
            onClick={() => {
              sound.play('click');
              onRestart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              sound.play('click');
              onRestart();
            }}
            className="group relative p-[1.5px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] bg-slate-600/60 hover:bg-cyan-400/80 transition-all cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <div className="w-full h-full py-2 sm:py-3 px-3 sm:px-4 [clip-path:polygon(9px_0,calc(100%-9px)_0,100%_9px,100%_calc(100%-9px),calc(100%-9px)_100%,9px_100%,0_calc(100%-9px),0_9px)] bg-[#0a1220]/90 group-hover:bg-[#0f1b30] flex items-center justify-center gap-1.5 sm:gap-2 transition-colors">
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:rotate-[-45deg] transition-transform stroke-[2.5]" />
              <span className="font-display font-bold text-xs sm:text-sm text-white tracking-[0.14em] uppercase">
                MAIN LAGI
              </span>
            </div>
          </button>

          {/* Button: MENU */}
          <button
            id="btn-back-menu"
            type="button"
            onClick={() => {
              sound.play('click');
              onBackToMenu();
            }}
            className="group relative p-[1.5px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] bg-slate-600/60 hover:bg-cyan-400/80 transition-all cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <div className="w-full h-full py-2 sm:py-3 px-3 sm:px-4 [clip-path:polygon(9px_0,calc(100%-9px)_0,100%_9px,100%_calc(100%-9px),calc(100%-9px)_100%,9px_100%,0_calc(100%-9px),0_9px)] bg-[#0a1220]/90 group-hover:bg-[#0f1b30] flex items-center justify-center gap-1.5 sm:gap-2 transition-colors">
              <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white transition-colors" />
              <span className="font-display font-bold text-xs sm:text-sm text-white tracking-[0.14em] uppercase">
                MENU
              </span>
            </div>
          </button>
        </div>

        {/* Optional Ghost Replay Button if available */}
        {onWatchReplay && lastReplayId && (
          <button
            type="button"
            onClick={() => {
              sound.play('click');
              onWatchReplay(lastReplayId);
            }}
            className="mt-1.5 px-3 py-1 rounded-full bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-400/40 text-cyan-300 font-display font-bold text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,229,255,0.2)] cursor-pointer transition-all active:scale-95"
          >
            <Film className="w-3 h-3 text-cyan-400" />
            <span>TONTON REPLAY BALAPAN</span>
          </button>
        )}
      </main>

      {/* 7. Bottom Branding: POLISI INDONESIA (Left) | DISIPLIN PROFESIONAL MELAYANI (Right) */}
      <footer className="relative z-10 w-full flex items-end justify-between pt-1 pb-0.5 shrink-0">
        {/* Bottom-Left Branding: POLISI INDONESIA */}
        <div className="flex flex-col items-start text-left select-none">
          <span className="text-[9px] sm:text-[11px] tracking-[0.22em] text-gray-400 font-display font-bold uppercase leading-tight">
            POLISI
          </span>
          <span className="text-[9px] sm:text-[11px] tracking-[0.22em] text-gray-400 font-display font-bold uppercase leading-tight">
            INDONESIA
          </span>
          <div className="w-14 sm:w-20 h-[1.5px] bg-cyan-400/40 mt-0.5 shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
        </div>

        {/* Center Map Selector (if activeMap provided) */}
        {activeMap && (
          <button
            type="button"
            onClick={() => {
              if (onOpenMapSelect) {
                sound.play('click');
                onOpenMapSelect();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/70 border border-cyan-400/30 text-gray-300 hover:text-white text-[9px] sm:text-[10px] uppercase font-display font-bold tracking-wider transition-colors cursor-pointer mb-0.5"
            title="Ganti Peta"
          >
            <span>{activeMap.icon}</span>
            <span>MAP: {activeMap.name}</span>
          </button>
        )}

        {/* Bottom-Right Motto: DISIPLIN PROFESIONAL MELAYANI */}
        <div className="flex flex-col items-end text-right select-none">
          <span className="text-[8px] sm:text-[10px] tracking-[0.18em] text-gray-400 font-display font-medium uppercase leading-tight">
            DISIPLIN
          </span>
          <span className="text-[8px] sm:text-[10px] tracking-[0.18em] text-gray-400 font-display font-medium uppercase leading-tight">
            PROFESIONAL
          </span>
          <span className="text-[8px] sm:text-[10px] tracking-[0.18em] text-gray-400 font-display font-medium uppercase leading-tight">
            MELAYANI
          </span>
          <div className="w-18 sm:w-24 h-[1.5px] bg-cyan-400/40 mt-0.5 shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
        </div>
      </footer>
    </div>
  );
};
