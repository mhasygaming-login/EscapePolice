import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, MultiplayerRoom, DifficultyLevel, MultiplayerPlayerState } from '../../types';
import { socket, sound } from '../../services';
import { getPublicGameUrl, copyTextToClipboard } from '../../utils';
import {
  Users,
  RotateCcw,
  ArrowLeft,
  Link as LinkIcon,
  Smartphone,
  Copy,
  Check,
  Send,
  ExternalLink,
  LogIn,
  Zap,
  Tag,
  Key,
  Gauge,
  Flame,
  Skull,
  RefreshCw,
  Clock,
  Crown,
  Play,
  LogOut,
  Share2,
  MessageSquare,
  WifiOff,
} from 'lucide-react';

interface MultiplayerLobbyProps {
  user: UserProfile | null;
  initialRoomCode?: string | null;
  onStartMatch: (room: MultiplayerRoom) => void;
  onBackToSolo: () => void;
  onOpenReplays?: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  user,
  initialRoomCode,
  onStartMatch,
  onBackToSolo,
  onOpenReplays,
}) => {
  const [rooms, setRooms] = useState<
    { code: string; name: string; status: string; difficulty: string; playerCount: number }[]
  >([]);
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode || '');
  const [customRoomCode, setCustomRoomCode] = useState('');
  const [newRoomName, setNewRoomName] = useState(
    user?.username ? `${user.username}'s Arena` : "Mhasy_racing's Arena"
  );
  const [newRoomDiff, setNewRoomDiff] = useState<DifficultyLevel>('NORMAL');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lobbyMessages, setLobbyMessages] = useState<{ sender: string; text: string }[]>([]);
  const [livePing, setLivePing] = useState<number>(socket.ping || 24);

  // Active timers tracking to prevent memory leaks on unmounted component
  const activeTimersRef = useRef<NodeJS.Timeout[]>([]);
  const setTrackedTimeout = useCallback((fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      activeTimersRef.current = activeTimersRef.current.filter(t => t !== timer);
      fn();
    }, ms);
    activeTimersRef.current.push(timer);
    return timer;
  }, []);

  // Track initial URL room code auto-joining to avoid duplicate requests when user state updates
  const autoJoinedRoomRef = useRef<string | null>(null);

  // Sync initial room code input
  useEffect(() => {
    if (initialRoomCode) {
      setRoomCodeInput(initialRoomCode.trim().toUpperCase());
    }
  }, [initialRoomCode]);

  // Clean up all pending timeouts when component unmounts
  useEffect(() => {
    return () => {
      activeTimersRef.current.forEach(t => clearTimeout(t));
      activeTimersRef.current = [];
    };
  }, []);

  const handleJoinRoom = useCallback(
    (code: string) => {
      const cleanCode = code ? code.trim().toUpperCase() : '';
      if (!cleanCode) {
        setErrorMessage('Silakan masukkan kode room terlebih dahulu.');
        setTrackedTimeout(() => setErrorMessage(''), 3500);
        return;
      }

      sound.play('click');
      socket.send({
        type: 'join_room',
        code: cleanCode,
        userId: user?.id || 'guest_' + Date.now(),
        username: user?.username || 'Racer',
        avatar: user?.avatar || '🏎️',
        carColor: user?.carColor || '#f8fafc',
        carModel: user?.carModel || 'civic_fl5',
      });
    },
    [user, setTrackedTimeout]
  );

  // Socket room listeners and real network telemetry
  useEffect(() => {
    socket.connect(user?.id);

    const unbindRoomList = socket.on('room_list', (data: any) => {
      if (Array.isArray(data.rooms)) {
        setRooms(data.rooms);
        setIsRefreshing(false);
      }
    });

    const unbindRoomState = socket.on('room_state', (data: any) => {
      setCurrentRoom(data.room);
      if (data.room.status === 'in_game' || data.room.status === 'countdown') {
        sound.play('click');
        onStartMatch(data.room);
      }
    });

    const unbindCountdown = socket.on('countdown_tick', (data: any) => {
      if (data.count === 0) {
        sound.play('nitro');
      } else {
        sound.play('click');
      }
      if (data.room) {
        onStartMatch(data.room);
      }
    });

    const unbindRaceStart = socket.on('race_start', (data: any) => {
      sound.play('nitro');
      if (data.room) {
        onStartMatch(data.room);
      }
    });

    const unbindAction = socket.on('opponent_action', (data: any) => {
      if (data.action === 'chat') {
        sound.play('coin');
        setLobbyMessages(prev => [
          ...prev.slice(-3),
          { sender: data.username || 'Pembalap', text: data.value },
        ]);
      }
    });

    const unbindError = socket.on('error', (data: any) => {
      setErrorMessage(data.message || 'Terjadi kesalahan');
      sound.play('gameover');
      setTrackedTimeout(() => setErrorMessage(''), 4000);
    });

    // Real server ping telemetry updates
    const unbindPing = socket.on('ping_update', (pingMs: number) => {
      if (typeof pingMs === 'number' && pingMs > 0) {
        setLivePing(pingMs);
      }
    });

    // Auto-join once if URL contained a room invite
    if (initialRoomCode && autoJoinedRoomRef.current !== initialRoomCode.trim().toUpperCase()) {
      autoJoinedRoomRef.current = initialRoomCode.trim().toUpperCase();
      handleJoinRoom(initialRoomCode);
    }

    // Request active rooms list
    socket.send({ type: 'list_rooms' });
    const interval = setInterval(() => {
      socket.send({ type: 'list_rooms' });
    }, 4000);

    return () => {
      unbindRoomList();
      unbindRoomState();
      unbindCountdown();
      unbindRaceStart();
      unbindAction();
      unbindError();
      unbindPing();
      clearInterval(interval);
    };
  }, [user?.id, onStartMatch, initialRoomCode, handleJoinRoom, setTrackedTimeout]);

  const handleCreateRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.play('click');

    const cleanName = newRoomName.trim() || `${user?.username || 'Pembalap'}'s Arena`;
    const cleanCode = customRoomCode.trim().replace(/[^A-Za-z0-9_-]/g, '').toUpperCase() || undefined;

    socket.send({
      type: 'create_room',
      code: cleanCode,
      name: cleanName,
      difficulty: newRoomDiff,
      userId: user?.id || 'guest_' + Date.now(),
      username: user?.username || 'Racer',
      avatar: user?.avatar || '🏎️',
      carColor: user?.carColor || '#f8fafc',
      carModel: user?.carModel || 'civic_fl5',
    });
  };

  const handleToggleReady = () => {
    sound.play('click');
    socket.send({ type: 'toggle_ready' });
  };

  const handleStartGame = () => {
    sound.play('click');
    if (!currentRoom) return;
    socket.send({
      type: 'start_game',
      code: currentRoom.code,
    });
  };

  const handleLeaveRoom = () => {
    sound.play('click');
    socket.send({ type: 'leave_room' });
    setCurrentRoom(null);
    socket.send({ type: 'list_rooms' });
  };

  const handleSendTaunt = (msg: string) => {
    sound.play('click');
    socket.send({
      type: 'player_action',
      action: 'chat',
      value: msg,
      username: user?.username || 'Kamu',
    });
    setLobbyMessages(prev => [
      ...prev.slice(-3),
      { sender: user?.username || 'Kamu', text: msg },
    ]);
  };

  const handleCopyPublicLink = async () => {
    sound.play('click');
    const url = getPublicGameUrl();
    const success = await copyTextToClipboard(url);
    if (success) {
      setCopiedPublicLink(true);
      sound.play('coin');
      setTrackedTimeout(() => setCopiedPublicLink(false), 1600);
    } else {
      setErrorMessage('Gagal menyalin link otomatis. Silakan salin URL di kotak secara manual.');
      setTrackedTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleRefreshRooms = () => {
    sound.play('click');
    setIsRefreshing(true);
    socket.send({ type: 'list_rooms' });
    setTrackedTimeout(() => setIsRefreshing(false), 800);
  };

  const handleCopyInviteLink = async () => {
    if (!currentRoom) return;
    const inviteUrl = getPublicGameUrl(currentRoom.code);
    const success = await copyTextToClipboard(inviteUrl);
    if (success) {
      setCopiedLink(true);
      sound.play('coin');
      setTrackedTimeout(() => setCopiedLink(false), 2000);
    } else {
      setErrorMessage('Gagal menyalin link undangan.');
      setTrackedTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleCopyRoomCode = async () => {
    if (!currentRoom) return;
    const success = await copyTextToClipboard(currentRoom.code);
    if (success) {
      setCopiedCode(true);
      sound.play('coin');
      setTrackedTimeout(() => setCopiedCode(false), 2000);
    } else {
      setErrorMessage('Gagal menyalin kode room.');
      setTrackedTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleShareNative = async () => {
    if (!currentRoom) return;
    const inviteUrl = getPublicGameUrl(currentRoom.code);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Main Balapan Bersama di Escape Police!',
          text: `Ayo gabung balapan real-time denganku! Kode Room: ${currentRoom.code}`,
          url: inviteUrl,
        });
        return;
      } catch {}
    }
    handleCopyInviteLink();
  };

  const playerList = currentRoom
    ? (Object.values(currentRoom.players) as MultiplayerPlayerState[])
    : [];

  const myPlayerState =
    currentRoom && user
      ? currentRoom.players[user.id] ||
        playerList.find(
          p => p.id === user.id || p.username.toLowerCase() === user.username.toLowerCase()
        ) ||
        null
      : null;

  const isHost = Boolean(
    myPlayerState?.isHost ||
      (currentRoom && playerList.length > 0 && playerList[0].id === user?.id) ||
      (currentRoom &&
        playerList.length > 0 &&
        playerList[0].username.toLowerCase() === user?.username.toLowerCase()) ||
      (currentRoom && !playerList.some(p => p.isHost))
  );

  const readyCount = playerList.filter(p => p.status === 'ready').length;

  const getTierInfo = (tier: string) => {
    const norm = (tier || 'NORMAL').toUpperCase();
    if (norm === 'MAXXX') {
      return {
        label: 'MAXXX',
        icon: Skull,
        color: '#e879f9',
        activeBtnStyle:
          'border border-[rgba(232,121,249,0.5)] bg-[rgba(232,121,249,0.15)] text-[#e879f9] shadow-[0_0_15px_rgba(232,121,249,0.2)]',
        cardHoverStyle:
          'hover:border-[#e879f9]/50 hover:shadow-[0_0_22px_rgba(232,121,249,0.10)] hover:-translate-y-0.5',
      };
    }
    if (norm === 'HARD') {
      return {
        label: 'HARD',
        icon: Flame,
        color: '#f5b041',
        activeBtnStyle:
          'border border-[rgba(245,176,65,0.5)] bg-[rgba(245,176,65,0.15)] text-[#f5b041] shadow-[0_0_15px_rgba(245,176,65,0.2)]',
        cardHoverStyle:
          'hover:border-[#f5b041]/50 hover:shadow-[0_0_22px_rgba(245,176,65,0.10)] hover:-translate-y-0.5',
      };
    }
    return {
      label: 'NORMAL',
      icon: Gauge,
      color: '#22d3ee',
      activeBtnStyle:
        'border border-[rgba(34,211,238,0.5)] bg-[rgba(34,211,238,0.15)] text-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.2)]',
      cardHoverStyle:
        'hover:border-[#22d3ee]/50 hover:shadow-[0_0_22px_rgba(34,211,238,0.10)] hover:-translate-y-0.5',
    };
  };

  // Default initial lobbies matching reference mockup
  const defaultMockLobbies = [
    {
      name: 'Cyber Duel Arena',
      code: 'NEON-77',
      tier: 'MAXXX' as DifficultyLevel,
      players: '0/4',
      status: 'Waiting',
    },
    {
      name: 'Highway Sprint 1v1',
      code: 'RACE-01',
      tier: 'HARD' as DifficultyLevel,
      players: '0/4',
      status: 'Waiting',
    },
  ];

  const displayLobbies =
    rooms && rooms.length > 0
      ? rooms.map(r => ({
          name: r.name || `${r.code} Arena`,
          code: r.code,
          tier: (r.difficulty || 'NORMAL').toUpperCase() as DifficultyLevel,
          players: `${r.playerCount || 0}/4`,
          status: r.status === 'in_game' ? 'In Game' : 'Waiting',
        }))
      : defaultMockLobbies;

  const publicUrl = getPublicGameUrl();
  const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Ayo main balapan online multiplayer real-time bareng aku di Escape Police!\nKlik link: ${publicUrl}`
  )}`;

  // OFFLINE FALLBACK
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return (
      <div className="relative w-full min-h-full flex-1 bg-[#07080f] font-manrope text-[#eef1f6] flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-[#0c0e18] border border-[#1c2232] p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(245,176,65,0.12)] border border-[rgba(245,176,65,0.35)] flex items-center justify-center mx-auto text-[#f5b041]">
            <WifiOff className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-mono-code font-bold uppercase tracking-widest text-[#f5b041]">
              Koneksi Offline
            </span>
            <h2 className="text-xl font-sora font-bold text-white">
              Multiplayer Memerlukan Internet
            </h2>
            <p className="text-[13px] leading-relaxed text-[#9aa5ba]">
              Anda sedang berada dalam <strong>Mode Offline</strong>. Anda tetap dapat menikmati balapan tunggal, semua peta, dan garasi mobil!
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.play('click');
              onBackToSolo();
            }}
            className="min-h-[44px] px-6 rounded-[10px] bg-[#22d3ee] hover:bg-[#67e8f9] text-[#04141c] font-sora font-bold text-[13px] transition-all cursor-pointer active:scale-95 shadow-lg shadow-[#22d3ee]/20 hover:shadow-[#22d3ee]/35"
          >
            Kembali ke Main Solo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-full flex-1 bg-[#07080f] font-manrope text-[#eef1f6] px-4 sm:px-8 lg:px-14 py-8 sm:py-10 pb-20 select-none overflow-hidden">
      {/* Subtle Ambient Vignette & Micro-Grid (Tenang, elegan, tidak berlebihan) */}
      <div className="absolute inset-0 bg-subtle-grid pointer-events-none opacity-80" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-[1280px] mx-auto flex flex-col gap-7">
        {/* Error Notification Bar */}
        {errorMessage && (
          <div className="px-4 py-2.5 rounded-[12px] bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[13px] font-semibold flex items-center justify-center gap-2 animate-fadeIn">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW A: WAITING ROOM (Saat berada di dalam ruangan yang aktif)            */}
        {/* ========================================================================= */}
        {currentRoom ? (
          <div className="border border-[#1c2232] bg-[#0c0e18] rounded-[16px] p-6 sm:p-7 shadow-2xl flex flex-col gap-6 backdrop-blur-sm transition-all duration-300 hover:border-[#22d3ee]/35">
            {/* Top Bar Waiting Room */}
            <div className="flex flex-wrap gap-4 items-center justify-between pb-5 border-b border-[#1c2232]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="mp-live w-2 h-2 rounded-full bg-[#34d399] inline-block shadow-[0_0_8px_#34d399]" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#34d399] font-sora">
                    Ruang Tunggu Duel
                  </span>
                  <span className="text-[#5b6478]">·</span>
                  <span className="text-[12px] text-[#9aa5ba]">
                    {playerList.length} / 4 Pemain Terhubung
                  </span>
                </div>
                <h1 className="text-2xl font-sora font-bold text-white tracking-tight">
                  {currentRoom.name}
                </h1>
                <div className="flex items-center gap-2 text-[12px] text-[#8690a6]">
                  <span>
                    Kesulitan:{' '}
                    <strong className="text-[#22d3ee] font-bold">
                      {currentRoom.difficulty}
                    </strong>
                  </span>
                  <span className="text-[#5b6478]">·</span>
                  <span>
                    Status:{' '}
                    <strong className="text-[#e879f9] font-bold">
                      {readyCount} / {playerList.length} Siap
                    </strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons Code & Leave */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#11141f] border border-[#232838] shadow-inner min-h-[44px]">
                  <span className="text-[11px] text-[#8690a6] font-semibold uppercase">Kode:</span>
                  <span className="font-mono-code font-bold text-[14px] text-[#22d3ee] tracking-wider select-all">
                    {currentRoom.code}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRoomCode}
                    className="p-1 text-[#8690a6] hover:text-white transition-colors cursor-pointer"
                    title="Salin Kode"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-[#34d399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleShareNative}
                  className="min-h-[44px] px-3.5 rounded-[10px] border border-[#232838] bg-transparent hover:border-[#22d3ee]/50 hover:bg-[#22d3ee]/5 text-[#cdd4e3] hover:text-white text-[12px] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-[#34d399]" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedLink ? 'Tersalin' : 'Bagikan Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="min-h-[44px] px-3.5 rounded-[10px] border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[12px] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>

            {/* Quick Chat Reactions */}
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-[12px] bg-[#11141f] border border-[#1d2233]">
              <span className="text-[11px] font-semibold text-[#8690a6] uppercase flex items-center gap-1 mr-1">
                <MessageSquare className="w-3 h-3 text-[#22d3ee]" /> Pesan Cepat:
              </span>
              {['🔥 Gaspol!', '😂 Awas nabrak!', '🏆 Siap juara!', '⚡ Awas EMP!', '🏎️ GG!'].map(
                msg => (
                  <button
                    key={msg}
                    type="button"
                    onClick={() => handleSendTaunt(msg)}
                    className="min-h-[44px] px-3 py-2 rounded-[8px] border border-[#232838] bg-transparent hover:bg-white/5 text-[11px] font-semibold text-[#cdd4e3] hover:text-white transition-all cursor-pointer active:scale-95"
                  >
                    {msg}
                  </button>
                )
              )}
            </div>

            {/* Player Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {playerList.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-5 rounded-[14px] bg-[#11141f] border border-[#1d2233] hover:border-[#22d3ee]/40 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_18px_rgba(34,211,238,0.08)]"
                >
                  {p.isHost && (
                    <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[9px] font-bold uppercase tracking-wider">
                      <Crown className="w-2.5 h-2.5" /> HOST
                    </div>
                  )}

                  <div
                    className="w-14 h-14 rounded-[14px] flex items-center justify-center text-2xl mb-3 shadow-md border transition-transform duration-300 hover:scale-105"
                    style={{
                      borderColor: p.carColor || '#22d3ee',
                      backgroundColor: `${p.carColor || '#22d3ee'}18`,
                    }}
                  >
                    {p.avatar || '🏎️'}
                  </div>

                  <div className="font-sora font-bold text-white text-[14px] truncate max-w-full">
                    {p.username}
                    {p.id === user?.id && (
                      <span className="text-[11px] text-[#22d3ee] ml-1 font-mono-code">(Kamu)</span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#8690a6] mt-0.5 font-mono-code">
                    {p.carModel ? p.carModel.replace(/_/g, ' ').toUpperCase() : 'CIVIC FL5'}
                  </div>

                  <div className="mt-3 w-full">
                    <span
                      className={`inline-flex items-center justify-center w-full py-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        p.status === 'ready'
                          ? 'bg-[#34d399]/15 border border-[#34d399]/40 text-[#34d399] shadow-[0_0_10px_rgba(52,211,153,0.15)]'
                          : 'bg-white/5 border border-white/10 text-[#8690a6]'
                      }`}
                    >
                      {p.status === 'ready' ? '✓ SIAP BALAPAN' : 'MENUNGGU...'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Waiting Room Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#1c2232]">
              <button
                type="button"
                onClick={handleToggleReady}
                className={`w-full sm:w-auto min-h-[44px] px-7 rounded-[10px] font-sora font-bold text-[13px] transition-all cursor-pointer active:scale-95 ${
                  myPlayerState?.status === 'ready'
                    ? 'bg-white/10 hover:bg-white/15 text-[#eef1f6] border border-white/20'
                    : 'bg-[#22d3ee] hover:bg-[#67e8f9] text-[#04141c] shadow-lg shadow-[#22d3ee]/25'
                }`}
              >
                {myPlayerState?.status === 'ready' ? 'Batal Siap' : '✓ Siap Balapan'}
              </button>

              {isHost ? (
                <button
                  type="button"
                  onClick={handleStartGame}
                  className="w-full sm:w-auto min-h-[44px] px-8 rounded-[10px] bg-gradient-to-r from-[#22d3ee] via-[#67e8f9] to-[#34d399] hover:opacity-95 text-[#04141c] font-sora font-extrabold text-[13px] uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-[#22d3ee]/30 hover:shadow-[#22d3ee]/50 hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Mulai Balapan Sekarang!</span>
                </button>
              ) : (
                <div className="text-[12px] text-[#8690a6] flex items-center gap-2">
                  <span className="mp-live w-2 h-2 rounded-full bg-[#22d3ee] inline-block shadow-[0_0_8px_#22d3ee]" />
                  <span>Menunggu host memulai pertandingan...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW B: LOBBY ARENA (Presis Persis Desain Referensi HTML/CSS Mockup)     */
          /* ========================================================================= */
          <>
            {/* 1. TOP BAR */}
            <div className="flex flex-wrap gap-4 justify-between items-start">
              <div className="flex gap-3.5 items-start">
                <div className="w-11 h-11 rounded-[12px] bg-[rgba(34,211,238,0.10)] border border-[rgba(34,211,238,0.35)] hover:border-[#22d3ee] hover:shadow-[0_0_18px_rgba(34,211,238,0.25)] flex items-center justify-center text-[#22d3ee] shrink-0 transition-all duration-300">
                  <Users className="w-5.5 h-5.5" strokeWidth={1.8} />
                </div>
                <div>
                  <h1 className="m-0 font-sora font-bold text-[26px] tracking-[-0.01em] text-white leading-tight">
                    Multiplayer Arena
                  </h1>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#9aa5ba] max-w-[46ch]">
                    Balapan real-time bersama teman lewat kode room atau gabung ke room publik.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-center">
                {onOpenReplays && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.play('click');
                      onOpenReplays();
                    }}
                    className="inline-flex items-center gap-2 min-h-[44px] px-4.5 rounded-[10px] border border-[#232838] bg-transparent text-[#cdd4e3] hover:text-white hover:border-[#22d3ee]/50 hover:bg-[#22d3ee]/5 font-manrope font-semibold text-[13px] transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" strokeWidth={1.8} />
                    <span>Replay</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    sound.play('click');
                    onBackToSolo();
                  }}
                  className="inline-flex items-center gap-2 min-h-[44px] px-4.5 rounded-[10px] border border-[#232838] bg-transparent text-[#cdd4e3] hover:text-white hover:border-[#22d3ee]/50 hover:bg-[#22d3ee]/5 font-manrope font-semibold text-[13px] transition-all duration-200 cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.8} />
                  <span>Main Solo</span>
                </button>
              </div>
            </div>

            {/* 2. PANEL BANNER LINK PUBLIK (Full Width Top Card) */}
            <div className="border border-[#1c2232] hover:border-[#22d3ee]/35 bg-[#0c0e18] rounded-[16px] p-5 sm:p-[20px_22px] flex flex-col gap-4 shadow-xl hover:shadow-[0_0_30px_rgba(34,211,238,0.06)] transition-all duration-300">
              <div className="flex flex-wrap gap-2.5 items-center justify-between">
                <div className="flex gap-2.5 items-center">
                  <LinkIcon className="w-4 h-4 text-[#22d3ee]" strokeWidth={1.8} />
                  <span className="font-sora font-bold text-[13px] tracking-[0.02em] text-[#eef1f6]">
                    Link Publik Game
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7589]">
                    <span>·</span>
                    <Smartphone className="w-3 h-3" strokeWidth={1.8} />
                    <span>Multi-perangkat</span>
                  </span>
                </div>

                {/* Status Server Real-Time dengan Animasi Gelombang Waveform Sinyal */}
                <div className="inline-flex items-center gap-2.5 font-manrope font-semibold text-[11px] tracking-[0.03em] text-[#34d399] bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.3)] px-3 py-1.5 rounded-full shadow-sm">
                  {/* Grafik Gelombang Real-Time */}
                  <div className="flex items-end gap-[2px] h-3.5 w-4 pb-0.5" aria-hidden="true">
                    <span className="w-0.75 h-2.5 rounded-full bg-[#34d399] animate-wave-bar-1" />
                    <span className="w-0.75 h-3.5 rounded-full bg-[#34d399] animate-wave-bar-2" />
                    <span className="w-0.75 h-2 rounded-full bg-[#34d399] animate-wave-bar-3" />
                    <span className="w-0.75 h-3 rounded-full bg-[#34d399] animate-wave-bar-4" />
                    <span className="w-0.75 h-2.5 rounded-full bg-[#34d399] animate-wave-bar-5" />
                  </div>
                  <span className="text-[10px] font-mono-code font-bold text-[#34d399]/90">
                    {livePing}ms
                  </span>
                  <span className="text-[#34d399]/40">·</span>
                  <span className="mp-live w-1.5 h-1.5 rounded-full bg-[#34d399] inline-block shadow-[0_0_6px_#34d399]" />
                  <span>CLOUD SERVER AKTIF</span>
                </div>
              </div>

              <p className="m-0 text-[13px] leading-relaxed text-[#8690a6] max-w-[72ch]">
                Bagikan link ini ke teman Anda agar bisa langsung membuka dan main balap bareng dari browser HP, Laptop, atau Tablet berbeda.
              </p>

              {/* Input URL & Action Buttons */}
              <div className="flex flex-wrap gap-2.5 items-center">
                <div className="flex-[999_1_320px] min-w-0 flex items-center h-11 px-3.5 rounded-[10px] bg-[#11141f] border border-[#232838] focus-within:border-[#22d3ee]/60 focus-within:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all">
                  <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono-code font-medium text-[13px] text-[#9fe8f5] select-all">
                    {publicUrl}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  className="min-h-[44px] flex-initial inline-flex items-center gap-2 px-5 rounded-[10px] border-none bg-[#22d3ee] hover:bg-[#67e8f9] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] text-[#04141c] font-manrope font-bold text-[13px] transition-all duration-200 cursor-pointer active:scale-95 shadow-sm shadow-[#22d3ee]/20 hover:-translate-y-0.5"
                >
                  {copiedPublicLink ? (
                    <>
                      <Check className="w-4 h-4" strokeWidth={2} />
                      <span>Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" strokeWidth={1.8} />
                      <span>Salin Link Game</span>
                    </>
                  )}
                </button>

                <a
                  href={waShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] flex-initial inline-flex items-center gap-2 px-5 rounded-[10px] border border-[#232838] hover:border-[#34d399]/50 hover:bg-[#34d399]/5 bg-transparent text-[#cdd4e3] hover:text-white font-manrope font-semibold text-[13px] transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                  title="Bagikan ke WhatsApp"
                >
                  <Send className="w-4 h-4" strokeWidth={1.8} />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] flex-initial w-11 inline-flex items-center justify-center rounded-[10px] border border-[#232838] hover:border-[#22d3ee]/50 hover:bg-[#22d3ee]/5 bg-transparent text-[#9aa5ba] hover:text-white transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                  aria-label="Buka link di tab baru"
                  title="Buka di tab baru"
                >
                  <ExternalLink className="w-4 h-4" strokeWidth={1.8} />
                </a>
              </div>

              {/* 3 Step Guide */}
              <div className="flex flex-wrap gap-x-5.5 gap-y-2 pt-0.5">
                <div className="flex gap-2 items-center text-[12px] leading-snug text-[#9aa5ba]">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-[rgba(34,211,238,0.12)] border border-[rgba(34,211,238,0.4)] text-[#22d3ee] font-manrope font-bold text-[10px] flex items-center justify-center">
                    1
                  </span>
                  <span>Buat ruangan baru di bawah</span>
                </div>

                <div className="flex gap-2 items-center text-[12px] leading-snug text-[#9aa5ba]">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-[rgba(34,211,238,0.12)] border border-[rgba(34,211,238,0.4)] text-[#22d3ee] font-manrope font-bold text-[10px] flex items-center justify-center">
                    2
                  </span>
                  <span>Kirim kode / link ke teman</span>
                </div>

                <div className="flex gap-2 items-center text-[12px] leading-snug text-[#9aa5ba]">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-[rgba(34,211,238,0.12)] border border-[rgba(34,211,238,0.4)] text-[#22d3ee] font-manrope font-bold text-[10px] flex items-center justify-center">
                    3
                  </span>
                  <span>Teman masuk tinggal klik link</span>
                </div>
              </div>
            </div>

            {/* 3. MAIN GRID (2 Kolom) */}
            <div className="flex flex-wrap gap-6 items-start">
              {/* KOLOM KIRI (Sidebar Controls - 340px to 360px) */}
              <div className="flex-[1_1_340px] max-w-full lg:max-w-[360px] flex flex-col gap-5">
                {/* Card 1: Gabung via Kode Room */}
                <div className="border border-[#1c2232] hover:border-[#22d3ee]/40 bg-[#0c0e18] rounded-[16px] p-5 shadow-xl hover:shadow-[0_0_24px_rgba(34,211,238,0.06)] transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3.5">
                    <LogIn className="w-4 h-4 text-[#22d3ee]" strokeWidth={1.8} />
                    <h2 className="m-0 font-sora font-bold text-[15px] text-[#eef1f6]">
                      Gabung via Kode Room
                    </h2>
                  </div>

                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleJoinRoom(roomCodeInput);
                    }}
                    className="flex gap-2.5"
                  >
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={e => setRoomCodeInput(e.target.value.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase())}
                      maxLength={16}
                      placeholder="Contoh: NEON-77"
                      aria-label="Kode room"
                      className="flex-1 min-w-0 h-11 px-3.5 rounded-[10px] bg-[#11141f] border border-[#232838] text-[#eef1f6] font-mono-code font-medium text-[13px] placeholder:text-[#5b6478] uppercase focus:outline-none focus:border-[#22d3ee] focus:shadow-[0_0_12px_rgba(34,211,238,0.2)] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!roomCodeInput.trim()}
                      className="min-h-[44px] flex-initial px-5.5 rounded-[10px] border-none bg-[#22d3ee] hover:bg-[#67e8f9] hover:shadow-[0_0_18px_rgba(34,211,238,0.4)] text-[#04141c] font-manrope font-bold text-[13px] transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-40"
                    >
                      Masuk
                    </button>
                  </form>
                </div>

                {/* Card 2: Buat Arena Baru */}
                <form
                  onSubmit={handleCreateRoom}
                  className="border border-[#1c2232] hover:border-[#22d3ee]/40 bg-[#0c0e18] rounded-[16px] p-5 flex flex-col gap-4 shadow-xl hover:shadow-[0_0_24px_rgba(34,211,238,0.06)] transition-all duration-300"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#22d3ee]" strokeWidth={1.8} />
                    <h2 className="m-0 font-sora font-bold text-[15px] text-[#eef1f6]">
                      Buat Arena Baru
                    </h2>
                  </div>

                  {/* Input 1: Nama Lobby */}
                  <label className="flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1.5 font-manrope font-semibold text-[11px] tracking-[0.04em] text-[#8690a6] uppercase">
                      <Tag className="w-3 h-3" strokeWidth={1.8} />
                      Nama Lobby
                    </span>
                    <input
                      type="text"
                      value={newRoomName}
                      onChange={e => setNewRoomName(e.target.value.slice(0, 32))}
                      maxLength={32}
                      placeholder="Nama lobby balapan"
                      className="h-11 px-3.5 rounded-[10px] bg-[#11141f] border border-[#232838] text-[#eef1f6] font-manrope font-medium text-[13px] focus:outline-none focus:border-[#22d3ee] focus:shadow-[0_0_12px_rgba(34,211,238,0.2)] transition-all"
                    />
                  </label>

                  {/* Input 2: Kode Room Khusus (opsional) */}
                  <label className="flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1.5 font-manrope font-semibold text-[11px] tracking-[0.04em] text-[#8690a6]">
                      <Key className="w-3 h-3" strokeWidth={1.8} />
                      <span className="uppercase">Kode Room Khusus</span>{' '}
                      <span className="text-[#5b6478] font-normal">(opsional)</span>
                    </span>
                    <input
                      type="text"
                      value={customRoomCode}
                      onChange={e => setCustomRoomCode(e.target.value.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase())}
                      maxLength={16}
                      placeholder="Contoh: NEON-77 (atau kosongkan untuk acak)"
                      className="h-11 px-3.5 rounded-[10px] bg-[#11141f] border border-[#232838] text-[#eef1f6] font-mono-code font-medium text-[13px] placeholder:text-[#5b6478] uppercase focus:outline-none focus:border-[#22d3ee] focus:shadow-[0_0_12px_rgba(34,211,238,0.2)] transition-all"
                    />
                  </label>

                  {/* Input 3: Tingkat Kesulitan */}
                  <div className="flex flex-col gap-2">
                    <span className="font-manrope font-semibold text-[11px] tracking-[0.04em] text-[#8690a6] uppercase">
                      Tingkat Kesulitan
                    </span>
                    <div className="flex gap-2">
                      {(['NORMAL', 'HARD', 'MAXXX'] as DifficultyLevel[]).map(diff => {
                        const tier = getTierInfo(diff);
                        const TierIcon = tier.icon;
                        const isSelected = newRoomDiff === diff;
                        return (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => {
                              sound.play('click');
                              setNewRoomDiff(diff);
                            }}
                            className={`flex-1 min-h-[44px] rounded-[9px] inline-flex items-center justify-center gap-1.5 font-manrope font-bold text-[12px] tracking-[0.03em] transition-all duration-200 cursor-pointer active:scale-95 ${
                              isSelected
                                ? tier.activeBtnStyle
                                : 'border border-[#232838] bg-transparent text-[#8690a6] hover:text-[#cdd4e3] hover:border-white/20'
                            }`}
                          >
                            <TierIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                            <span>{diff}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="mt-0.5 min-h-[48px] rounded-[10px] border-none bg-[#22d3ee] hover:bg-[#67e8f9] hover:shadow-[0_0_24px_rgba(34,211,238,0.4)] text-[#04141c] font-manrope font-bold text-[13px] inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 shadow-md shadow-[#22d3ee]/20 hover:-translate-y-0.5"
                  >
                    <Zap className="w-4 h-4 fill-current" strokeWidth={1.8} />
                    <span>Buat & Buka Lobby</span>
                  </button>
                </form>
              </div>

              {/* KOLOM KANAN (Public Lobby List) */}
              <div className="flex-[999_1_480px] min-w-0">
                <div className="border border-[#1c2232] bg-[#0c0e18] rounded-[16px] p-5 flex flex-col gap-4 shadow-xl">
                  {/* Header Card */}
                  <div className="flex items-center justify-between flex-wrap gap-2.5">
                    <h2 className="m-0 font-sora font-bold text-[15px] text-[#eef1f6]">
                      Lobby Publik Aktif{' '}
                      <span className="text-[#8690a6] font-semibold">
                        ({displayLobbies.length})
                      </span>
                    </h2>

                    <button
                      type="button"
                      onClick={handleRefreshRooms}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-[8px] border border-[#232838] hover:border-[#22d3ee]/40 hover:bg-[#22d3ee]/5 bg-transparent text-[#9aa5ba] hover:text-white font-manrope font-semibold text-[12px] transition-all duration-200 cursor-pointer active:scale-95"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#22d3ee]' : ''}`}
                        strokeWidth={1.8}
                      />
                      <span>Segarkan</span>
                    </button>
                  </div>

                  {/* List Items */}
                  <div className="flex flex-col gap-2.5">
                    {displayLobbies.map(lobby => {
                      const tier = getTierInfo(lobby.tier);
                      const TierIcon = tier.icon;
                      return (
                        <div
                          key={lobby.code}
                          className={`flex flex-wrap items-center gap-3.5 p-3.5 sm:p-[14px_16px] rounded-[12px] bg-[#11141f] border border-[#1d2233] transition-all duration-300 ${tier.cardHoverStyle}`}
                        >
                          <span
                            className="mp-live w-1.75 h-1.75 rounded-full bg-[#34d399] shrink-0 shadow-[0_0_6px_#34d399]"
                            aria-hidden="true"
                          />

                          <div className="flex-[1_1_220px] min-w-0">
                            {/* Baris 1: Nama & Kode Badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-sora font-bold text-[14px] text-[#eef1f6]">
                                {lobby.name}
                              </span>
                              <span className="font-mono-code font-semibold text-[10px] tracking-[0.03em] text-[#8690a6] bg-[#161a27] border border-[#232838] px-1.75 py-1 rounded-[6px]">
                                {lobby.code}
                              </span>
                            </div>

                            {/* Baris 2: Tier, Players, Status */}
                            <div className="flex items-center gap-3 mt-1.75 text-[12px] text-[#8690a6] flex-wrap">
                              <span
                                className="inline-flex items-center gap-1 font-manrope font-bold text-[11px] tracking-[0.03em]"
                                style={{ color: tier.color }}
                              >
                                <TierIcon className="w-3 h-3" strokeWidth={1.8} />
                                {tier.label}
                              </span>

                              <span className="inline-flex items-center gap-1.25">
                                <Users className="w-3 h-3" strokeWidth={1.8} />
                                {lobby.players}
                              </span>

                              <span className="inline-flex items-center gap-1.25">
                                <Clock className="w-3 h-3" strokeWidth={1.8} />
                                {lobby.status}
                              </span>
                            </div>
                          </div>

                          {/* Tombol Gabung */}
                          <button
                            type="button"
                            onClick={() => handleJoinRoom(lobby.code)}
                            className="min-h-[44px] shrink-0 px-5.5 rounded-[9px] border-none bg-[#22d3ee] hover:bg-[#67e8f9] hover:shadow-[0_0_18px_rgba(34,211,238,0.4)] text-[#04141c] font-manrope font-bold text-[13px] inline-flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm shadow-[#22d3ee]/20 hover:-translate-y-0.5"
                          >
                            <LogIn className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>Gabung</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MultiplayerLobby;
