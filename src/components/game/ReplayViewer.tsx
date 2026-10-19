import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Film,
  X,
  Clock,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { api, drawCar2D, roadsideScenery2D, sound } from '../../services';
import { getMapData, GameMapId, UserProfile } from '../../types';
import { getRoadGeometry } from './GameCanvas';

export interface ReplayFramePlayer {
  id: string;
  username: string;
  avatar?: string;
  carColor?: string;
  carModel?: string;
  laneIndex?: number;
  x: number;
  y: number;
  speed: number;
  distance: number;
  steer?: number;
  gas?: boolean;
  brake?: boolean;
  nitro?: boolean;
  hp?: number;
  score?: number;
  status?: string;
}

export interface ReplayFrame {
  t: number; // time in ms since race start
  players: Record<string, ReplayFramePlayer>;
}

export interface ReplayData {
  id: string;
  roomCode?: string;
  matchName?: string;
  difficulty?: string;
  mapId?: GameMapId;
  targetDistance?: number;
  winnerId?: string | null;
  winnerName?: string | null;
  durationMs: number;
  playerSummary?: Array<{
    id: string;
    username: string;
    avatar?: string;
    carColor?: string;
    carModel?: string;
    distance?: number;
    score?: number;
    status?: string;
  }>;
  frames: ReplayFrame[];
  createdAt: string;
}

interface ReplayViewerProps {
  replayId?: string | null;
  initialReplayData?: ReplayData | null;
  user?: UserProfile | null;
  onClose: () => void;
}

