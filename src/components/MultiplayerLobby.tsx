import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, MultiplayerRoom, DifficultyLevel, MultiplayerPlayerState } from '../types/game';
import { socket } from '../services/socket';
import { sound } from '../services/audio';
import { getCarModel } from '../services/cars';
import { BrandLogo } from './BrandLogo';
import { getPublicGameUrl, copyTextToClipboard } from '../utils/share';
import {
  Users,
  Plus,
  Play,
  Copy,
  Check,
  Radio,
  Share2,
  MessageSquare,
  Link,
  ArrowLeft,
  RotateCw,
  Crown,
  LogOut,
  Car,
  Flame,
  Globe,
  MessageCircle,
  Send,
  Smartphone,
  Laptop,
  ExternalLink,
} from 'lucide-react';

interface MultiplayerLobbyProps {
  user: UserProfile | null;
  initialRoomCode?: string | null;
  onStartMatch: (room: MultiplayerRoom) => void;
  onBackToSolo: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  user,
  initialRoomCode,
  onStartMatch,
  onBackToSolo,
}) => {
  const [rooms, setRooms] = useState<
    { code: string; name: string; status: string; difficulty: string; playerCount: number }[]
  >([]);
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode || '');
  const [customRoomCode, setCustomRoomCode] = useState('');

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCodeInput(initialRoomCode.trim().toUpperCase());
    }
  }, [initialRoomCode]);
  const [newRoomName, setNewRoomName] = useState(`${user?.username || 'Pembalap'}'s Arena`);
  const [newRoomDiff, setNewRoomDiff] = useState<DifficultyLevel>('NORMAL');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lobbyMessages, setLobbyMessages] = useState<{ sender: string; text: string }[]>([]);

  const handleJoinRoom = useCallback(
    (code: string) => {
      if (!code?.trim()) return;
      sound.play('click');
      socket.send({
        type: 'join_room',
        code: code.trim().toUpperCase(),
        userId: user?.id || 'guest_' + Date.now(),
        username: user?.username || 'Racer',
        avatar: user?.avatar || '🏎️',
        carColor: user?.carColor || '#f8fafc',
        carModel: user?.carModel || 'civic_fl5',
      });
    },
    [user]
  );

  // Socket room listeners
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
        setLobbyMessages(prev => [...prev.slice(-3), { sender: data.username || 'Pembalap', text: data.value }]);
      }
    });

    const unbindError = socket.on('error', (data: any) => {
      setErrorMessage(data.message || 'Terjadi kesalahan');
      sound.play('gameover');
      setTimeout(() => setErrorMessage(''), 4000);
    });

    // If invited via URL initialRoomCode, auto-join
    if (initialRoomCode) {
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
      clearInterval(interval);
    };
  }, [user?.id, onStartMatch, initialRoomCode, handleJoinRoom]);

  const handleCreateRoom = () => {
    sound.play('click');
    socket.send({
      type: 'create_room',
      code: customRoomCode.trim().toUpperCase() || undefined,
      name: newRoomName.trim() || `${user?.username || 'Pembalap'}'s Arena`,
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
    setLobbyMessages(prev => [...prev.slice(-3), { sender: 'Kamu', text: msg }]);
  };

  const handleCopyInviteLink = async () => {
    if (!currentRoom) return;
    const inviteUrl = getPublicGameUrl(currentRoom.code);
    const success = await copyTextToClipboard(inviteUrl);
    if (success) {
      setCopiedLink(true);
      sound.play('coin');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyRoomCode = async () => {
    if (!currentRoom) return;
    const success = await copyTextToClipboard(currentRoom.code);
    if (success) {
      setCopiedCode(true);
      sound.play('coin');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShareNative = async () => {
    if (!currentRoom) return;
    const inviteUrl = getPublicGameUrl(currentRoom.code);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Main Balapan Bersama di Neon Highway!',
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

  const myPlayerState = currentRoom && user
    ? currentRoom.players[user.id] ||
      playerList.find(
        p => p.id === user.id || p.username.toLowerCase() === user.username.toLowerCase()
      ) ||
      null
    : null;

  const isHost = Boolean(
    myPlayerState?.isHost ||
    (currentRoom && playerList.length > 0 && playerList[0].id === user?.id) ||
    (currentRoom && playerList.length > 0 && playerList[0].username.toLowerCase() === user?.username.toLowerCase()) ||
    (currentRoom && !playerList.some(p => p.isHost))
  );

  const readyCount = playerList.filter(p => p.status === 'ready').length;

  return (
    <div className="w-full max-w-5xl mx-auto py-3 px-3 sm:px-6">
      {errorMessage && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold font-display text-center flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. WAITING ROOM VIEW (When currently inside a room)                       */}
      {/* ========================================================================= */}
      {currentRoom ? (
        <div className="bg-[#0b0c18] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5">
          {/* Header Bar: Standardized Responsive CSS Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center pb-4 border-b border-white/10">
            {/* Room info (7 cols) */}
            <div className="md:col-span-7 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 font-display">
                  Ruang Tunggu Duel
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-xs text-gray-400 font-medium">
                  {playerList.length} / 4 Pemain Terhubung
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-wide">
                {currentRoom.name}
              </h2>
              <div className="flex items-center gap-2 pt-0.5 text-xs text-gray-400 font-medium">
                <span>Mode: <strong className="text-cyan-400 font-bold">{currentRoom.difficulty}</strong></span>
                <span className="text-gray-600">·</span>
                <span>Status: <strong className="text-fuchsia-400 font-bold">{readyCount} / {playerList.length} Siap</strong></span>
              </div>
            </div>

            {/* Room Code & Quick Share Box (5 cols) */}
            <div className="md:col-span-5 flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-2 w-full justify-between md:justify-end">
              <div className="px-2.5 py-1 text-left">
                <div className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Kode Room</div>
                <div className="text-lg font-display font-black text-cyan-400 tracking-wider select-all leading-tight">
                  {currentRoom.code}
                </div>
              </div>
              <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
                <button
                  type="button"
                  onClick={handleCopyRoomCode}
                  className="px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer min-h-[38px]"
                  title="Salin Kode Room"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copiedCode ? 'Disalin' : 'Kode'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
                  title="Salin Tautan Undangan Langsung"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Tersalin!' : 'Salin Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareNative}
                  className="p-2 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-500/30 text-fuchsia-300 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Bagikan ke Teman"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Reaction & Chat Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/5">
            {/* Quick Reactions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
                <MessageSquare className="w-3 h-3 text-cyan-400" /> Reaksi:
              </span>
              {['🔥 Gaspol!', '😂 Awas nabrak!', '🏆 Siap juara!', '⚡ Awas EMP!', '🏎️ GG!'].map(taunt => (
                <button
                  key={taunt}
                  type="button"
                  onClick={() => handleSendTaunt(taunt)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer active:scale-95 min-h-[36px]"
                >
                  {taunt}
                </button>
              ))}
            </div>

            {/* Recent Message Feed */}
            {lobbyMessages.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-gray-300">
                <span className="text-cyan-400 font-bold">Terbaru:</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-md font-medium text-gray-200 truncate max-w-[200px]">
                  {lobbyMessages[lobbyMessages.length - 1].sender}: {lobbyMessages[lobbyMessages.length - 1].text}
                </span>
              </div>
            )}
          </div>

          {/* Player Cards Grid: Standardized Responsive 4-Slot Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {playerList.map((p, idx) => (
              <div
                key={p.id || idx}
                className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col items-center text-center relative overflow-hidden transition-all hover:border-white/20"
              >
                {/* Host Crown */}
                {p.isHost && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400 text-black text-[9px] font-black tracking-wider uppercase shadow-sm">
                    <Crown className="w-2.5 h-2.5" /> HOST
                  </div>
                )}

                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-2.5 shadow-md border"
                  style={{
                    borderColor: p.carColor || '#00f0ff',
                    backgroundColor: `${p.carColor || '#00f0ff'}18`,
                  }}
                >
                  {p.avatar || '🏎️'}
                </div>

                {/* Name */}
                <div className="font-display font-bold text-white text-sm truncate max-w-full">
                  {p.username}
                  {p.id === user?.id && <span className="text-[10px] text-cyan-400 ml-1">(Kamu)</span>}
                </div>

                {/* Car Badge */}
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-1">
                  <BrandLogo brand={getCarModel(p.carModel).brand} size={15} />
                  <span className="truncate max-w-[110px]">{getCarModel(p.carModel).name}</span>
                </div>

                {/* Status Pill */}
                <div className="mt-3 w-full">
                  <span
                    className={`block w-full py-1.5 rounded-lg text-[10.5px] font-bold tracking-wider font-display uppercase border ${
                      p.status === 'ready'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {p.status === 'ready' ? '✓ SIAP' : 'MENUNGGU'}
                  </span>
                </div>
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, 4 - playerList.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[160px] bg-white/[0.02]"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-600 mb-2">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Slot Kosong</div>
                <div className="text-[10px] text-gray-500 mt-1">Undang teman dengan kode</div>
              </div>
            ))}
          </div>

          {/* Bottom Action Footer: Standardized Grid Alignment */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-4 border-t border-white/10 items-center">
            <div className="sm:col-span-4">
              <button
                type="button"
                onClick={handleLeaveRoom}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold font-display uppercase tracking-wider transition-colors cursor-pointer border border-white/5 min-h-[44px]"
              >
                <LogOut className="w-3.5 h-3.5" /> Keluar Room
              </button>
            </div>

            <div className="sm:col-span-8 flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={handleToggleReady}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer min-h-[44px] ${
                  myPlayerState?.status === 'ready'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-md shadow-emerald-500/20'
                }`}
              >
                {myPlayerState?.status === 'ready' ? 'Batal Siap' : 'Saya Siap!'}
              </button>

              {isHost ? (
                <button
                  type="button"
                  onClick={handleStartGame}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider transition-all min-h-[44px] bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-fuchsia-500/25 hover:scale-105 active:scale-95 cursor-pointer"
                  title="Mulai Balapan Sekarang Bersama Teman"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Mulai Balapan!
                </button>
              ) : (
                <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-cyan-500/20 text-cyan-300 font-display font-bold text-xs uppercase tracking-wider min-h-[44px]">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Menunggu Host Memulai...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. LOBBY BROWSER VIEW (When not in any room)                             */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Top Bar Navigation: Standardized Grid Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start sm:items-center pb-3 border-b border-white/10">
            <div className="sm:col-span-9">
              <h1 className="text-xl font-display font-black text-white tracking-wide flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>Multiplayer Arena</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Balapan real-time bersama teman lewat kode room atau gabung ke room publik.
              </p>
            </div>
            <div className="sm:col-span-3 flex sm:justify-end">
              <button
                type="button"
                onClick={onBackToSolo}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer min-h-[40px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Main Solo</span>
              </button>
            </div>
          </div>

          {/* Public Sharing & Multi-Device Bar: Standardized CSS Grid */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-[#0b0c1a] to-fuchsia-950/40 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start lg:items-center shadow-xl">
            <div className="lg:col-span-7 space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-display font-bold uppercase tracking-wider text-cyan-300">
                  Link Publik Game (Multi-Perangkat)
                </span>
                <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {socket.isP2P ? 'P2P WEBRTC AKTIF' : 'CLOUD SERVER AKTIF'}
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Bagikan link ini ke teman Anda agar bisa langsung membuka dan main balap bareng dari browser HP, Laptop, atau Tablet berbeda:
              </p>
              <div className="text-[11px] text-cyan-400/90 font-mono select-all break-all pt-0.5">
                {getPublicGameUrl()}
              </div>
              {/* Cara Main Bareng Berbeda Perangkat */}
              <div className="pt-2 text-[11px] text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                <span><strong className="text-cyan-400">Langkah 1:</strong> Buat Ruangan baru di bawah.</span>
                <span><strong className="text-fuchsia-400">Langkah 2:</strong> Kirim Kode / Link ke teman.</span>
                <span><strong className="text-emerald-400">Langkah 3:</strong> Teman masukkan kode & klik Masuk!</span>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-wrap items-center justify-start lg:justify-end gap-2 w-full">
              <button
                type="button"
                onClick={async () => {
                  const success = await copyTextToClipboard(getPublicGameUrl());
                  if (success) {
                    setCopiedPublicLink(true);
                    sound.play('coin');
                    setTimeout(() => setCopiedPublicLink(false), 2000);
                  }
                }}
                className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md shadow-cyan-500/20 min-h-[44px]"
              >
                {copiedPublicLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPublicLink ? 'Link Tersalin!' : 'Salin Link Game'}</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Ayo main game balap liar Escape Police bareng aku secara real-time!\nKlik link: ${getPublicGameUrl()}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[44px]"
                title="Kirim ke WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>

              <a
                href={getPublicGameUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs transition-colors cursor-pointer min-h-[44px]"
                title="Buka di Tab Baru"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Standardized 2-Column Responsive CSS Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Left Column (5 cols): Join & Create */}
            <div className="lg:col-span-5 space-y-4">
              {/* Card 1: Gabung via Kode */}
              <div className="bg-[#0b0c18] border border-white/10 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                    Gabung via Kode Room
                  </h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleJoinRoom(roomCodeInput);
                    }}
                    placeholder="Contoh: NEON-77"
                    className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs font-display font-bold tracking-widest text-white uppercase focus:outline-none focus:border-cyan-400 placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleJoinRoom(roomCodeInput)}
                    disabled={!roomCodeInput.trim()}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm shadow-cyan-500/20 active:scale-95"
                  >
                    Masuk
                  </button>
                </div>
              </div>

              {/* Card 2: Buat Room Baru */}
              <div className="bg-[#0b0c18] border border-white/10 rounded-2xl p-4.5 space-y-3.5">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-fuchsia-400" />
                  <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                    Buat Arena Baru
                  </h3>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-400 font-semibold uppercase tracking-wider block">
                    Nama Lobby
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                    placeholder="Nama arena..."
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-400 font-semibold uppercase tracking-wider block">
                    Kode Room Khusus (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customRoomCode}
                    onChange={e => setCustomRoomCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: NEON-77 (atau kosongkan untuk acak)"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono uppercase text-cyan-300 focus:outline-none focus:border-cyan-400 placeholder:normal-case placeholder:font-sans placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] text-gray-400 font-semibold uppercase tracking-wider block">
                    Tingkat Kesulitan
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
                    {(['NORMAL', 'HARD', 'MAXXX'] as DifficultyLevel[]).map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setNewRoomDiff(d)}
                        className={`py-1.5 rounded-lg text-[10.5px] font-display font-bold uppercase tracking-wider transition-all ${
                          newRoomDiff === d
                            ? 'bg-fuchsia-500 text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateRoom}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:opacity-95 text-white font-display font-extrabold text-xs uppercase tracking-wider shadow-md shadow-fuchsia-500/20 transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Buat & Buka Lobby
                </button>
              </div>
            </div>

            {/* Right Column (7 cols): Active Public Lobbies */}
            <div className="lg:col-span-7 bg-[#0b0c18] border border-white/10 rounded-2xl p-4.5 flex flex-col min-h-[380px]">
              {/* List Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                    Lobby Publik Aktif ({rooms.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsRefreshing(true);
                    socket.send({ type: 'list_rooms' });
                    setTimeout(() => setIsRefreshing(false), 800);
                  }}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
                >
                  <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Segarkan</span>
                </button>
              </div>

              {/* Lobbies List */}
              <div className="space-y-2 mt-3 overflow-y-auto max-h-[380px] pr-1 flex-1">
                {rooms.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center text-gray-500 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-gray-400">Belum ada lobby publik aktif</div>
                    <p className="text-[11px] text-gray-500 max-w-xs">
                      Buat lobby baru di sebelah kiri atau bagikan kode room ke teman untuk mulai balapan!
                    </p>
                  </div>
                ) : (
                  rooms.map(room => (
                    <div
                      key={room.code}
                      className="bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-display font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                          <span>{room.name}</span>
                          <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {room.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2.5">
                          <span>
                            Mode: <strong className="text-amber-400 font-semibold">{room.difficulty}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <strong className="text-white font-semibold">{room.playerCount}/4</strong>
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium capitalize">{room.status}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleJoinRoom(room.code)}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-cyan-500/20 active:scale-95 cursor-pointer transition-all"
                      >
                        Gabung
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
