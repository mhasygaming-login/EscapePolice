import React, { useEffect, useRef, useState, useCallback } from 'react';
import { UserProfile, DifficultyLevel, MultiplayerRoom, MultiplayerPlayerState } from '../types/game';
import { GameMapId, CameraViewMode, getMapData } from '../types/maps';
import { roadsideScenery2D } from '../services/roadsideScenery2d';
import { sound } from '../services/audio';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { drawCar2D, getCarModel } from '../services/cars';
import {
  drawPoliceCar2D,
  drawPoliceMotorcycle2D,
  PoliceCarVariant,
} from '../services/policeVehicles';
import { PoliceFleetModal } from './PoliceFleetModal';
import { MainGameLobby } from './MainGameLobby';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  AlertTriangle,
  Zap,
  Shield,
  Magnet,
  Trophy,
  Flame,
  Swords,
  Users,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Siren,
  Compass,
  Snowflake,
} from 'lucide-react';

interface GameCanvasProps {
  user: UserProfile | null;
  onScoreSubmitted?: (score: number, rank?: number) => void;
  multiplayerRoom?: MultiplayerRoom | null;
  onLeaveMultiplayer?: () => void;
  onRematchMultiplayer?: () => void;
  onReturnToLobby?: () => void;
  difficulty?: DifficultyLevel;
  onChangeDifficulty?: (diff: DifficultyLevel) => void;
  onOpenMultiplayer?: () => void;
  onOpenGarage?: () => void;
  onOpenLeaderboard?: () => void;
  selectedMapId?: GameMapId;
  onOpenMapSelect?: () => void;
  onSelectMap?: (id: GameMapId) => void;
}

const diffSettings = {
  EASY: { baseSpeed: 4, spawnBase: 74, obstacleSpeedMul: 0.78, traffic: 0.75, ai: 0.55 },
  NORMAL: { baseSpeed: 5, spawnBase: 59, obstacleSpeedMul: 1, traffic: 1, ai: 1 },
  HARD: { baseSpeed: 6.5, spawnBase: 46, obstacleSpeedMul: 1.3, traffic: 1.2, ai: 1.25 },
  MAXXX: { baseSpeed: 8, spawnBase: 34, obstacleSpeedMul: 1.65, traffic: 1.45, ai: 1.6 },
};

const diffDescriptions = {
  EASY: 'Musuh lebih santai & lambat. Cocok untuk pemanasan.',
  NORMAL: 'Kecepatan & kepadatan musuh seimbang.',
  HARD: 'Jalanan penuh sirene & helikopter. Untuk yang cari tantangan.',
  MAXXX: 'Armada AI taktis, drone tempur, interceptor brutal. Tanpa ampun.',
};