export const ReplayViewer: React.FC<ReplayViewerProps> = ({
  replayId,
  initialReplayData,
  onClose,
}) => {
  const [replay, setReplay] = useState<ReplayData | null>(initialReplayData || null);
  const [replayList, setReplayList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!initialReplayData);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [focusPlayerId, setFocusPlayerId] = useState<string | 'all'>('all');
  const [showReplaySelector, setShowReplaySelector] = useState<boolean>(!replayId && !initialReplayData);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  currentTimeRef.current = currentTimeMs;
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;
  const playbackSpeedRef = useRef<number>(playbackSpeed);
  playbackSpeedRef.current = playbackSpeed;

  // Load replay metadata list
  const loadReplaysList = useCallback(async () => {
    try {
      const list = await api.getReplays();
      setReplayList(list);
    } catch (e) {
      console.debug('Failed to load replays list', e);
    }
  }, []);

  // Load specific replay by ID
  const loadReplayById = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const data = await api.getReplay(id);
      if (data) {
        setReplay(data);
        setCurrentTimeMs(0);
        setIsPlaying(true);
        setShowReplaySelector(false);
      }
    } catch (err) {
      console.debug('Error loading replay data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReplaysList();
    if (replayId && (!initialReplayData || initialReplayData.id !== replayId)) {
      loadReplayById(replayId);
    }
  }, [replayId, initialReplayData, loadReplaysList, loadReplayById]);

  // Total duration of current replay
  const totalDurationMs = replay?.durationMs || (replay?.frames?.length ? replay.frames[replay.frames.length - 1].t : 10000);

  // Helper to lerp numbers
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Playback Loop
  useEffect(() => {
    if (!replay || !replay.frames || replay.frames.length === 0) return;

    lastTickTimeRef.current = performance.now();

    const loop = (now: number) => {
      const delta = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;

      if (isPlayingRef.current) {
        let nextTime = currentTimeRef.current + delta * playbackSpeedRef.current;
        if (nextTime >= totalDurationMs) {
          nextTime = totalDurationMs;
          setIsPlaying(false);
        }
        setCurrentTimeMs(nextTime);
      }

      // Render Current Frame
      renderFrame(currentTimeRef.current);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [replay, totalDurationMs]);

  // Interpolate state of all players at time t
  const getInterpolatedPlayers = (t: number): Record<string, ReplayFramePlayer> => {
    if (!replay?.frames || replay.frames.length === 0) return {};

    const frames = replay.frames;
    if (t <= frames[0].t) return frames[0].players;
    if (t >= frames[frames.length - 1].t) return frames[frames.length - 1].players;

    // Binary search for surrounding frames
    let low = 0;
    let high = frames.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (frames[mid].t === t) {
        return frames[mid].players;
      }
      if (frames[mid].t < t) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const idx0 = Math.max(0, high);
    const idx1 = Math.min(frames.length - 1, low);
    const f0 = frames[idx0];
    const f1 = frames[idx1];

    if (!f0 || !f1 || f0 === f1) return f0?.players || {};

    const span = f1.t - f0.t;
    const factor = span > 0 ? (t - f0.t) / span : 0;
    const clampedFactor = Math.max(0, Math.min(1, factor));

    const result: Record<string, ReplayFramePlayer> = {};
    const allIds = new Set([...Object.keys(f0.players || {}), ...Object.keys(f1.players || {})]);

    for (const pId of allIds) {
      const p0 = f0.players[pId];
      const p1 = f1.players[pId];

      if (p0 && p1) {
        result[pId] = {
          ...p1,
          x: lerp(p0.x, p1.x, clampedFactor),
          y: lerp(p0.y, p1.y, clampedFactor),
          speed: lerp(p0.speed, p1.speed, clampedFactor),
          distance: lerp(p0.distance, p1.distance, clampedFactor),
          steer: lerp(p0.steer || 0, p1.steer || 0, clampedFactor),
          nitro: p1.nitro || p0.nitro,
          hp: p1.hp,
          score: Math.round(lerp(p0.score || 0, p1.score || 0, clampedFactor)),
          status: p1.status,
        };
      } else if (p1) {
        result[pId] = p1;
      } else if (p0) {
        result[pId] = p0;
      }
    }

    return result;
  };

  // Render Frame on Canvas
  const renderFrame = (t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const activeMap = getMapData(replay?.mapId || 'kota');
    const { roadWidth, roadLeft, roadRight, laneW, laneCenters } = getRoadGeometry(w);

    // Clear Screen
    ctx.clearRect(0, 0, w, h);

    // Virtual Camera scroll offset linked to replay time
    const scrollY = (t * 0.45) % 100;
    const worldY = t * 0.45;

    // Roadside Scenery
    roadsideScenery2D.render(
      ctx,
      w,
      h,
      roadLeft,
      roadRight,
      roadWidth,
      worldY,
      activeMap,
      Math.floor(t / 16),
      6
    );

    // Main asphalt road
    ctx.fillStyle = activeMap.roadColor;
    ctx.fillRect(roadLeft, 0, roadWidth, h);

    // Curbs
    for (let i = -100; i < h; i += 60) {
      const cy = i + scrollY;
      ctx.fillStyle = (i / 60) % 2 === 0 ? activeMap.curbColor1 : activeMap.curbColor2;
      ctx.fillRect(roadLeft - 6, cy, 6, 60);
      ctx.fillRect(roadRight, cy, 6, 60);
    }

    // Lane lines
    ctx.fillStyle = activeMap.laneColor;
    for (let i = -100; i < h; i += 100) {
      ctx.fillRect(roadLeft + laneW - 4, i + scrollY, 8, 48);
      ctx.fillRect(roadLeft + laneW * 2 - 4, i + scrollY, 8, 48);
    }

    // Center highway ambient glow line
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = activeMap.accentColor || '#00f0ff';
    ctx.fillRect(roadLeft + roadWidth / 2 - 2, 0, 4, h);
    ctx.globalAlpha = 1;

    // Finish Line Indicator if race is near the end
    const targetDist = replay?.targetDistance || 1500;
    const players = getInterpolatedPlayers(t);
    const maxDist = Math.max(0, ...Object.values(players).map(p => p.distance || 0));

    if (maxDist >= targetDist - 120) {
      const finishY = Math.max(40, Math.min(h - 80, h - ((maxDist - (targetDist - 120)) / 120) * (h - 100)));
      ctx.save();
      // Checkered finish line
      const sz = 16;
      for (let fx = roadLeft; fx < roadRight; fx += sz) {
        for (let fy = finishY - 12; fy <= finishY + 12; fy += sz) {
          const isWhite = (Math.floor(fx / sz) + Math.floor(fy / sz)) % 2 === 0;
          ctx.fillStyle = isWhite ? '#ffffff' : '#111827';
          ctx.fillRect(fx, fy, sz, sz);
        }
      }
      ctx.fillStyle = '#ffb703';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`FINISH LINE (${targetDist}m)`, roadLeft + roadWidth / 2, finishY - 18);
      ctx.restore();
    }

    // Render Players / Ghost Cars
    const playerList = Object.values(players);

    // If focused on a specific player, we can offset slightly or highlight
    for (const p of playerList) {
      const isFocused = focusPlayerId === 'all' || focusPlayerId === p.id;
      const lane = p.laneIndex ?? 1;
      const fallbackX = laneCenters[lane] ? laneCenters[lane] : roadLeft + laneW * 0.5;

      // Coordinate mapping: If player x is stored relative to road center, convert or clamp
      let carCenterX = p.x !== 0 ? p.x + 22 : fallbackX;
      // Safety clamp within road borders
      carCenterX = Math.max(roadLeft + 24, Math.min(roadRight - 24, carCenterX));

      // Y position: based on relative distance difference from average to give visual depth
      const avgDist = playerList.reduce((acc, pl) => acc + (pl.distance || 0), 0) / (playerList.length || 1);
      const distOffset = ((p.distance || 0) - avgDist) * 0.8;
      let carCenterY = (h - 160) - distOffset;
      carCenterY = Math.max(70, Math.min(h - 70, carCenterY));

      const steerAngle = (p.steer || 0) * 0.12;

      ctx.save();
      ctx.translate(carCenterX, carCenterY);
      ctx.rotate(steerAngle);

      // Ghost trail if nitro
      if (p.nitro) {
        ctx.save();
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 24;
        ctx.fillStyle = 'rgba(255, 0, 85, 0.3)';
        ctx.fillRect(-20, 20, 40, 30);
        ctx.restore();
      }

      // Draw Car Model
      drawCar2D(ctx, {
        x: 0,
        y: 0,
        width: 44,
        height: 86,
        color: p.carColor || '#00f0ff',
        model: p.carModel || 'civic_fl5',
        isNitro: !!p.nitro,
        frameCount: Math.floor(t / 16),
        showShadow: true,
        showUnderglow: isFocused,
      });

      ctx.restore();

      // Pilot Tag / HUD Bubble above car
      ctx.save();
      const tagY = carCenterY - 56;
      ctx.font = 'bold 10px Rajdhani, sans-serif';
      const nameText = `${p.avatar || '🏎️'} ${p.username}`;
      const speedText = `${Math.round(p.speed * 18)} KM/H • ${Math.round(p.distance || 0)}m`;

      const tw = Math.max(ctx.measureText(nameText).width, ctx.measureText(speedText).width) + 16;
      const th = 26;

      // Tag Background
      ctx.fillStyle = isFocused ? 'rgba(10, 15, 30, 0.85)' : 'rgba(10, 15, 30, 0.55)';
      ctx.strokeStyle = p.nitro ? '#ff0055' : (p.carColor || '#00f0ff');
      ctx.lineWidth = isFocused ? 1.5 : 1;

      ctx.beginPath();
      ctx.roundRect(carCenterX - tw / 2, tagY - th / 2, tw, th, 6);
      ctx.fill();
      ctx.stroke();

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nameText, carCenterX, tagY - 4);

      // Speed & Distance
      ctx.font = '8px monospace';
      ctx.fillStyle = p.nitro ? '#ff70a6' : '#38bdf8';
      ctx.fillText(speedText, carCenterX, tagY + 7);

      ctx.restore();
    }
  };

  // Keyboard Shortcuts (Space for play/pause, Left/Right for scrub)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekRelative(-5000);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekRelative(5000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalDurationMs]);

  const togglePlayPause = () => {
    sound.play('click');
    setIsPlaying(prev => {
      // If at end, restart
      if (!prev && currentTimeRef.current >= totalDurationMs) {
        setCurrentTimeMs(0);
      }
      return !prev;
    });
  };

  const seekRelative = (deltaMs: number) => {
    sound.play('click');
    setCurrentTimeMs(prev => Math.max(0, Math.min(totalDurationMs, prev + deltaMs)));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTimeMs(val);
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentPlayers = getInterpolatedPlayers(currentTimeMs);
  const sortedPlayers = Object.values(currentPlayers).sort((a, b) => (b.distance || 0) - (a.distance || 0));

  return (
    <div className="fixed inset-0 z-50 bg-[#060814]/95 backdrop-blur-xl flex flex-col select-none overflow-hidden text-white font-sans">
      {/* Top Header Bar */}
      <header className="h-14 sm:h-16 px-4 border-b border-cyan-500/20 bg-black/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-display font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-amber-300 uppercase">
                {replay ? (replay.matchName || `Replay #${replay.roomCode || replay.id.slice(0, 8)}`) : 'Pusat Replay Balapan'}
              </h2>
              {replay && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold uppercase border border-cyan-400/30">
                  {replay.difficulty || 'NORMAL'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              Ghost Replay Telemetri • Authoritative Multiplayer Playback
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReplaySelector(prev => !prev)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-display font-bold text-gray-200 hover:text-white border border-white/10 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pilih Match</span>
          </button>

          <button
            onClick={() => {
              sound.play('click');
              onClose();
            }}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Canvas Replay Area */}
        <div className="flex-1 relative flex items-center justify-center bg-[#070913] overflow-hidden">
          <canvas
            ref={canvasRef}
            width={720}
            height={560}
            className="max-w-full max-h-full aspect-[720/560] object-contain shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          />

          {/* Leaderboard Overlay on Top-Right */}
          {replay && sortedPlayers.length > 0 && (
            <div className="absolute top-4 right-4 z-20 w-48 sm:w-56 bg-black/80 backdrop-blur-md border border-white/15 rounded-2xl p-3 shadow-2xl pointer-events-none">
              <div className="flex items-center justify-between text-[10px] font-display font-extrabold uppercase tracking-wider text-gray-400 mb-2 border-b border-white/10 pb-1">
                <span>Posisi Balapan</span>
                <span>Jarak</span>
              </div>
              <div className="space-y-1.5">
                {sortedPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-semibold ${
                      idx === 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                        : 'bg-white/5 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono text-[10px] text-gray-400 w-3">{idx + 1}.</span>
                      <span className="text-sm">{p.avatar || '🏎️'}</span>
                      <span className="truncate max-w-[80px] sm:max-w-[100px]">{p.username}</span>
                    </div>
                    <span className="font-mono text-[11px] shrink-0 text-cyan-300">
                      {Math.round(p.distance || 0)}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-30">
              <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-display font-bold uppercase tracking-wider text-cyan-300">
                Memuat Telemetri Replay...
              </span>
            </div>
          )}

          {/* Empty State */}
          {!replay && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
              <Film className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-display font-bold text-gray-300 mb-1">
                Belum Ada Replay Dipilih
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mb-4">
                Pilih rekaman balapan sebelumnya dari daftar atau selesaikan duel multiplayer untuk menonton ulang.
              </p>
              <button
                onClick={() => setShowReplaySelector(true)}
                className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all active:scale-95 cursor-pointer"
              >
                Buka Daftar Replay
              </button>
            </div>
          )}
        </div>

        {/* Replay Selector Drawer / Modal */}
        {showReplaySelector && (
          <aside className="absolute inset-y-0 right-0 w-full sm:w-96 bg-[#0a0d1f]/98 backdrop-blur-2xl border-l border-cyan-500/30 z-40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-display font-black uppercase tracking-wider text-white">
                  Daftar Replay Tersimpan
                </h3>
              </div>
              <button
                onClick={() => setShowReplaySelector(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {replayList.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  Belum ada riwayat balapan yang terekam di server. Selesaikan balapan multiplayer untuk membuat rekaman pertama!
                </div>
              ) : (
                replayList.map(r => (
                  <div
                    key={r.id}
                    onClick={() => loadReplayById(r.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      replay?.id === r.id
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-display font-black text-white truncate max-w-[160px]">
                        {r.matchName || `Room #${r.roomCode || r.id.slice(0, 6)}`}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                        {r.difficulty || 'NORMAL'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <strong className="text-gray-200">{r.winnerName || 'Pemenang'}</strong>
                      </span>
                      <span>•</span>
                      <span>{Math.round((r.durationMs || 0) / 1000)}s</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-white/10">
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                        Tonton <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Controls Playback Bar */}
      {replay && (
        <footer className="h-24 sm:h-28 px-4 sm:px-8 border-t border-cyan-500/20 bg-black/85 backdrop-blur-md flex flex-col justify-center shrink-0 gap-2">
          {/* Progress / Seek Slider */}
          <div className="flex items-center gap-3 w-full">
            <span className="font-mono text-xs font-bold text-cyan-300 w-12 text-right">
              {formatTime(currentTimeMs)}
            </span>
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={totalDurationMs}
                step={50}
                value={currentTimeMs}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all"
              />
            </div>
            <span className="font-mono text-xs font-bold text-gray-400 w-12">
              {formatTime(totalDurationMs)}
            </span>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center justify-between">
            {/* Speed Multipliers */}
            <div className="flex items-center gap-1">
              {[0.5, 1, 2, 4].map(spd => (
                <button
                  key={spd}
                  onClick={() => {
                    sound.play('click');
                    setPlaybackSpeed(spd);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    playbackSpeed === spd
                      ? 'bg-cyan-500 text-black font-extrabold shadow-sm shadow-cyan-400/50'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {spd}×
                </button>
              ))}
            </div>

            {/* Play / Pause / Seek Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  sound.play('click');
                  setCurrentTimeMs(0);
                }}
                title="Mulai Dari Awal"
                className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => seekRelative(-5000)}
                title="Mundur 5 Detik (Panah Kiri)"
                className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                <Rewind className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlayPause}
                title={isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
                className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black shadow-lg shadow-cyan-500/30 transition-all active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => seekRelative(5000)}
                title="Maju 5 Detik (Panah Kanan)"
                className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                <FastForward className="w-4 h-4" />
              </button>
            </div>

            {/* Focus Target Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hidden sm:inline">
                Fokus:
              </span>
              <select
                value={focusPlayerId}
                onChange={e => setFocusPlayerId(e.target.value)}
                className="bg-black/60 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="all">Semua Pemain</option>
                {sortedPlayers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.avatar || '🏎️'} {p.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