// Roadway geometry scaled to ensure visible, vibrant roadside scenery on both shoulders
export function getRoadGeometry(canvasWidth: number) {
  const minShoulder = Math.max(50, Math.round(canvasWidth * 0.16));
  const maxRoad = 500;
  const roadWidth = Math.min(maxRoad, Math.max(260, canvasWidth - minShoulder * 2));
  const roadLeft = Math.round((canvasWidth - roadWidth) / 2);
  const roadRight = roadLeft + roadWidth;
  const laneW = roadWidth / 3;
  const laneCenters = [
    roadLeft + laneW * 0.5,
    roadLeft + laneW * 1.5,
    roadLeft + laneW * 2.5,
  ];
  return { roadWidth, roadLeft, roadRight, laneW, laneCenters };
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  user,
  onScoreSubmitted,
  multiplayerRoom,
  onLeaveMultiplayer,
  onRematchMultiplayer,
  onReturnToLobby,
  difficulty: externalDifficulty,
  onChangeDifficulty,
  onOpenMultiplayer,
  onOpenGarage,
  onOpenLeaderboard,
  selectedMapId = 'kota',
  onOpenMapSelect,
  onSelectMap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniMapRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('START');
  const [difficulty, setInternalDifficulty] = useState<DifficultyLevel>(externalDifficulty || 'NORMAL');

  // Map state
  const [internalMapId, setInternalMapId] = useState<GameMapId>(selectedMapId);
  const mapIdRef = useRef<GameMapId>(selectedMapId);
  mapIdRef.current = internalMapId;
  const activeMap = getMapData(internalMapId);

  useEffect(() => {
    if (selectedMapId && selectedMapId !== internalMapId) {
      setInternalMapId(selectedMapId);
      mapIdRef.current = selectedMapId;
    }
  }, [selectedMapId]);

  useEffect(() => {
    if (externalDifficulty && externalDifficulty !== difficulty) {
      setInternalDifficulty(externalDifficulty);
    }
  }, [externalDifficulty]);

  const setDifficulty = (d: DifficultyLevel) => {
    setInternalDifficulty(d);
    if (onChangeDifficulty) {
      onChangeDifficulty(d);
    }
  };
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(user?.stats.highScore || 0);
  const [hp, setHp] = useState(3);
  const [maxHp] = useState(5);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [heat, setHeat] = useState(0);
  const [bountyEarned, setBountyEarned] = useState(0);
  const [distance, setDistance] = useState(0);
  const [dodgedCount, setDodgedCount] = useState(0);
  const [powerupsCount, setPowerupsCount] = useState(0);
  const [bestComboRun, setBestComboRun] = useState(0);
  const [missionText, setMissionText] = useState('MISI: —');
  const [bossInfo, setBossInfo] = useState<{ active: boolean; hp: number; maxHp: number } | null>(null);
  const [toasts, setToasts] = useState<{ id: string; text: string; color: string }[]>([]);
  const [activePowers, setActivePowers] = useState<{ label: string; time: number; color: string }[]>([]);
  const [nitroEnergy, setNitroEnergy] = useState(50);
  const [empCharges, setEmpCharges] = useState(2);
  const [opponents, setOpponents] = useState<Record<string, MultiplayerPlayerState>>({});
  const [multiplayerWinner, setMultiplayerWinner] = useState<string | null>(null);
  const [multiplayerCountdown, setMultiplayerCountdown] = useState<{ count: number; message: string } | null>(null);
  const [spectating, setSpectating] = useState(false);
  const [latestLeaderboardRank, setLatestLeaderboardRank] = useState<number | null>(null);
  const [scoreSavedStatus, setScoreSavedStatus] = useState<'idle' | 'saving' | 'saved' | 'unregistered'>('idle');
  const [showFleetModal, setShowFleetModal] = useState(false);

  // Mutable refs to prevent unnecessary game-loop restarts
  const userRef = useRef(user);
  userRef.current = user;
  const multiplayerRoomRef = useRef(multiplayerRoom);
  multiplayerRoomRef.current = multiplayerRoom;
  const opponentsRef = useRef<Record<string, MultiplayerPlayerState>>({});
  opponentsRef.current = opponents;
  const highScoreRef = useRef(highScore);
  highScoreRef.current = highScore;
  const onScoreSubmittedRef = useRef(onScoreSubmitted);
  onScoreSubmittedRef.current = onScoreSubmitted;
  const startGameRef = useRef<() => void>(() => {});

  // Sync high score from user prop
  useEffect(() => {
    if (user?.stats?.highScore) {
      setHighScore(prev => Math.max(prev, user.stats.highScore));
    }
  }, [user]);

  // Audio mute state synced with sound service
  const [muted, setMuted] = useState(sound.muted);
  const toggleSound = () => {
    sound.muted = !sound.muted;
    setMuted(sound.muted);
  };

  // Toast dispatch helper
  const addToast = useCallback((text: string, color: string = 'cyan') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev.slice(-3), { id, text, color }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2400);
  }, []);

  // Opponents sync and room events in multiplayer
  useEffect(() => {
    if (!multiplayerRoom) {
      setOpponents({});
      opponentsRef.current = {};
      return;
    }

    // Initialize opponents from current room players (excluding current user)
    if (multiplayerRoom.players) {
      const initialOpponents: Record<string, MultiplayerPlayerState> = {};
      for (const [pId, pl] of Object.entries(multiplayerRoom.players)) {
        if (pId !== user?.id) {
          initialOpponents[pId] = pl as MultiplayerPlayerState;
        }
      }
      setOpponents(initialOpponents);
      opponentsRef.current = initialOpponents;
    }

    const unbindSync = socket.on('opponent_sync', (data: any) => {
      if (data.userId && data.userId !== user?.id) {
        const updated: MultiplayerPlayerState = {
          id: data.userId,
          username: data.username || 'Opponent',
          avatar: data.avatar || '🏎️',
          carColor: data.carColor || '#ff2d6b',
          carModel: data.carModel || 'civic_fl5',
          x: data.x,
          y: data.y,
          score: data.score,
          hp: data.hp,
          combo: data.combo,
          status: data.status,
          isHost: false,
        };
        opponentsRef.current[data.userId] = updated;
        setOpponents(prev => ({ ...prev, [data.userId]: updated }));
      }
    });

    const unbindLeft = socket.on('opponent_left', (data: any) => {
      if (data.userId) {
        delete opponentsRef.current[data.userId];
        setOpponents(prev => {
          const next = { ...prev };
          delete next[data.userId];
          return next;
        });
        addToast(`${data.username || 'Teman'} keluar dari balapan`, 'cyan');
      }
    });

    const unbindAction = socket.on('opponent_action', (data: any) => {
      if (data.action === 'emp') {
        addToast(`⚡ ${data.username || 'TEMAN'} MENGAKTIFKAN EMP!`, 'magenta');
        sound.play('emp');
      } else if (data.action === 'crashed') {
        addToast(`💥 ${data.username || 'TEMAN'} MENGALAMI TABRAKAN!`, 'rose');
        sound.play('crash');
      } else if (data.action === 'chat') {
        addToast(`💬 ${data.username || 'TEMAN'}: ${data.value}`, 'amber');
        sound.play('coin');
      }
    });

    const unbindRoomState = socket.on('room_state', (data: any) => {
      if (!data?.room) return;
      if (data.room.status === 'in_game') {
        if (gameState !== 'PLAYING') {
          setSpectating(false);
          setMultiplayerWinner(null);
          startGameRef.current();
        }
      } else if (data.room.status === 'finished') {
        setMultiplayerWinner(data.room.winnerId || null);
        sound.play('win');
      }
    });

    const unbindCountdown = socket.on('countdown_tick', (data: any) => {
      if (data.count > 0) {
        setMultiplayerCountdown({ count: data.count, message: data.message || `${data.count}` });
        sound.play('click');
      } else {
        setMultiplayerCountdown({ count: 0, message: 'GO! BALAPAN DIMULAI!' });
        sound.play('nitro');
        setSpectating(false);
        setMultiplayerWinner(null);
        if (gameState !== 'PLAYING') {
          startGameRef.current();
        }
        setTimeout(() => setMultiplayerCountdown(null), 1500);
      }
    });

    const unbindRaceFinish = socket.on('race_finish', (data: any) => {
      setMultiplayerWinner(data.winnerId || null);
      if (data.reason) {
        addToast(`🏁 ${data.reason}`, 'amber');
      }
      sound.play('win');
      if (gameState === 'PLAYING') {
        finishGameAndSaveRef.current('completed');
      }
    });

    return () => {
      unbindSync();
      unbindLeft();
      unbindAction();
      unbindRoomState();
      unbindCountdown();
      unbindRaceFinish();
    };
  }, [multiplayerRoom?.code, user?.id, gameState, addToast]);

  // Internal mutable refs for 60fps canvas loop
  const loopRef = useRef<{
    animationId: number;
    player: {
      x: number;
      y: number;
      width: number;
      height: number;
      vx: number;
      vy: number;
      speed: number;
      friction: number;
      maxSpeed: number;
      maxTurnSpeed: number;
      turnAccel: number;
      driftAngle: number;
      isDrifting: boolean;
      prevRlX?: number;
      prevRlY?: number;
      prevRrX?: number;
      prevRrY?: number;
      hp: number;
      invulnerableTimer: number;
      shieldTimer: number;
      nitroTimer: number;
      magnetTimer: number;
      multiplierTimer: number;
      slowTimer: number;
    };
    keys: Record<string, boolean>;
    obstacles: any[];
    particles: any[];
    skidMarks: Array<{
      rlX1: number;
      rlY1: number;
      rlX2: number;
      rlY2: number;
      rrX1: number;
      rrY1: number;
      rrX2: number;
      rrY2: number;
      opacity: number;
      life: number;
      maxLife: number;
    }>;
    powerUps: any[];
    floatingTexts: any[];
    sparks: any[];
    shockwaves: any[];
    rainDrops: any[];
    roadY: number;
    worldY: number;
    smoothSpeed?: number;
    score: number;
    distance: number;
    frameCount: number;
    screenShake: number;
    screenFlash: number;
    heat: number;
    bounty: number;
    combo: number;
    comboTimer: number;
    bestCombo: number;
    obstaclesDodged: number;
    powerUpsCollected: number;
    nearMisses: number;
    empUsed: number;
    level: number;
    levelTheme: string;
    boss: any;
    bossTimer: number;
    roadEvent: string | null;
    roadEventTimer: number;
    mission: any;
    missionProgress: number;
    nitroEnergy: number;
    empCharges: number;
  }>({
    animationId: 0,
    player: {
      x: 200,
      y: 400,
      width: 44,
      height: 82,
      vx: 0,
      vy: 0,
      speed: 0.95,
      friction: 0.82,
      maxSpeed: 8.5,
      maxTurnSpeed: 5.8,
      turnAccel: 0.88,
      driftAngle: 0,
      isDrifting: false,
      hp: 3,
      invulnerableTimer: 0,
      shieldTimer: 0,
      nitroTimer: 0,
      magnetTimer: 0,
      multiplierTimer: 0,
      slowTimer: 0,
    },
    keys: {},
    obstacles: [],
    particles: [],
    skidMarks: [],
    powerUps: [],
    floatingTexts: [],
    sparks: [],
    shockwaves: [],
    rainDrops: [],
    roadY: 0,
    worldY: 0,
    smoothSpeed: 5,
    score: 0,
    distance: 0,
    frameCount: 0,
    screenShake: 0,
    screenFlash: 0,
    heat: 0,
    bounty: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    obstaclesDodged: 0,
    powerUpsCollected: 0,
    nearMisses: 0,
    empUsed: 0,
    level: 1,
    levelTheme: 'day',
    boss: null,
    bossTimer: 0,
    roadEvent: null,
    roadEventTimer: 0,
    mission: null,
    missionProgress: 0,
    nitroEnergy: 50,
    empCharges: 2,
  });

  // Activate Nitro Turbo ability
  const activateNitro = useCallback(() => {
    const state = loopRef.current;
    const p = state.player;
    if (state.nitroEnergy >= 15) {
      // Consume 25% nitro per activation (or whatever is left if under 25%)
      const cost = Math.min(25, state.nitroEnergy);
      const boostFrames = Math.round((cost / 25) * 160);
      p.nitroTimer = Math.max(p.nitroTimer, boostFrames);
      state.nitroEnergy = Math.max(0, state.nitroEnergy - cost);
      setNitroEnergy(Math.round(state.nitroEnergy));
      sound.play('nitro');
      addToast(`TURBO NITRO AKTIF! (-${Math.round(cost)}%)`, 'purple');
      state.screenShake = 6;
    } else {
      sound.play('click');
      addToast('NITRO HABIS! AMBIL ITEM NITRO DI JALAN ⚡', 'rose');
    }
  }, [addToast]);

  // Activate EMP shockwave ability
  const activateEmp = useCallback(() => {
    const state = loopRef.current;
    if (state.empCharges > 0) {
      state.empCharges--;
      setEmpCharges(state.empCharges);
      state.empUsed++;
      sound.play('emp');

      let destroyed = 0;
      for (let k = state.obstacles.length - 1; k >= 0; k--) {
        const ob = state.obstacles[k];
        if (ob.type !== 'barricade' && ob.type !== 'spike') {
          for (let i = 0; i < 16; i++) {
            state.particles.push({
              x: ob.x + ob.width / 2,
              y: ob.y + ob.height / 2,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              color: Math.random() > 0.5 ? '#00f0ff' : '#ff003c',
              size: Math.random() * 5 + 2,
              life: 25,
              maxLife: 25,
            });
          }
          destroyed++;
          state.obstacles.splice(k, 1);
        }
      }
      state.shockwaves.push({ x: state.player.x + state.player.width / 2, y: state.player.y, r: 10, max: 130, life: 25 });
      state.score += destroyed * 30;
      state.heat = Math.max(0, state.heat - 20);
      state.screenShake = 14;
      addToast(`⚡ EMP MELEDAK! ${destroyed} POLISI LUMPUH`, 'magenta');
      if (multiplayerRoom) {
        socket.send({ type: 'player_action', action: 'emp', value: destroyed });
      }
    } else {
      addToast('EMP KOSONG! AMBIL POWER-UP 💥', 'amber');
    }
  }, [multiplayerRoom, addToast]);

  // Missions
  const generateMission = useCallback(() => {
    const list = [
      { id: 'survive', text: 'Bertahan {target} m', target: 250, reward: 120 },
      { id: 'dodge', text: 'Hindari {target} rintangan', target: 15, reward: 140 },
      { id: 'collect', text: 'Ambil {target} power-up', target: 5, reward: 160 },
      { id: 'combo', text: 'Capai combo ×{target}', target: 10, reward: 200 },
      { id: 'near', text: 'Lakukan {target} NEAR MISS', target: 6, reward: 180 },
    ];
    const picked = list[Math.floor(Math.random() * list.length)];
    loopRef.current.mission = picked;
    loopRef.current.missionProgress = 0;
    setMissionText(`MISI: ${picked.text.replace('{target}', String(picked.target))} [0/${picked.target}]`);
  }, []);

  // Primary Start & Reset Game Handler
  const startGame = useCallback(() => {
    try {
      sound.ensureContext();
      sound.play('click');
    } catch {}

    const canvas = canvasRef.current;
    const container = containerRef.current;

    const width = Math.max(container?.clientWidth || 0, canvas?.width || 0, 720);
    const height = Math.max(container?.clientHeight || 0, canvas?.height || 0, 560);
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }

    const carData = getCarModel(userRef.current?.carModel);
    const hpFactor = carData.stats.horsepower || (carData.stats.accel ?? 85);
    const tunedSpeed = 1.15 + (hpFactor / 100) * 0.26;
    const tunedFriction = 0.82;
    const tunedMaxSpeed = 8.2 + (carData.stats.speed / 100) * 1.8;
    // Calibrated turn dynamics: slightly faster & responsive for evasive maneuvers (e.g. MAXXX mode)
    const diffBonus = difficulty === 'MAXXX' ? 1.0 : difficulty === 'HARD' ? 0.5 : 0;
    const tunedMaxTurnSpeed = 5.6 + (carData.stats.handling / 100) * 1.2 + diffBonus;
    const tunedTurnAccel = 0.88 + (carData.stats.handling / 100) * 0.18 + (difficulty === 'MAXXX' ? 0.15 : 0);
    const startingHp = 3;

    const geom = getRoadGeometry(width);

    loopRef.current.player = {
      x: geom.roadLeft + geom.roadWidth / 2 - 22,
      y: height - 140,
      width: 44,
      height: 82,
      vx: 0,
      vy: 0,
      speed: tunedSpeed,
      friction: tunedFriction,
      maxSpeed: tunedMaxSpeed,
      maxTurnSpeed: tunedMaxTurnSpeed,
      turnAccel: tunedTurnAccel,
      driftAngle: 0,
      isDrifting: false,
      hp: startingHp,
      invulnerableTimer: 60,
      shieldTimer: 0,
      nitroTimer: 0,
      magnetTimer: 0,
      multiplierTimer: 0,
      slowTimer: 0,
    };
    loopRef.current.skidMarks = [];
    loopRef.current.nitroEnergy = 50;
    loopRef.current.empCharges = 2;
    loopRef.current.obstacles = [];
    loopRef.current.powerUps = [];
    loopRef.current.particles = [];
    loopRef.current.floatingTexts = [];
    loopRef.current.sparks = [];
    loopRef.current.shockwaves = [];
    loopRef.current.score = 0;
    loopRef.current.distance = 0;
    loopRef.current.frameCount = 0;
    loopRef.current.heat = 0;
    loopRef.current.bounty = 0;
    loopRef.current.combo = 0;
    loopRef.current.bestCombo = 0;
    loopRef.current.obstaclesDodged = 0;
    loopRef.current.powerUpsCollected = 0;
    loopRef.current.nearMisses = 0;
    loopRef.current.empUsed = 0;
    loopRef.current.level = 1;
    loopRef.current.boss = null;
    loopRef.current.bossTimer = 0;

    generateMission();
    setScore(0);
    setHp(startingHp);
    setLevel(1);
    setCombo(0);
    setHeat(0);
    setNitroEnergy(50);
    setEmpCharges(2);
    setBossInfo(null);
    setMultiplayerWinner(null);
    setLatestLeaderboardRank(null);
    setScoreSavedStatus('idle');
    setGameState('PLAYING');
  }, [generateMission, difficulty]);

  startGameRef.current = startGame;

  const finishGameAndSave = useCallback((reason: 'completed' | 'crashed' = 'completed') => {
    sound.ensureContext();
    const state = loopRef.current;
    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
    }
    sound.play(reason === 'completed' ? 'success' : 'gameover');
    setGameState('GAMEOVER');

    const finalScoreVal = Math.floor(state.score);
    if (finalScoreVal > highScoreRef.current) {
      setHighScore(finalScoreVal);
    }

    setScore(finalScoreVal);
    setHp(state.player.hp);
    setDistance(Math.floor(state.distance));
    setDodgedCount(state.obstaclesDodged);
    setPowerupsCount(state.powerUpsCollected);
    setBestComboRun(state.bestCombo);
    setBountyEarned(Math.floor(state.bounty));

    setScoreSavedStatus('saving');
    api.submitScore({
      userId: userRef.current?.id || user?.id || 'guest',
      username: userRef.current?.username || user?.username,
      avatar: userRef.current?.avatar || user?.avatar,
      title: userRef.current?.title || user?.title,
      carColor: userRef.current?.carColor || user?.carColor,
      carModel: userRef.current?.carModel || user?.carModel,
      score: finalScoreVal,
      distance: Math.floor(state.distance),
      bestCombo: state.bestCombo,
      difficulty,
      obstaclesDodged: state.obstaclesDodged,
      powerUpsCollected: state.powerUpsCollected,
      bossKilled: state.level >= 3,
      empUsed: state.empUsed,
      nearMisses: state.nearMisses,
    }).then(res => {
      if (res?.isRegistered) {
        setScoreSavedStatus('saved');
        if (res.rank) {
          setLatestLeaderboardRank(res.rank);
        }
      } else {
        setScoreSavedStatus('unregistered');
      }
      if (res?.rank && onScoreSubmittedRef.current) {
        onScoreSubmittedRef.current(finalScoreVal, res.rank);
      }
    }).catch(() => {
      setScoreSavedStatus('saved');
    });

    if (multiplayerRoomRef.current) {
      socket.send({ type: 'player_action', action: 'crashed' });
    }
  }, [difficulty, user]);

  const finishGameAndSaveRef = useRef(finishGameAndSave);
  finishGameAndSaveRef.current = finishGameAndSave;

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not hijack keys if user is typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      loopRef.current.keys[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        togglePause();
      }
      if (e.key.toLowerCase() === 'm') {
        toggleSound();
      }
      if (e.code === 'Space' || e.key === 'Shift') {
        if (gameState === 'PLAYING') {
          activateNitro();
        } else if (gameState === 'START' || gameState === 'GAMEOVER') {
          startGame();
        }
      }
      if (e.key.toLowerCase() === 'e' || e.key.toLowerCase() === 'x') {
        if (gameState === 'PLAYING') {
          activateEmp();
        }
      }
      if (e.key.toLowerCase() === 'r') {
        const c = canvasRef.current;
        if (c) {
          loopRef.current.player.x = c.width / 2 - loopRef.current.player.width / 2;
          loopRef.current.player.y = c.height - 140;
          loopRef.current.player.vx = 0;
          loopRef.current.player.vy = 0;
          addToast('POSISI DI-RESET', 'cyan');
        }
      }
      if (e.key === 'Enter') {
        if (gameState === 'START') startGame();
        else if (gameState === 'GAMEOVER') startGame();
        else if (gameState === 'PAUSED') togglePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      loopRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, addToast, activateNitro, activateEmp, startGame]);

  // Touch handlers
  const setTouchKey = (key: string, pressed: boolean) => {
    loopRef.current.keys[key] = pressed;
  };

  // Direct canvas touch drag for intuitive mobile/mouse steering
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; px: number; py: number }>({ x: 0, y: 0, px: 0, py: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: touchX,
      y: touchY,
      px: loopRef.current.player.x,
      py: loopRef.current.player.y,
    };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const dx = touchX - dragStartRef.current.x;
    const dy = touchY - dragStartRef.current.y;

    const geom = getRoadGeometry(canvas.width);
    const p = loopRef.current.player;
    const prevX = p.x;
    p.x = Math.max(geom.roadLeft + 10, Math.min(geom.roadRight - 10 - p.width, dragStartRef.current.px + dx));
    p.y = Math.max(16, Math.min(canvas.height - p.height - 10, dragStartRef.current.py + dy));
    const maxTurn = p.maxTurnSpeed || 5.8;
    const calcVx = (p.x - prevX) * 0.42;
    p.vx = Math.max(-maxTurn, Math.min(maxTurn, calcVx));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Robust container ResizeObserver to keep canvas sized accurately
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const syncDimensions = () => {
      const w = Math.floor(container.clientWidth);
      const h = Math.floor(container.clientHeight);
      if (w > 0 && h > 0) {
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          const geom = getRoadGeometry(w);
          const p = loopRef.current.player;
          if (p) {
            p.x = Math.max(geom.roadLeft + 10, Math.min(geom.roadRight - 10 - p.width, p.x));
            if (p.y <= 20 || p.y > h - p.height) {
              p.y = h - 140;
            }
          }
        }
      }
    };

    syncDimensions();
    const ro = new ResizeObserver(() => syncDimensions());
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Attract-mode highway preview when on start screen
  useEffect(() => {
    if (gameState !== 'START') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let offset = 0;

    const drawStartPreview = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
          canvas.width = w;
          canvas.height = h;
        }
      }

      offset = (offset + 2.5) % 100;
      const { roadWidth, roadLeft, roadRight, laneW } = getRoadGeometry(canvas.width);
      const activeMap = getMapData(mapIdRef.current);

      // Render 2D Themed Roadside Scenery on Shoulders (Buildings, Snow/Pines, Sand/Cacti, Canopy, Cliffs)
      roadsideScenery2D.render(
        ctx,
        canvas.width,
        canvas.height,
        roadLeft,
        roadRight,
        roadWidth,
        offset * 2,
        activeMap,
        Math.floor(offset * 2),
        2.5
      );

      // Highway surface
      ctx.fillStyle = activeMap.roadColor;
      ctx.fillRect(roadLeft, 0, roadWidth, canvas.height);

      // Curbs
      for (let i = -100; i < canvas.height; i += 60) {
        const cy = i + offset;
        ctx.fillStyle = (i / 60) % 2 === 0 ? activeMap.curbColor1 : activeMap.curbColor2;
        ctx.fillRect(roadLeft - 6, cy, 6, 60);
        ctx.fillRect(roadRight, cy, 6, 60);
      }

      // Lane dividers
      ctx.fillStyle = activeMap.laneColor;
      for (let i = -100; i < canvas.height; i += 100) {
        ctx.fillRect(roadLeft + laneW - 4, i + offset, 8, 48);
        ctx.fillRect(roadLeft + laneW * 2 - 4, i + offset, 8, 48);
      }

      // Center neon line
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = activeMap.accentColor || '#00f0ff';
      ctx.fillRect(roadLeft + roadWidth / 2 - 2, 0, 4, canvas.height);
      ctx.globalAlpha = 1;

      // Cruising Player Car Preview
      const previewCarModel = userRef.current?.carModel || user?.carModel || 'civic_fl5';
      const previewCarColor = userRef.current?.carColor || user?.carColor || '#f8fafc';
      drawCar2D(ctx, {
        x: roadLeft + roadWidth / 2,
        y: canvas.height - 120 + Math.sin(offset * 0.15) * 1.5,
        width: 44,
        height: 82,
        model: previewCarModel,
        color: previewCarColor,
        isNitro: false,
        frameCount: Math.floor(offset),
        showShadow: true,
        showUnderglow: true,
      });

      animId = requestAnimationFrame(drawStartPreview);
    };

    animId = requestAnimationFrame(drawStartPreview);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  const togglePause = () => {
    sound.ensureContext();
    if (gameState === 'PLAYING') {
      sound.play('click');
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      sound.play('click');
      setGameState('PLAYING');
    }
  };

  // Main 60fps Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const miniMap = miniMapRef.current;
    const mctx = miniMap ? miniMap.getContext('2d') : null;

    const state = loopRef.current;
    const diff = diffSettings[difficulty];
    let isRunning = true;

    // Resize canvas to container safely without setting zero
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      if (cw > 0 && ch > 0) {
        if (canvas.width !== cw) canvas.width = cw;
        if (canvas.height !== ch) canvas.height = ch;
      }
    }

    const checkCollision = (a: any, b: any) =>
      a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

    const roundRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      r = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r);
      c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r);
      c.quadraticCurveTo(x, y, x + r, y);
      c.closePath();
    };

    const spawnExplosion = (x: number, y: number) => {
      sound.play('crash');
      for (let i = 0; i < 22; i++) {
        state.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          color: Math.random() > 0.5 ? '#ff2d6b' : '#ffb703',
          size: Math.random() * 5 + 2,
          life: 30,
          maxLife: 30,
        });
      }
      state.shockwaves.push({ x, y, r: 5, max: 48, life: 20 });
    };

    const tick = () => {
      if (!isRunning) return;

      const p = state.player;
      state.frameCount++;

      // Player Movement: agile yet controlled, not overly fast, with firm road grip
      const steerInput =
        (state.keys.ArrowLeft || state.keys.a || state.keys.A ? -1 : 0) +
        (state.keys.ArrowRight || state.keys.d || state.keys.D ? 1 : 0);

      const maxTurn = p.maxTurnSpeed || 5.8;
      const turnAccel = p.turnAccel || 0.88;

      if (steerInput !== 0) {
        // Agile & quick evasive steering with soft progressive responsiveness
        p.vx += steerInput * turnAccel;
        p.vx = Math.max(-maxTurn, Math.min(maxTurn, p.vx));
        p.vx *= 0.91; // silky smooth lateral acceleration
      } else {
        // High tire grip with soft deceleration curve (no harsh snapping)
        p.vx *= 0.80;
        if (Math.abs(p.vx) < 0.04) p.vx = 0;
      }

      const isMovingForward = Boolean(state.keys.ArrowUp || state.keys.w || state.keys.W);
      const isMovingBackward = Boolean(state.keys.ArrowDown || state.keys.s || state.keys.S);

      if (isMovingForward) p.vy -= p.speed * 1.08;
      if (isMovingBackward) p.vy += p.speed * 0.82;

      p.vy *= 0.88; // gentle forward/reverse suspension inertia
      if (Math.abs(p.vy) < 0.04) p.vy = 0;

      // Realistic progressive body tilt & suspension roll on turn
      const targetDrift = (p.vx / maxTurn) * 0.14;
      p.driftAngle = (p.driftAngle || 0) + (targetDrift - (p.driftAngle || 0)) * 0.16;
      p.isDrifting = Math.abs(p.vx) > 0.8 || (steerInput !== 0 && Math.abs(p.vx) > 0.4);

      const geom = getRoadGeometry(canvas.width);
      p.x = Math.max(geom.roadLeft + 10, Math.min(geom.roadRight - 10 - p.width, p.x + p.vx));
      p.y = Math.max(16, Math.min(canvas.height - p.height - 10, p.y + p.vy));

      // Timers
      if (p.invulnerableTimer > 0) p.invulnerableTimer--;
      if (p.shieldTimer > 0) p.shieldTimer--;
      if (p.nitroTimer > 0) p.nitroTimer--;
      if (p.magnetTimer > 0) p.magnetTimer--;
      if (p.multiplierTimer > 0) p.multiplierTimer--;
      if (p.slowTimer > 0) p.slowTimer--;

      // Sync nitro & ability state to UI periodically
      if (state.frameCount % 10 === 0) {
        setNitroEnergy(Math.round(state.nitroEnergy));
        setEmpCharges(state.empCharges);
      }

      // Current Speed & Score Accumulation
      let currentSpeed = diff.baseSpeed + state.score / 1000;
      if (isMovingForward) currentSpeed += 2.2; // Sedikit lebih cepat saat menekan maju / gas
      if (isMovingBackward) currentSpeed = Math.max(3.8, currentSpeed - 1.8);
      if (p.slowTimer > 0) currentSpeed *= 0.62;
      let multiplier = 1;
      if (p.nitroTimer > 0) {
        currentSpeed += 9;
        multiplier *= 2;
      }
      if (p.multiplierTimer > 0) multiplier *= 2;
      if (state.roadEvent === 'doubleXP') multiplier *= 2;

      // Smooth camera & world speed interpolation for silky progressive acceleration
      state.smoothSpeed = (state.smoothSpeed || currentSpeed) + (currentSpeed - (state.smoothSpeed || currentSpeed)) * 0.18;
      const renderSpeed = state.smoothSpeed;

      // Real Tire Friction Skid Marks Left on Asphalt ("gesekan ban pada jalan yg berbekas")
      // Left on asphalt when steering firmly without any bubble/circle particles
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2;
      const cosA = Math.cos(p.driftAngle || 0);
      const sinA = Math.sin(p.driftAngle || 0);

      // Rear left & rear right tire contact points
      const rlX = cx + (-p.width * 0.36 * cosA - p.height * 0.35 * sinA);
      const rlY = cy + (-p.width * 0.36 * sinA + p.height * 0.35 * cosA);
      const rrX = cx + (p.width * 0.36 * cosA - p.height * 0.35 * sinA);
      const rrY = cy + (p.width * 0.36 * sinA + p.height * 0.35 * cosA);

      if (p.isDrifting && p.prevRlX !== undefined && p.prevRlY !== undefined) {
        if (!state.skidMarks) state.skidMarks = [];
        if (state.skidMarks.length > 150) {
          state.skidMarks.shift();
        }
        const lateralIntensity = Math.min(1, Math.abs(p.vx) / maxTurn);
        state.skidMarks.push({
          rlX1: p.prevRlX,
          rlY1: p.prevRlY,
          rlX2: rlX,
          rlY2: rlY,
          rrX1: p.prevRrX!,
          rrY1: p.prevRrY!,
          rrX2: rrX,
          rrY2: rrY,
          opacity: 0.30 + lateralIntensity * 0.40,
          life: 90,
          maxLife: 90,
        });
      }

      // Update previous tire contact positions for continuous tread lines
      p.prevRlX = rlX;
      p.prevRlY = rlY;
      p.prevRrX = rrX;
      p.prevRrY = rrY;

      state.score += 0.1 * multiplier;
      state.distance += currentSpeed * 0.05;

      // Heat generation & police AI pressure
      state.heat = Math.min(100, state.heat + diff.ai * 0.002 + (state.combo > 6 ? 0.001 : 0));

      // Level progression
      const newLvl = 1 + Math.floor(state.score / 400);
      if (newLvl !== state.level) {
        state.level = newLvl;
        sound.play('levelup');
        addToast(`LEVEL ${state.level}! ARMA POLISI SEMAKIN KETAT`, 'cyan');
        if (state.level % 3 === 0) {
          state.bossTimer = 200;
          addToast('INTERCEPTOR BOSS TERDETEKSI DI DEPAN!', 'magenta');
          sound.play('boss');
        }
      }

      // Mission progress check
      if (state.mission) {
        if (state.mission.id === 'survive') state.missionProgress = Math.floor(state.distance);
        if (state.mission.id === 'dodge') state.missionProgress = state.obstaclesDodged;
        if (state.mission.id === 'collect') state.missionProgress = state.powerUpsCollected;
        if (state.mission.id === 'combo') state.missionProgress = Math.max(state.missionProgress, state.bestCombo);
        if (state.mission.id === 'near') state.missionProgress = state.nearMisses;

        // Update live HUD mission progress periodically
        if (state.frameCount % 20 === 0) {
          setMissionText(`MISI: ${state.mission.text.replace('{target}', String(state.mission.target))} [${Math.min(state.mission.target, state.missionProgress)}/${state.mission.target}]`);
        }

        if (state.missionProgress >= state.mission.target) {
          state.score += state.mission.reward;
          state.bounty += state.mission.reward;
          sound.play('levelup');
          addToast(`MISI SELESAI +${state.mission.reward} BOUNTY!`, 'green');
          generateMission();
        }
      }

      // Multiplayer sync throttle (every 3 frames ~20Hz)
      if (multiplayerRoom && state.frameCount % 3 === 0) {
        socket.send({
          type: 'player_sync',
          x: p.x,
          y: p.y,
          score: Math.floor(state.score),
          hp: p.hp,
          combo: state.combo,
          status: p.hp > 0 ? 'playing' : 'crashed',
          carColor: userRef.current?.carColor || '#f8fafc',
          carModel: userRef.current?.carModel || 'civic_fl5',
          username: userRef.current?.username || 'Racer',
          avatar: userRef.current?.avatar || '🏎️',
        });
      }

      // Spawn Obstacles
      const spawnFreq = Math.max(14, diff.spawnBase - Math.floor(state.score / 50) - Math.floor(state.heat / 15));
      if (state.frameCount % spawnFreq === 0) {
        const roll = Math.random();
        let type = 'police';
        if (difficulty === 'MAXXX' && roll < 0.1) type = 'drone';
        else if (roll < 0.08) type = 'spike';
        else if (roll < 0.18) type = 'barricade';
        else if (roll < 0.42) type = 'motorcycle';
        else if (roll < 0.76) type = 'police';
        else if (roll < 0.9) type = 'elite';
        else type = 'void';

        // Select from the 4 authentic police car variants (Sedan, Interceptor, Sports, SUV)
        const policeVariants: PoliceCarVariant[] = ['sedan', 'interceptor', 'sports', 'suv'];
        const policeVariant = policeVariants[Math.floor(Math.random() * policeVariants.length)];

        let w = 46,
          h = 86;
        if (type === 'barricade') {
          w = 130;
          h = 38;
        } else if (type === 'spike') {
          w = 145;
          h = 24;
        } else if (type === 'motorcycle') {
          // Indonesian Highway Patrol Motorcycle dimensions
          w = 30;
          h = 64;
        } else if (type === 'police' || type === 'elite') {
          if (policeVariant === 'suv') {
            w = 52;
            h = 94;
          } else if (policeVariant === 'interceptor') {
            w = 48;
            h = 88;
          } else if (policeVariant === 'sports') {
            w = 46;
            h = 86;
          } else {
            w = 46;
            h = 86;
          }
        } else if (type === 'drone') {
          w = 44;
          h = 34;
        }

        const spd =
          type === 'police'
            ? (Math.random() * 1.5 + 1) * diff.obstacleSpeedMul
            : type === 'elite'
            ? (Math.random() * 2 + 2) * diff.obstacleSpeedMul
            : type === 'motorcycle'
            ? (Math.random() * 2 + 2.5) * diff.obstacleSpeedMul
            : type === 'drone'
            ? (Math.random() * 2 + 2) * diff.obstacleSpeedMul
            : 0;

        // 3-lane compact road positions
        const { roadWidth, roadLeft, roadRight, laneW, laneCenters } = getRoadGeometry(canvas.width);
        const initialLane = Math.floor(Math.random() * 3);
        const spawnX = Math.max(roadLeft + 10, Math.min(roadRight - 10 - w, laneCenters[initialLane] - w / 2));

        state.obstacles.push({
          type,
          policeVariant,
          x: spawnX,
          y: -120,
          width: w,
          height: h,
          speed: spd,
          startX: spawnX,
          currentLane: initialLane,
          targetLane: initialLane,
          // Alternating lane change timer in MAXXX mode (staggered across vehicles)
          laneChangeTimer: 35 + ((state.obstacles.length * 31) % 50),
          laneChangeCooldown: 70 + Math.floor(Math.random() * 50),
          tiltAngle: 0,
          // Motorcycle runs completely straight: do not weave!
          weave: type === 'drone',
          weaveAmp: Math.random() * 30 + 20,
          grazed: false,
        });
      }

      // Spawn Power-Ups
      if (Math.random() < 0.008 + state.level * 0.0003) {
        let type: string;
        // If nitro is depleted or running low, boost chance of spawning a nitro item
        if (state.nitroEnergy < 50 && Math.random() < 0.35) {
          type = 'nitro';
        } else {
          const types = ['shield', 'nitro', 'repair', 'magnet', 'multiplier', 'coin', 'cloak', 'freeze', 'emp'];
          type = types[Math.floor(Math.random() * types.length)];
        }
        const { roadLeft, roadWidth } = getRoadGeometry(canvas.width);
        state.powerUps.push({
          type,
          x: roadLeft + 20 + Math.random() * (roadWidth - 40 - 28),
          y: -40,
          width: 28,
          height: 28,
        });
      }

      // Road background scroll
      state.worldY = (state.worldY || 0) + renderSpeed;
      state.roadY = (state.roadY + renderSpeed) % 100;

      // -----------------------------------------------------------------
      // RENDER
      // -----------------------------------------------------------------
      ctx.save();
      if (user?.layoutSettings.screenShake && state.screenShake > 0) {
        const sx = (Math.random() - 0.5) * state.screenShake * 1.8;
        const sy = (Math.random() - 0.5) * state.screenShake * 1.8;
        ctx.translate(sx, sy);
        state.screenShake *= 0.88; // gentle exponential decay
        if (state.screenShake < 0.2) state.screenShake = 0;
      }

      const { roadWidth, roadLeft, roadRight, laneW } = getRoadGeometry(canvas.width);
      const activeMap = getMapData(mapIdRef.current);

      // Render 2D Themed Roadside Scenery (Buildings, Snow/Pines, Sand/Cacti, Canopy, Cliffs)
      roadsideScenery2D.render(
        ctx,
        canvas.width,
        canvas.height,
        roadLeft,
        roadRight,
        roadWidth,
        state.worldY || 0,
        activeMap,
        state.frameCount,
        renderSpeed
      );

      // Main asphalt road surface
      ctx.fillStyle = activeMap.roadColor;
      ctx.fillRect(roadLeft, 0, roadWidth, canvas.height);

      // Map Curbs
      for (let i = -100; i < canvas.height; i += 60) {
        const cy = i + state.roadY;
        ctx.fillStyle = (i / 60) % 2 === 0 ? activeMap.curbColor1 : activeMap.curbColor2;
        ctx.fillRect(roadLeft - 6, cy, 6, 60);
        ctx.fillRect(roadRight, cy, 6, 60);
      }

      // Lane dividers
      ctx.fillStyle = activeMap.laneColor;
      for (let i = -100; i < canvas.height; i += 100) {
        ctx.fillRect(roadLeft + laneW - 4, i + state.roadY, 8, 48);
        ctx.fillRect(roadLeft + laneW * 2 - 4, i + state.roadY, 8, 48);
      }

      // Center highway ambient glow line
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = activeMap.accentColor || '#00f0ff';
      ctx.fillRect(roadLeft + roadWidth / 2 - 2, 0, 4, canvas.height);
      ctx.globalAlpha = 1;

      // Render Tire Skid Marks on Road Surface (Real rubber tire tracks on asphalt)
      if (state.skidMarks && state.skidMarks.length > 0) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineWidth = 3.5;

        for (let i = state.skidMarks.length - 1; i >= 0; i--) {
          const sm = state.skidMarks[i];
          sm.rlY1 += renderSpeed;
          sm.rlY2 += renderSpeed;
          sm.rrY1 += renderSpeed;
          sm.rrY2 += renderSpeed;
          sm.life--;

          if (sm.life <= 0 || (sm.rlY1 > canvas.height + 60 && sm.rrY1 > canvas.height + 60)) {
            state.skidMarks.splice(i, 1);
            continue;
          }

          const alpha = sm.opacity * (sm.life / sm.maxLife);
          ctx.strokeStyle = `rgba(12, 14, 20, ${alpha})`;

          // Left tire tread mark
          ctx.beginPath();
          ctx.moveTo(sm.rlX1, sm.rlY1);
          ctx.lineTo(sm.rlX2, sm.rlY2);
          ctx.stroke();

          // Right tire tread mark
          ctx.beginPath();
          ctx.moveTo(sm.rrX1, sm.rrY1);
          ctx.lineTo(sm.rrX2, sm.rrY2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Update & Draw Power-Ups
      for (let i = state.powerUps.length - 1; i >= 0; i--) {
        const pu = state.powerUps[i];
        if (p.magnetTimer > 0) {
          const dx = p.x + p.width / 2 - (pu.x + pu.width / 2);
          const dy = p.y + p.height / 2 - (pu.y + pu.height / 2);
          const d = Math.hypot(dx, dy);
          if (d < 240 && d > 1) {
            // Smooth progressive magnetic attraction curve
            const pullStrength = Math.min(8.5, Math.max(2.0, (240 - d) * 0.045));
            pu.x += (dx / d) * pullStrength;
            pu.y += (dy / d) * pullStrength;
          }
        }
        pu.y += renderSpeed;

        // Draw Powerup with gentle floating bobbing & soft pulsing aura
        const colors: Record<string, string> = {
          shield: '#00f0ff',
          nitro: '#7c5cff',
          repair: '#ff6bd6',
          magnet: '#ffb703',
          multiplier: '#06ffa5',
          coin: '#ffe066',
          cloak: '#a29bfe',
          freeze: '#74b9ff',
          emp: '#ff003c',
        };
        const icons: Record<string, string> = {
          shield: '🛡️',
          nitro: '⚡',
          repair: '❤️',
          magnet: '🧲',
          multiplier: '2×',
          coin: '🪙',
          cloak: '👁️',
          freeze: '❄️',
          emp: '💥',
        };

        const col = colors[pu.type] || '#00f0ff';
        // Organic gentle floating motion
        const bob = Math.sin(state.frameCount * 0.07 + i * 1.3) * 2.8;
        const puX = pu.x + 14;
        const puY = pu.y + 14 + bob;
        const pulse = 1 + Math.sin(state.frameCount * 0.09 + i) * 0.06;

        ctx.save();
        // Soft outer ambient halo
        ctx.shadowBlur = 16 * pulse;
        ctx.shadowColor = col;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(puX, puY, 13 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner soft radial highlight
        const grad = ctx.createRadialGradient(puX - 3, puY - 3, 2, puX, puY, 13 * pulse);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(puX, puY, 13 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '12px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(icons[pu.type] || '★', puX, puY);
        ctx.restore();

        // Check powerup pickup
        if (checkCollision(p, pu)) {
          state.powerUpsCollected++;
          switch (pu.type) {
            case 'shield':
              p.shieldTimer = 340;
              sound.play('powerup');
              addToast('SHIELD FORCEFIELD AKTIF!', 'cyan');
              break;
            case 'nitro':
              const refillAmount = 50;
              state.nitroEnergy = Math.min(100, state.nitroEnergy + refillAmount);
              setNitroEnergy(Math.round(state.nitroEnergy));
              p.nitroTimer = Math.max(p.nitroTimer, 180);
              sound.play('nitro');
              addToast('+50% NITRO REFILL! BOOST AKTIF! ⚡', 'purple');
              break;
            case 'repair':
              if (p.hp < maxHp) p.hp++;
              sound.play('powerup');
              addToast('+1 HP REPAIR', 'magenta');
              break;
            case 'magnet':
              p.magnetTimer = 380;
              sound.play('magnet');
              addToast('MAGNET BOUNTY AKTIF!', 'amber');
              break;
            case 'multiplier':
              p.multiplierTimer = 320;
              sound.play('multiplier');
              addToast('SKOR & BOUNTY 2×!', 'green');
              break;
            case 'coin':
              state.score += 40;
              state.bounty += 50;
              sound.play('coin');
              break;
            case 'freeze':
              p.slowTimer = 220;
              sound.play('powerup');
              addToast('POLISI DIBEKUKAN!', 'cyan');
              break;
            case 'emp': {
              state.empCharges = Math.min(5, state.empCharges + 1);
              setEmpCharges(state.empCharges);
              state.empUsed++;
              sound.play('emp');
              let destroyed = 0;
              for (let k = state.obstacles.length - 1; k >= 0; k--) {
                const ob = state.obstacles[k];
                if (ob.type !== 'barricade' && ob.type !== 'spike') {
                  spawnExplosion(ob.x + ob.width / 2, ob.y + ob.height / 2);
                  destroyed++;
                  state.obstacles.splice(k, 1);
                }
              }
              state.score += destroyed * 25;
              state.heat = Math.max(0, state.heat - 15);
              state.screenShake = 12;
              addToast(`EMP AKTIF! ${destroyed} KENDARAAN HANCUR`, 'magenta');
              if (multiplayerRoom) {
                socket.send({ type: 'player_action', action: 'emp', value: destroyed });
              }
              break;
            }
          }
          state.powerUps.splice(i, 1);
        } else if (pu.y > canvas.height + 40) {
          state.powerUps.splice(i, 1);
        }
      }

      // Update & Draw Obstacles
      let triggerGameOver = false;
      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        const o = state.obstacles[i];
        o.y += renderSpeed + o.speed;

        // Lane switching logic for MAXXX mode:
        // Police cars and police motorcycles change lanes alternately
        if (difficulty === 'MAXXX' && (o.type === 'police' || o.type === 'elite' || o.type === 'motorcycle')) {
          if (o.laneChangeTimer !== undefined) {
            o.laneChangeTimer--;
            if (o.laneChangeTimer <= 0) {
              const cur = o.currentLane ?? 1;
              const possibleLanes: number[] = [];
              if (cur > 0) possibleLanes.push(cur - 1);
              if (cur < 2) possibleLanes.push(cur + 1);
              if (possibleLanes.length > 0) {
                o.targetLane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
              }
              o.laneChangeTimer = o.laneChangeCooldown || 80;
            }
          }

          const { roadLeft, laneW } = getRoadGeometry(canvas.width);
          const tgtLane = o.targetLane ?? o.currentLane ?? 1;
          const targetX = roadLeft + laneW * (tgtLane + 0.5) - o.width / 2;
          const diffX = targetX - o.x;

          const targetTilt = Math.abs(diffX) > 1.5 ? Math.sign(diffX) * 0.12 : 0;
          o.tiltAngle = (o.tiltAngle || 0) + (targetTilt - (o.tiltAngle || 0)) * 0.16;

          if (Math.abs(diffX) > 1.5) {
            const steerSpeed = o.type === 'motorcycle' ? 2.4 : 1.8;
            const step = Math.sign(diffX) * Math.min(Math.abs(diffX), steerSpeed);
            o.x += step;
            if (Math.abs(diffX) < 3) {
              o.currentLane = o.targetLane;
            }
          } else {
            o.x = targetX;
            o.currentLane = o.targetLane;
          }
        } else if (o.weave) {
          o.x += Math.sin((o.y + o.startX) * 0.03) * 1.5;
        }

        // Draw Obstacle (Facing DOWN so they move forward naturally down the road)
        ctx.save();
        if (o.type === 'police' || o.type === 'elite') {
          drawPoliceCar2D(ctx, {
            x: o.x,
            y: o.y,
            width: o.width,
            height: o.height,
            variant: o.policeVariant || 'sedan',
            frameCount: state.frameCount,
            isElite: o.type === 'elite',
            facing: 'down',
            tiltAngle: o.tiltAngle || 0,
          });
        } else if (o.type === 'motorcycle') {
          drawPoliceMotorcycle2D(ctx, {
            x: o.x,
            y: o.y,
            width: o.width,
            height: o.height,
            frameCount: state.frameCount,
            facing: 'down',
            tiltAngle: o.tiltAngle || 0,
          });
        } else {
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(o.x + 4, o.y + 4, o.width, o.height);

          if (o.type === 'barricade') {
            ctx.fillStyle = '#e17055';
            ctx.fillRect(o.x, o.y, o.width, o.height);
            ctx.fillStyle = '#dfe6e9';
            for (let b = 0; b < o.width; b += 22) {
              ctx.fillRect(o.x + b, o.y, 11, o.height);
            }
          } else if (o.type === 'spike') {
            ctx.fillStyle = '#4a4a52';
            ctx.fillRect(o.x, o.y, o.width, o.height);
            ctx.fillStyle = '#c8ccd4';
            for (let s = 6; s < o.width - 6; s += 14) {
              ctx.beginPath();
              ctx.moveTo(o.x + s, o.y + o.height);
              ctx.lineTo(o.x + s + 7, o.y);
              ctx.lineTo(o.x + s + 14, o.y + o.height);
              ctx.closePath();
              ctx.fill();
            }
          } else if (o.type === 'drone') {
            ctx.fillStyle = '#334155';
            roundRect(ctx, o.x, o.y, o.width, o.height, 4);
            ctx.fill();
            ctx.fillStyle = '#ff003c';
            ctx.fillRect(o.x + o.width / 2 - 5, o.y + 6, 10, 6);
          } else {
            // Road void / pothole
            ctx.fillStyle = '#07070a';
            ctx.beginPath();
            ctx.ellipse(o.x + o.width / 2, o.y + o.height / 2, o.width / 2, o.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

        // Near-Miss / Graze detection
        if (!o.grazed) {
          const grazeBox = { x: p.x - 14, y: p.y - 14, width: p.width + 28, height: p.height + 28 };
          if (checkCollision(grazeBox, o) && !checkCollision(p, o)) {
            o.grazed = true;
            state.score += 20;
            state.bounty += 10;
            state.nearMisses++;
            state.nitroEnergy = Math.min(100, state.nitroEnergy + 15);
            setNitroEnergy(Math.round(state.nitroEnergy));
            sound.play('nearmiss');
            state.floatingTexts.push({
              x: p.x + p.width / 2,
              y: p.y - 8,
              text: 'NEAR MISS! +15% NITRO',
              color: '#ffb703',
              life: 35,
            });
          }
        }

        // Player Collision
        if (checkCollision(p, o) && p.invulnerableTimer === 0) {
          if (p.shieldTimer > 0) {
            spawnExplosion(o.x + o.width / 2, o.y + o.height / 2);
            p.shieldTimer = 0;
            p.invulnerableTimer = 50;
            state.screenShake = 8;
            state.obstacles.splice(i, 1);
            continue;
          }

          if (p.nitroTimer > 0 && o.type !== 'barricade' && o.type !== 'spike') {
            spawnExplosion(o.x + o.width / 2, o.y + o.height / 2);
            state.score += 50;
            state.bounty += 30;
            state.combo++;
            state.screenShake = 10;
            state.obstacles.splice(i, 1);
            continue;
          }

          // Damage taken
          spawnExplosion(p.x + p.width / 2, p.y);
          p.hp--;
          p.invulnerableTimer = 80;
          state.combo = 0;
          state.screenShake = 12;
          state.heat = Math.min(100, state.heat + 10);
          if (p.hp <= 0) {
            triggerGameOver = true;
          }
        } else if (o.y > canvas.height + 40) {
          // Dodged successfully
          state.obstaclesDodged++;
          state.combo++;
          if (state.combo > state.bestCombo) state.bestCombo = state.combo;
          state.score += 10;
          state.obstacles.splice(i, 1);
        }
      }

      // Draw All Opponents in Multiplayer Mode
      if (multiplayerRoomRef.current) {
        const oppList = Object.values(opponentsRef.current) as MultiplayerPlayerState[];
        for (const opp of oppList) {
          if (opp.id === userRef.current?.id) continue;
          const oppX = opp.x + 22;
          const oppY = opp.y + 41;

          if (opp.status === 'playing' || opp.status === 'ready') {
            ctx.save();
            ctx.translate(oppX, oppY);

            drawCar2D(ctx, {
              x: 0,
              y: 0,
              width: 44,
              height: 82,
              model: opp.carModel || 'civic_fl5',
              color: opp.carColor || '#ff2d6b',
              isNitro: false,
              frameCount: state.frameCount,
              showShadow: true,
              showUnderglow: true,
            });

            // Opponent nametag with Avatar
            ctx.font = 'bold 10px Orbitron, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = opp.carColor || '#00f0ff';
            ctx.shadowBlur = 4;
            ctx.fillText(`${opp.avatar || '🏎️'} ${opp.username}`, 0, -48);
            ctx.shadowBlur = 0;

            // Mini HP Bar
            const barW = 32;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(-barW / 2, -40, barW, 3.5);
            ctx.fillStyle = opp.hp > 2 ? '#10b981' : opp.hp > 1 ? '#f59e0b' : '#ef4444';
            ctx.fillRect(-barW / 2, -40, (Math.max(0, opp.hp) / 3) * barW, 3.5);

            ctx.restore();
          } else if (opp.status === 'crashed') {
            // Draw crashed indicator
            ctx.save();
            ctx.translate(oppX, oppY);
            ctx.font = 'bold 9px Orbitron, sans-serif';
            ctx.fillStyle = '#f43f5e';
            ctx.textAlign = 'center';
            ctx.fillText(`💥 ${opp.username}`, 0, -32);
            ctx.restore();
          }
        }
      }

      // Draw Player Car
      if (p.invulnerableTimer === 0 || state.frameCount % 6 < 3) {
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate(p.driftAngle || 0);

        const carHex = userRef.current?.carColor || user?.carColor || '#f8fafc';
        const carModelId = userRef.current?.carModel || user?.carModel || 'civic_fl5';

        drawCar2D(ctx, {
          x: 0,
          y: 0,
          width: p.width,
          height: p.height,
          model: carModelId,
          color: carHex,
          isNitro: p.nitroTimer > 0,
          frameCount: state.frameCount,
          showShadow: true,
          showUnderglow: true,
        });

        // Nitro exhaust twin jet plumes - soft organic glow & smooth sinusoidal flicker
        if (p.nitroTimer > 0) {
          ctx.save();
          const flameFlicker = Math.sin(state.frameCount * 0.4) * 3 + Math.cos(state.frameCount * 0.7) * 2;
          const flameLen = 20 + flameFlicker;

          // Outer cyan jet plumes
          ctx.shadowBlur = 16;
          ctx.shadowColor = '#00f0ff';
          ctx.fillStyle = '#00e5ff';
          // Left jet
          ctx.beginPath();
          ctx.moveTo(-13, 38);
          ctx.lineTo(-7, 38);
          ctx.lineTo(-10, 38 + flameLen);
          ctx.closePath();
          ctx.fill();
          // Right jet
          ctx.beginPath();
          ctx.moveTo(7, 38);
          ctx.lineTo(13, 38);
          ctx.lineTo(10, 38 + flameLen);
          ctx.closePath();
          ctx.fill();

          // Inner white hot core
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ffffff';
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-11.5, 38);
          ctx.lineTo(-8.5, 38);
          ctx.lineTo(-10, 38 + flameLen * 0.55);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(8.5, 38);
          ctx.lineTo(11.5, 38);
          ctx.lineTo(10, 38 + flameLen * 0.55);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }

        ctx.restore();

        // Shield bubble with soft harmonic breathing glow & gradient
        if (p.shieldTimer > 0) {
          ctx.save();
          const breath = Math.sin(state.frameCount * 0.08) * 1.5;
          const shieldRadius = p.width * 0.94 + breath;
          const cx = p.x + p.width / 2;
          const cy = p.y + p.height / 2;

          ctx.shadowBlur = 14;
          ctx.shadowColor = '#00f0ff';
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.7 + Math.sin(state.frameCount * 0.1) * 0.18})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, shieldRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Soft inner protective gradient
          const shieldGrad = ctx.createRadialGradient(cx, cy, shieldRadius * 0.4, cx, cy, shieldRadius);
          shieldGrad.addColorStop(0, 'rgba(0, 240, 255, 0.04)');
          shieldGrad.addColorStop(0.8, 'rgba(0, 240, 255, 0.14)');
          shieldGrad.addColorStop(1, 'rgba(0, 240, 255, 0.28)');
          ctx.fillStyle = shieldGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, shieldRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Magnet ring with harmonic expansion ripples
        if (p.magnetTimer > 0) {
          ctx.save();
          const cx = p.x + p.width / 2;
          const cy = p.y + p.height / 2;
          const rMag1 = 52 + Math.sin(state.frameCount * 0.08) * 4;
          const rMag2 = 62 + Math.sin(state.frameCount * 0.08 + 1.2) * 4;

          ctx.strokeStyle = 'rgba(255, 183, 3, 0.45)';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#ffb703';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(cx, cy, rMag1, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255, 183, 3, 0.22)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, rMag2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Particles & Sparks with soft air drag
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vx *= 0.94; // air resistance
        pt.vy *= 0.94;
        pt.life--;
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0.5, pt.size * (pt.life / pt.maxLife)), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (pt.life <= 0) state.particles.splice(i, 1);
      }

      // Soft expanding shockwaves
      if (state.shockwaves && state.shockwaves.length > 0) {
        ctx.save();
        for (let i = state.shockwaves.length - 1; i >= 0; i--) {
          const sw = state.shockwaves[i];
          sw.r += (sw.max - sw.r) * 0.16;
          sw.life--;
          const alpha = (sw.life / 20) * 0.65;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 8;
          ctx.stroke();
          if (sw.life <= 0) state.shockwaves.splice(i, 1);
        }
        ctx.restore();
      }

      // Floating Texts with gentle upward drift
      for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
        const ft = state.floatingTexts[i];
        ft.y -= 0.85;
        ft.life--;
        ctx.globalAlpha = Math.min(0.65, ft.life / 35);
        ctx.font = '700 11px Orbitron';
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
        if (ft.life <= 0) state.floatingTexts.splice(i, 1);
      }

      ctx.restore();

      // Mini-Map Radar Render
      if (mctx && miniMap) {
        const { roadLeft, roadWidth } = getRoadGeometry(canvas.width);
        mctx.clearRect(0, 0, miniMap.width, miniMap.height);
        mctx.fillStyle = 'rgba(5, 5, 12, 0.75)';
        mctx.fillRect(0, 0, miniMap.width, miniMap.height);
        mctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        mctx.strokeRect(1, 1, miniMap.width - 2, miniMap.height - 2);

        // Player blip
        const normPlayerX = (p.x - roadLeft) / Math.max(1, roadWidth);
        mctx.fillStyle = userRef.current?.carColor || '#00f0ff';
        mctx.beginPath();
        mctx.arc(
          Math.max(5, Math.min(miniMap.width - 5, normPlayerX * miniMap.width)),
          miniMap.height - 15,
          4,
          0,
          Math.PI * 2
        );
        mctx.fill();

        // Obstacle blips
        state.obstacles.forEach(o => {
          if (o.y < -120 || o.y > canvas.height + 20) return;
          mctx.fillStyle =
            o.type === 'elite' || o.type === 'police'
              ? state.frameCount % 12 < 6
                ? '#ff0037'
                : '#00f0ff'
              : o.type === 'motorcycle'
              ? '#38bdf8'
              : '#e17055';
          const normOx = (o.x - roadLeft) / Math.max(1, roadWidth);
          mctx.fillRect(
            Math.max(2, Math.min(miniMap.width - 5, normOx * miniMap.width)),
            (o.y / Math.max(1, canvas.height)) * (miniMap.height - 30) + 10,
            3,
            3
          );
        });
      }

      // Update React State for HUD (throttled to every 6 frames)
      if (state.frameCount % 6 === 0) {
        setScore(Math.floor(state.score));
        setHp(p.hp);
        setCombo(state.combo);
        setHeat(Math.floor(state.heat));
        setDistance(Math.floor(state.distance));
        setDodgedCount(state.obstaclesDodged);
        setPowerupsCount(state.powerUpsCollected);
        setBestComboRun(state.bestCombo);
        setBountyEarned(Math.floor(state.bounty));

        // Active Power pills
        const powers: { label: string; time: number; color: string }[] = [];
        if (p.shieldTimer > 0) powers.push({ label: 'SHIELD', time: Math.ceil(p.shieldTimer / 60), color: '#00f0ff' });
        if (p.nitroTimer > 0) powers.push({ label: 'NITRO', time: Math.ceil(p.nitroTimer / 60), color: '#7c5cff' });
        if (p.magnetTimer > 0) powers.push({ label: 'MAGNET', time: Math.ceil(p.magnetTimer / 60), color: '#ffb703' });
        if (p.multiplierTimer > 0) powers.push({ label: '2× SKOR', time: Math.ceil(p.multiplierTimer / 60), color: '#06ffa5' });
        if (p.slowTimer > 0) powers.push({ label: 'FREEZE', time: Math.ceil(p.slowTimer / 60), color: '#74b9ff' });
        setActivePowers(powers);
      }

      // Handle Game Over
      if (triggerGameOver) {
        isRunning = false;
        finishGameAndSaveRef.current('crashed');
        return;
      }

      state.animationId = requestAnimationFrame(tick);
    };

    state.animationId = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      cancelAnimationFrame(state.animationId);
    };
  }, [gameState, difficulty, generateMission, addToast]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] sm:min-h-[520px] max-h-[calc(100dvh-124px)] sm:max-h-[calc(100dvh-88px)] max-w-5xl mx-auto bg-[#0a0a14] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl flex flex-col justify-center items-center select-none"
    >
      {/* Scanline CRT overlay (strictly visual, non-blocking) */}
      {user?.layoutSettings.scanlines && (
        <div className="absolute inset-0 pointer-events-none scanlines z-10" />
      )}
      {/* HUD Bar */}
      <div className="absolute top-3 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
        {/* HUD Left: HP, Heat, Combo, Mission */}
        <div className="flex flex-col gap-1.5">
          {/* HP Bar */}
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 w-fit">
            <span className="text-[10px] font-bold tracking-wider text-gray-400">HP</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: maxHp }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-1.5 rounded-sm transition-all ${
                    idx < hp
                      ? 'bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.8)]'
                      : 'bg-white/15'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Nitro Gauge Bar (Replaces Heat UI per user request) */}
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-fuchsia-500/30 w-fit shadow-[0_0_12px_rgba(217,70,239,0.18)]">
            <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-fuchsia-400 fill-fuchsia-400" /> NITRO
            </span>
            <div className="w-20 sm:w-24 h-2 bg-white/10 rounded-full overflow-hidden relative p-[0.5px] border border-white/15">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  nitroEnergy > 50
                    ? 'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]'
                    : nitroEnergy >= 20
                    ? 'bg-gradient-to-r from-fuchsia-600 to-pink-500 shadow-[0_0_6px_rgba(217,70,239,0.5)]'
                    : 'bg-rose-500/90 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.7)]'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, nitroEnergy))}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-fuchsia-300 min-w-[28px] text-right">
              {Math.round(nitroEnergy)}%
            </span>
          </div>

          {/* Combo Display */}
          {combo >= 3 && (
            <div className="bg-amber-500/10 text-amber-400/90 border border-amber-500/25 px-2 py-0.5 rounded-md text-[10.5px] font-bold font-display tracking-wider animate-bounce w-fit opacity-80">
              COMBO ×{combo}
            </div>
          )}

          {/* Mission Progress (Transparent so it doesn't obstruct player) */}
          <div className="text-[10px] font-medium text-gray-300/80 bg-black/30 backdrop-blur-[1px] px-2 py-0.5 rounded-md border border-white/5 max-w-[230px] opacity-80">
            {missionText}
          </div>
        </div>

        {/* HUD Center: Real-Time Race Standings (if Multiplayer) */}
        {multiplayerRoom && (
          <div className="flex flex-col items-center bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-cyan-500/30 shadow-md pointer-events-auto opacity-85 hover:opacity-100 transition-opacity">
            <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1 mb-0.5">
              <Swords className="w-2.5 h-2.5 text-fuchsia-400" /> Duel: {multiplayerRoom.code}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-display">
              {(() => {
                const myEntry = {
                  id: user?.id,
                  username: 'Kamu',
                  avatar: user?.avatar || '🏎️',
                  score: score,
                  hp: hp,
                  status: hp > 0 ? 'playing' : 'crashed',
                  isMe: true,
                };
                const allList = [myEntry, ...(Object.values(opponents) as MultiplayerPlayerState[]).map(o => ({ ...o, isMe: false }))];
                allList.sort((a, b) => b.score - a.score);

                return allList.map((pl, idx) => (
                  <div
                    key={pl.id || idx}
                    className={`flex items-center gap-1 px-1.5 py-0.2 rounded border text-[9.5px] ${
                      pl.isMe
                        ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 font-extrabold'
                        : pl.status === 'crashed'
                        ? 'bg-rose-500/10 border-rose-500/20 text-gray-400 line-through'
                        : 'bg-white/5 border-white/5 text-gray-200'
                    }`}
                  >
                    <span className="text-[8.5px] font-mono text-amber-400 font-black">#{idx + 1}</span>
                    <span className="text-[10px]">{pl.avatar || '🏎️'}</span>
                    <span className="max-w-[60px] truncate font-bold">{pl.username}</span>
                    <span className="font-mono text-[9px] text-white font-bold ml-0.5">{pl.score}</span>
                    {pl.status === 'crashed' && <span className="text-[8.5px] text-rose-400">💥</span>}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* HUD Right: Score, High Score, Level, Distance, Controls */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="bg-black/50 backdrop-blur-sm px-2.5 py-1.2 rounded-xl border border-white/10 text-right min-w-[95px]">
            <div className="flex items-center justify-between gap-1.5 text-[9.5px] font-bold font-display">
              <span className="text-cyan-400 tracking-wider">LV.{level}</span>
              {/* Kolom Jarak lebih kecil */}
              <span className="text-gray-300/90 font-mono font-medium text-[8px] px-1 py-0.2 rounded bg-white/5 border border-white/10 min-w-[28px] text-center tracking-tight">
                {distance}m
              </span>
            </div>
            <div className="font-display font-extrabold text-lg text-white tracking-wider leading-tight mt-0.5">
              {String(score).padStart(5, '0')}
            </div>
            <div className="text-[9px] text-gray-400 font-bold">HI: {String(highScore).padStart(5, '0')}</div>
          </div>

          {/* Quick Action Ability Triggers & Audio/Pause */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Map Selector Quick Button */}
            <button
              onClick={() => {
                if (onOpenMapSelect) onOpenMapSelect();
              }}
              className="px-2 py-1 rounded-lg text-[10px] font-bold font-display uppercase tracking-wider flex items-center gap-1 border bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-amber-500/40 shadow-sm transition-all active:scale-95"
              title={`Peta: ${activeMap.name} (Klik untuk Ganti Peta)`}
            >
              <span>{activeMap.icon}</span>
              <span className="hidden sm:inline">{activeMap.name}</span>
            </button>

            {/* Turbo Nitro Trigger */}
            <button
              onClick={activateNitro}
              disabled={nitroEnergy < 15}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold font-display uppercase tracking-wider flex items-center gap-1 border transition-all ${
                nitroEnergy >= 15
                  ? 'bg-fuchsia-600/30 hover:bg-fuchsia-600/60 text-fuchsia-300 border-fuchsia-500/50 shadow-sm shadow-fuchsia-500/20 active:scale-95'
                  : 'bg-white/5 text-gray-500 border-white/10 opacity-40 cursor-not-allowed'
              }`}
              title="Aktifkan Nitro Turbo (SPASI / Shift)"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>{Math.round(nitroEnergy)}%</span>
            </button>

            {/* EMP Trigger */}
            <button
              onClick={activateEmp}
              disabled={empCharges <= 0}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold font-display uppercase tracking-wider flex items-center gap-1 border transition-all ${
                empCharges > 0
                  ? 'bg-cyan-600/30 hover:bg-cyan-600/60 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20 active:scale-95'
                  : 'bg-white/5 text-gray-500 border-white/10 opacity-40 cursor-not-allowed'
              }`}
              title="Ledakan Gelombang EMP (Tekan E / X)"
            >
              <Flame className="w-3 h-3 text-cyan-400" />
              <span>EMP ×{empCharges}</span>
            </button>

            {/* Mute Audio */}
            <button
              onClick={toggleSound}
              className="w-8 h-8 rounded-lg bg-black/60 hover:bg-black/90 text-gray-300 border border-white/15 flex items-center justify-center transition-colors"
              title="Mute Audio (M)"
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Pause Game */}
            <button
              onClick={togglePause}
              className="w-8 h-8 rounded-lg bg-black/60 hover:bg-black/90 text-gray-300 border border-white/15 flex items-center justify-center transition-colors"
              title="Pause Game (ESC)"
            >
              {gameState === 'PAUSED' ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Active Power-up Pills */}
      <div className="absolute top-28 left-4 z-20 flex flex-wrap gap-1.5 max-w-[200px] pointer-events-none">
        {activePowers.map((p, i) => (
          <span
            key={i}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 border backdrop-blur-sm"
            style={{ color: p.color, borderColor: p.color }}
          >
            {p.label} {p.time}s
          </span>
        ))}
      </div>

      {/* In-Game Floating Notifications / Toasts (Highly Translucent & Compact so road view is unobstructed) */}
      <div className="absolute top-11 left-0 right-0 z-30 flex flex-col items-center gap-1 pointer-events-none px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider font-display bg-black/15 border backdrop-blur-[0.5px] opacity-70 shadow-sm animate-fadeIn ${
              t.color === 'cyan'
                ? 'border-cyan-400/25 text-cyan-300/90'
                : t.color === 'magenta' || t.color === 'purple'
                ? 'border-fuchsia-400/25 text-fuchsia-300/90'
                : t.color === 'amber'
                ? 'border-amber-400/25 text-amber-300/90'
                : t.color === 'rose'
                ? 'border-rose-400/25 text-rose-300/90'
                : 'border-emerald-400/25 text-emerald-300/90'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Game Canvas with Direct Touch/Pointer Steering */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="block w-full h-full cursor-crosshair touch-none select-none"
      />

      {/* Mini-Map Radar (bottom left, above mobile controls when playing) */}
      {gameState === 'PLAYING' && (
        <canvas
          ref={miniMapRef}
          width={92}
          height={80}
          className="absolute bottom-28 left-3 sm:bottom-32 sm:left-4 lg:bottom-4 lg:left-4 z-20 w-20 h-16 sm:w-24 sm:h-20 rounded-lg border border-cyan-500/40 bg-black/60 pointer-events-none shadow-lg"
        />
      )}

      {/* Mobile & Tablet Touch Controls with Steering & Actions (Visible during gameplay) */}
      {gameState === 'PLAYING' && (
        <div className="absolute bottom-3 left-0 right-0 px-3 sm:px-6 z-20 lg:hidden flex justify-between items-end pointer-events-auto select-none touch-none">
          {/* Left: Directional Steering */}
          <div className="flex flex-col items-center gap-1 bg-black/60 p-1.5 rounded-2xl border border-cyan-500/30 backdrop-blur-md shadow-xl">
            <button
              onPointerDown={() => setTouchKey('ArrowUp', true)}
              onPointerUp={() => setTouchKey('ArrowUp', false)}
              onPointerLeave={() => setTouchKey('ArrowUp', false)}
              onPointerCancel={() => setTouchKey('ArrowUp', false)}
              className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-white/10 active:bg-cyan-500/40 border border-cyan-500/30 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer select-none touch-none"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <div className="flex gap-1">
              <button
                onPointerDown={() => setTouchKey('ArrowLeft', true)}
                onPointerUp={() => setTouchKey('ArrowLeft', false)}
                onPointerLeave={() => setTouchKey('ArrowLeft', false)}
                onPointerCancel={() => setTouchKey('ArrowLeft', false)}
                className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-white/10 active:bg-cyan-500/40 border border-cyan-500/30 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer select-none touch-none"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onPointerDown={() => setTouchKey('ArrowDown', true)}
                onPointerUp={() => setTouchKey('ArrowDown', false)}
                onPointerLeave={() => setTouchKey('ArrowDown', false)}
                onPointerCancel={() => setTouchKey('ArrowDown', false)}
                className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-white/10 active:bg-cyan-500/40 border border-cyan-500/30 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer select-none touch-none"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <button
                onPointerDown={() => setTouchKey('ArrowRight', true)}
                onPointerUp={() => setTouchKey('ArrowRight', false)}
                onPointerLeave={() => setTouchKey('ArrowRight', false)}
                onPointerCancel={() => setTouchKey('ArrowRight', false)}
                className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-white/10 active:bg-cyan-500/40 border border-cyan-500/30 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer select-none touch-none"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right: Turbo Nitro & EMP Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={activateNitro}
              disabled={nitroEnergy < 15}
              className={`w-14 h-14 min-h-[56px] min-w-[56px] rounded-2xl flex flex-col items-center justify-center border font-display font-black text-[11px] shadow-lg transition-all select-none touch-none ${
                nitroEnergy >= 15
                  ? 'bg-gradient-to-tr from-fuchsia-600 to-pink-500 text-white border-fuchsia-300 shadow-fuchsia-500/40 active:scale-95'
                  : 'bg-white/10 text-gray-500 border-white/10 opacity-50'
              }`}
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>NITRO</span>
              <span className="text-[9px] font-mono opacity-85 leading-none">{Math.round(nitroEnergy)}%</span>
            </button>
            <button
              onClick={activateEmp}
              disabled={empCharges <= 0}
              className={`w-14 h-14 min-h-[56px] min-w-[56px] rounded-2xl flex flex-col items-center justify-center border font-display font-black text-[11px] shadow-lg transition-all select-none touch-none ${
                empCharges > 0
                  ? 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white border-cyan-300 shadow-cyan-500/40 active:scale-95'
                  : 'bg-white/10 text-gray-500 border-white/10 opacity-50'
              }`}
            >
              <Flame className="w-5 h-5 text-cyan-200" />
              <span>EMP ×{empCharges}</span>
            </button>
          </div>
        </div>
      )}

      {/* START OVERLAY MENU - FUTURISTIC CYBERPUNK MAIN GAME LOBBY */}
      {gameState === 'START' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <MainGameLobby
            user={user}
            difficulty={difficulty}
            onChangeDifficulty={(d) => {
              setDifficulty(d);
              if (onChangeDifficulty) onChangeDifficulty(d);
            }}
            onStartGame={startGame}
            onOpenGarage={onOpenGarage}
            onOpenPoliceFleet={() => {
              sound.play('click');
              setShowFleetModal(true);
            }}
            selectedMapId={internalMapId}
            onSelectMap={(mapId) => {
              setInternalMapId(mapId);
              mapIdRef.current = mapId;
              if (onSelectMap) onSelectMap(mapId);
              sound.play('click');
            }}
            onOpenMapSelect={onOpenMapSelect}
          />
        </div>
      )}

      {/* PAUSED OVERLAY */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 bg-[#06060e]/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-display font-black text-white tracking-wider mb-6">
            GAME DIJEDA
          </h2>

          <div className="flex flex-col gap-2.5 w-52">
            <button
              onClick={togglePause}
              className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider text-xs uppercase cursor-pointer"
            >
              Lanjutkan
            </button>
            <button
              onClick={() => {
                finishGameAndSave('completed');
              }}
              className="py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold tracking-wider text-xs uppercase cursor-pointer transition-all active:scale-95"
            >
              🏁 Selesaikan & Simpan Skor
            </button>
            <button
              onClick={() => setGameState('START')}
              className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold tracking-wider text-xs uppercase border border-white/10 cursor-pointer"
            >
              Menu Utama
            </button>
          </div>
        </div>
      )}

      {/* In-Game Quick Chat Reactions for Multiplayer */}
      {multiplayerRoom && gameState === 'PLAYING' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 pointer-events-auto shadow-xl">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1">💬 Reaksi:</span>
          {['🔥 Gaspol!', '⚡ EMP!', '😂 Awas!', '👑 GG!'].map(txt => (
            <button
              key={txt}
              onClick={() => {
                sound.play('click');
                socket.send({
                  type: 'player_action',
                  action: 'chat',
                  value: txt,
                  username: user?.username || 'Kamu',
                });
                addToast(`💬 Kamu: ${txt}`, 'cyan');
              }}
              className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold text-gray-200 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              {txt}
            </button>
          ))}
        </div>
      )}

      {/* AUTHORITATIVE MULTIPLAYER COUNTDOWN OVERLAY */}
      {multiplayerCountdown && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-4 pointer-events-none animate-fadeIn">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-7xl sm:text-9xl font-display font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-amber-300 to-fuchsia-500 drop-shadow-[0_0_35px_rgba(0,240,255,0.9)] animate-pulse">
              {multiplayerCountdown.count > 0 ? multiplayerCountdown.count : 'GO!'}
            </div>
            <div className="mt-4 px-6 py-2 rounded-full bg-black/90 border border-cyan-400/50 text-xs sm:text-sm font-display font-extrabold uppercase tracking-widest text-cyan-300 shadow-2xl">
              {multiplayerCountdown.message}
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER / MATCH FINISHED OVERLAY */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 bg-[#06060e]/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 sm:p-6 text-center overflow-y-auto">
          {multiplayerRoom ? (
            /* Dedicated Multiplayer Duel Results Screen */
            <div className="w-full max-w-md bg-[#0b0c19] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl animate-fade-in my-auto">
              <div className="text-3xl mb-1">
                {multiplayerWinner === user?.id ? '👑' : '🏁'}
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400">
                {multiplayerWinner === user?.id
                  ? 'KAMU JUARA 1!'
                  : multiplayerWinner
                  ? 'DUEL SELESAI'
                  : 'MOBILMU TABRAKAN'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {multiplayerWinner === user?.id
                  ? 'Selamat! Kamu memenangkan balapan room ini!'
                  : multiplayerWinner
                  ? `Pemenang: ${
                      multiplayerRoom.players?.[multiplayerWinner]?.username ||
                      opponents[multiplayerWinner]?.username ||
                      'Pembalap'
                    }`
                  : 'Skor kamu telah dicatat. Balapan lagi bersama teman?'}
              </p>

              {/* Standings List */}
              <div className="my-4 space-y-2 text-left">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1">
                  Klasemen Akhir Pemain
                </div>
                {(() => {
                  const myEntry = {
                    id: user?.id,
                    username: `${user?.username || 'Kamu'} (Kamu)`,
                    avatar: user?.avatar || '🏎️',
                    score: score,
                    distance: distance,
                    status: hp > 0 ? 'playing' : 'crashed',
                    isMe: true,
                  };
                  const allPlayers = [myEntry, ...(Object.values(opponents) as MultiplayerPlayerState[]).map(o => ({ ...o, isMe: false }))];
                  allPlayers.sort((a, b) => b.score - a.score);

                  return allPlayers.map((pl, idx) => (
                    <div
                      key={pl.id || idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border ${
                        pl.id === multiplayerWinner
                          ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                          : pl.isMe
                          ? 'bg-cyan-500/10 border-cyan-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-display font-black text-xs text-amber-400 w-5 text-center">
                          #{idx + 1}
                        </span>
                        <span className="text-base">{pl.avatar || '🏎️'}</span>
                        <div>
                          <div className="text-xs font-display font-bold text-white flex items-center gap-1.5">
                            {pl.username}
                            {pl.id === multiplayerWinner && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-extrabold">
                                JUARA 1
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {pl.status === 'crashed' ? (
                              <span className="text-rose-400 font-semibold">Tabrakan</span>
                            ) : (
                              <span className="text-emerald-400 font-semibold">Selesai</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-display font-extrabold text-sm text-cyan-400">
                          {pl.score}
                        </div>
                        <div className="text-[9px] text-gray-400 uppercase">Poin</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    sound.play('click');
                    if (onRematchMultiplayer) {
                      onRematchMultiplayer();
                    } else {
                      startGame();
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-fuchsia-500/25 active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Balapan Lagi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.play('click');
                    if (onReturnToLobby) {
                      onReturnToLobby();
                    } else {
                      setGameState('START');
                    }
                  }}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-display font-bold text-xs uppercase border border-white/15 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" /> Ke Lobby
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.play('click');
                    if (onLeaveMultiplayer) {
                      onLeaveMultiplayer();
                    }
                    setGameState('START');
                  }}
                  className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-display font-bold text-xs uppercase border border-rose-500/20 cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            </div>
          ) : (
            /* Solo Game Over Overlay - Exact Futuristic Glassmorphic Reference Design */
            <div className="relative w-full h-full flex flex-col items-center justify-between overflow-y-auto scrollbar-none px-3 py-2 sm:px-4 sm:py-3 select-none">
              {/* 1. Atmospheric Police Lights & Diagonal Tire Track Textures in Background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Top-Left Red Police Siren Flasher Glow */}
                <div className="absolute -top-16 -left-10 w-96 h-64 rounded-full bg-red-600/25 blur-3xl animate-pulse" />
                {/* Top-Right Blue Police Siren Flasher Glow */}
                <div className="absolute -top-16 -right-10 w-96 h-64 rounded-full bg-blue-600/25 blur-3xl animate-pulse" style={{ animationDelay: '500ms' }} />

                {/* Diagonal Tire Tracks Background Pattern (Left Side) */}
                <svg
                  className="absolute -left-14 -bottom-10 w-80 h-80 opacity-20 text-white/40 rotate-[-22deg] mix-blend-overlay"
                  viewBox="0 0 200 200"
                  fill="none"
                >
                  {Array.from({ length: 14 }).map((_, idx) => (
                    <g key={idx} transform={`translate(0, ${idx * 15})`}>
                      <path d="M18 10L58 22L68 18L28 6Z" fill="currentColor" />
                      <path d="M142 10L102 22L92 18L132 6Z" fill="currentColor" />
                      <rect x="73" y="10" width="14" height="5" rx="1" fill="currentColor" />
                    </g>
                  ))}
                </svg>

                {/* Diagonal Tire Tracks Background Pattern (Right Side) */}
                <svg
                  className="absolute -right-14 top-4 w-96 h-96 opacity-20 text-white/40 rotate-[32deg] mix-blend-overlay"
                  viewBox="0 0 200 200"
                  fill="none"
                >
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <g key={idx} transform={`translate(0, ${idx * 15})`}>
                      <path d="M18 10L58 22L68 18L28 6Z" fill="currentColor" />
                      <path d="M142 10L102 22L92 18L132 6Z" fill="currentColor" />
                      <rect x="73" y="10" width="14" height="5" rx="1" fill="currentColor" />
                    </g>
                  ))}
                </svg>
              </div>

              {/* 2. Main Center Content Container */}
              <div className="relative z-10 w-full max-w-lg flex flex-col items-center justify-center my-auto pt-2 pb-4">
                {/* Header: Siren Icon with Red Radiation Rays */}
                <div className="flex flex-col items-center mb-1">
                  <div className="relative mb-2">
                    <svg
                      className="w-12 h-12 drop-shadow-[0_0_16px_rgba(255,59,92,0.9)]"
                      viewBox="0 0 48 48"
                      fill="none"
                    >
                      {/* Red Neon Radiation Rays on Top */}
                      <path d="M24 3V8" stroke="#FF3B5C" strokeWidth="2.8" strokeLinecap="round" />
                      <path d="M13 7L16.5 11.5" stroke="#FF3B5C" strokeWidth="2.8" strokeLinecap="round" />
                      <path d="M35 7L31.5 11.5" stroke="#FF3B5C" strokeWidth="2.8" strokeLinecap="round" />
                      {/* Cyan Siren Dome Body */}
                      <path
                        d="M15 36C15 27 18 16 24 16C30 16 33 27 33 36"
                        stroke="#00E5FF"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                      />
                      <line
                        x1="17"
                        y1="25"
                        x2="31"
                        y2="25"
                        stroke="#00E5FF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeOpacity="0.8"
                      />
                      <rect
                        x="11"
                        y="36"
                        width="26"
                        height="6"
                        rx="2"
                        stroke="#00E5FF"
                        strokeWidth="2.6"
                      />
                    </svg>
                  </div>

                  {/* Title: TERTANGKAP */}
                  <h2 className="text-xl sm:text-2xl font-display font-black uppercase text-[#FF3B5C] tracking-[0.22em] drop-shadow-[0_0_18px_rgba(255,59,92,0.85)]">
                    TERTANGKAP
                  </h2>

                  {/* Big Score: 750 */}
                  <div className="text-5xl sm:text-6xl font-display font-black text-white tracking-widest my-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.35)]">
                    {score}
                  </div>
                </div>

                {/* Section Statistik (Grid 3 Kolom - Glass Cards) */}
                <div className="w-full grid grid-cols-3 gap-2.5 sm:gap-3 my-2.5">
                  {/* Card 1: Speedometer | Jarak */}
                  <div className="relative rounded-2xl p-3 sm:p-4 bg-white/[0.04] backdrop-blur-md border border-cyan-500/30 flex items-center justify-start gap-2.5 sm:gap-3 shadow-[0_0_20px_rgba(0,229,255,0.12)] overflow-hidden group">
                    <div className="absolute -top-6 -right-6 w-14 h-14 rounded-full bg-cyan-400/10 blur-xl pointer-events-none" />
                    {/* Speedometer Icon */}
                    <div className="shrink-0">
                      <svg
                        className="w-7 h-7 sm:w-8 sm:h-8 text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.7)]"
                        viewBox="0 0 36 36"
                        fill="none"
                      >
                        <path d="M7 25A13 13 0 1 1 29 25" stroke="#00E5FF" strokeWidth="2.2" strokeLinecap="round" />
                        <line x1="18" y1="21" x2="24" y2="15" stroke="#00E5FF" strokeWidth="2.4" strokeLinecap="round" />
                        <circle cx="18" cy="21" r="2.2" fill="#00E5FF" />
                        <line x1="10" y1="18" x2="12" y2="18" stroke="#00E5FF" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.7" />
                        <line x1="18" y1="10" x2="18" y2="12" stroke="#00E5FF" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.7" />
                        <line x1="26" y1="18" x2="24" y2="18" stroke="#00E5FF" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.7" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-display font-black text-sm sm:text-lg text-[#00E5FF] tracking-tight leading-none">
                        {distance}m
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">
                        JARAK
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Mobil Slalom | Dihindari */}
                  <div className="relative rounded-2xl p-3 sm:p-4 bg-white/[0.04] backdrop-blur-md border border-fuchsia-500/30 flex items-center justify-start gap-2.5 sm:gap-3 shadow-[0_0_20px_rgba(208,66,255,0.12)] overflow-hidden group">
                    <div className="absolute -top-6 -right-6 w-14 h-14 rounded-full bg-fuchsia-400/10 blur-xl pointer-events-none" />
                    {/* Slalom Drift Car Icon */}
                    <div className="shrink-0">
                      <svg
                        className="w-7 h-7 sm:w-8 sm:h-8 text-[#D042FF] drop-shadow-[0_0_8px_rgba(208,66,255,0.7)]"
                        viewBox="0 0 36 36"
                        fill="none"
                      >
                        <rect x="9" y="4" width="18" height="12" rx="3" stroke="#D042FF" strokeWidth="2" />
                        <path d="M6 16H30V20C30 21 29 22 28 22H8C7 22 6 21 6 20V16Z" stroke="#D042FF" strokeWidth="2" />
                        <circle cx="11" cy="18" r="1.5" fill="#D042FF" />
                        <circle cx="25" cy="18" r="1.5" fill="#D042FF" />
                        <path d="M7 26C11 26 13 28 17 28C21 28 23 26 27 26" stroke="#D042FF" strokeWidth="2" strokeLinecap="round" />
                        <path d="M9 31C13 31 15 33 19 33C23 33 25 31 29 31" stroke="#D042FF" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-display font-black text-sm sm:text-lg text-[#D042FF] tracking-tight leading-none">
                        {dodgedCount}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">
                        DIHINDARI
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Kantong Uang | Bounty */}
                  <div className="relative rounded-2xl p-3 sm:p-4 bg-white/[0.04] backdrop-blur-md border border-amber-500/30 flex items-center justify-start gap-2.5 sm:gap-3 shadow-[0_0_20px_rgba(255,184,0,0.12)] overflow-hidden group">
                    <div className="absolute -top-6 -right-6 w-14 h-14 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />
                    {/* Money Sack Icon */}
                    <div className="shrink-0">
                      <svg
                        className="w-7 h-7 sm:w-8 sm:h-8 text-[#FFB800] drop-shadow-[0_0_8px_rgba(255,184,0,0.7)]"
                        viewBox="0 0 36 36"
                        fill="none"
                      >
                        <path d="M14 6L18 9L22 6L20 12H16L14 6Z" stroke="#FFB800" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M15 12H21" stroke="#FFB800" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M12 13C9 16 7 21 8 26C9 30 13 32 18 32C23 32 27 30 28 26C29 21 27 16 24 13" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" />
                        <path d="M18 17V27M15.5 19.5C15.5 18.5 16.5 18 18 18C19.5 18 20.5 18.5 20.5 19.5C20.5 21 15.5 21.5 15.5 23C15.5 24 16.5 25 18 25C19.5 25 20.5 24.5 20.5 23.5" stroke="#FFB800" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-display font-black text-sm sm:text-lg text-[#FFB800] tracking-tight leading-none">
                        +{bountyEarned}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">
                        BOUNTY
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Live: Capsule Bar */}
                <div className="w-full py-2 px-4 rounded-full border border-emerald-500/40 bg-emerald-950/20 backdrop-blur-md flex items-center justify-center gap-2 my-2 shadow-[0_0_15px_rgba(0,230,118,0.15)]">
                  <Trophy className="w-4 h-4 text-[#FFB800] shrink-0" />
                  <span className="text-[#00E676] font-display font-bold text-xs tracking-wider uppercase">
                    {latestLeaderboardRank
                      ? `PERINGKAT #${latestLeaderboardRank} DI LEADERBOARD! (LIVE)`
                      : scoreSavedStatus === 'saving'
                      ? 'MENYIMPAN SKOR KE LEADERBOARD...'
                      : 'SKOR TERCATAT RESMI DI LEADERBOARD'}
                  </span>
                </div>

                {/* Section Tombol Utama (Stacked Center) */}
                <div className="w-full flex flex-col items-center gap-2 mt-2">
                  {/* Button Primary: Solid Cyan Glow + Icon Repeat */}
                  <button
                    id="btn-restart-game"
                    type="button"
                    onClick={startGame}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      startGame();
                    }}
                    className="w-full py-3 px-6 rounded-xl bg-[#00E5FF] hover:bg-[#33EBFF] text-slate-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)] active:scale-95 transition-all cursor-pointer select-none"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[3]" />
                    <span>MAIN LAGI</span>
                  </button>

                  {/* Button Secondary: Glassmorphic + Border Gold + Icon Piala */}
                  {onOpenLeaderboard && (
                    <button
                      id="btn-open-leaderboard-from-gameover"
                      type="button"
                      onClick={() => {
                        sound.play('click');
                        onOpenLeaderboard();
                      }}
                      className="w-full py-3 px-6 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 border border-amber-500/50 text-amber-300 font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,184,0,0.15)] active:scale-95 transition-all cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>LIHAT LEADERBOARD REAL-TIME</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Footer Bar (Fixed/Aligned Bottom) */}
              <div className="relative z-10 w-full flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
                {/* Bottom-Left: Button Small "MENU" */}
                <button
                  id="btn-back-menu"
                  type="button"
                  onClick={() => {
                    if (multiplayerRoom && onLeaveMultiplayer) {
                      onLeaveMultiplayer();
                    }
                    setGameState('START');
                  }}
                  className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-display font-bold text-xs uppercase tracking-wider border border-white/15 cursor-pointer transition-all active:scale-95"
                >
                  MENU
                </button>

                {/* Bottom-Right: Icon Snowflake (Cyan) + "MAP: PUNCAK SALJU" */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenMapSelect) {
                      sound.play('click');
                      onOpenMapSelect();
                    }
                  }}
                  className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer group transition-all"
                  title="Klik untuk Ganti Peta"
                >
                  <span className="font-display font-bold text-xs tracking-wider uppercase text-gray-300 group-hover:text-white">
                    MAP: {activeMap.name}
                  </span>
                  <div className="p-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
                    {activeMap.id === 'salju' ? (
                      <Snowflake className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <span className="text-sm leading-none">{activeMap.icon}</span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Police Fleet Preview Modal */}
      <PoliceFleetModal
        isOpen={showFleetModal}
        onClose={() => setShowFleetModal(false)}
      />
    </div>
  );
};
