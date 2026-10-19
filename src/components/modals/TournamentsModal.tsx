import React, { useState, useEffect } from 'react';
import { Tournament, TournamentLeaderboardEntry, UserProfile } from '../../types';
import { api, sound } from '../../services';
import {
  Calendar,
  Clock,
  Trophy,
  Share2,
  Check,
  Users,
  ExternalLink,
  Gamepad2,
  ArrowLeft,
  Flame,
  Award,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface TournamentsModalProps {
  user: UserProfile | null;
  onBackToGame?: () => void;
}

export const TournamentsModal: React.FC<TournamentsModalProps> = ({ user, onBackToGame }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'DAILY' | 'WEEKLY'>('ALL');
  
  // Selected tournament for live leaderboard view
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<TournamentLeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Live timer tick every second for real-time countdown
  const [, setClock] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTournaments = () => {
    setLoading(true);
    api.getTournaments(user?.id).then(list => {
      setTournaments(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchTournaments();
  }, [user?.id]);

  const handleOpenLeaderboard = async (t: Tournament) => {
    sound.play('click');
    setSelectedTournament(t);
    setLoadingLeaderboard(true);
    const data = await api.getTournamentLeaderboard(t.id);
    setLeaderboard(data.leaderboard);
    setLoadingLeaderboard(false);
  };

  const handleBackToList = () => {
    sound.play('click');
    setSelectedTournament(null);
    setLeaderboard([]);
  };

  const handleRegister = async (t: Tournament) => {
    if (!user || registeringId) return;
    setRegisteringId(t.id);
    sound.play('click');
    try {
      const ok = await api.registerTournament(t.id, user.id);
      if (ok) {
        sound.play('win');
        setTournaments(prev =>
          prev.map(item =>
            item.id === t.id
              ? { ...item, isRegistered: true, participantsCount: item.participantsCount + 1 }
              : item
          )
        );
        if (selectedTournament?.id === t.id) {
          setSelectedTournament(prev => prev ? { ...prev, isRegistered: true, participantsCount: prev.participantsCount + 1 } : null);
        }
      }
    } finally {
      setRegisteringId(null);
    }
  };

  const handleShare = (t: Tournament) => {
    sound.play('coin');
    const shareUrl = `${window.location.origin}/#tournament=${t.id}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).catch(() => {});
      }
    } catch {}
    setSharedId(t.id);
    setTimeout(() => setSharedId(null), 2500);
  };

  // Generate Google Calendar URL
  const getGoogleCalendarUrl = (t: Tournament) => {
    const formatTime = (iso: string) => iso.replace(/-|:|\.\d+/g, '');
    const start = formatTime(new Date(t.startTime).toISOString());
    const end = formatTime(new Date(t.endTime).toISOString());
    const title = encodeURIComponent(`Escape the Police: ${t.title}`);
    const details = encodeURIComponent(`${t.description}\nHadiah Bounty: ${t.prizeBounty.toLocaleString()} BOUNTY`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=Escape+The+Police+Cyber+Arena`;
  };

  const getRemainingTime = (isoDate: string) => {
    const diff = new Date(isoDate).getTime() - Date.now();
    if (diff <= 0) return '00:00:00';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;
      return `${days}h ${remHours}j ${minutes}m`;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const filteredTournaments = tournaments.filter(t => {
    if (filterType === 'ACTIVE') return t.status === 'ACTIVE';
    if (filterType === 'DAILY') return t.type === 'DAILY';
    if (filterType === 'WEEKLY') return t.type === 'WEEKLY';
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-950/40 via-[#0d0f1e] to-[#0a0a14] border border-rose-500/30 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-widest mb-2">
            <Calendar className="w-3.5 h-3.5" /> Kalender Jadwal & Turnamen Cyber Otomatis
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-white text-glow-magenta">
            {selectedTournament ? 'PAPAN PERINGKAT TURNAMEN' : 'TURNAMEN & JADWAL RESMI'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl leading-relaxed">
            {selectedTournament
              ? `Klasemen langsung skor tertinggi para pembalap untuk kejuaraan: ${selectedTournament.title}`
              : 'Jadwal bergulir otomatis setiap hari dan minggu oleh server. Cetak rekor balapan tertinggi selama turnamen aktif untuk merebut hadiah Bounty!'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          {selectedTournament ? (
            <button
              type="button"
              onClick={handleBackToList}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Jadwal</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={fetchTournaments}
              title="Perbarui status turnamen"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}

          {onBackToGame && (
            <button
              type="button"
              onClick={() => {
                sound.play('click');
                onBackToGame();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-display font-black uppercase tracking-wider shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer transition-transform whitespace-nowrap"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Gas Balapan (Solo)</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW: LIVE LEADERBOARD DETAIL */}
      {selectedTournament ? (
        <div className="space-y-6">
          {/* Tournament Overview Card */}
          <div className="bg-[#0b0c19] border border-rose-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-display font-bold uppercase tracking-wider ${
                      selectedTournament.tier === 'CYBER_LEGEND'
                        ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                        : selectedTournament.tier === 'ELITE'
                        ? 'bg-purple-500 text-white'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    {selectedTournament.tier}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {selectedTournament.type === 'WEEKLY' ? 'Kejuaraan Mingguan' : 'Kejuaraan Harian'}
                  </span>
                </div>
                <h2 className="text-xl font-display font-black text-white">{selectedTournament.title}</h2>
                <p className="text-xs text-gray-300 mt-1">{selectedTournament.description}</p>
              </div>

              <div className="flex items-center gap-4 bg-black/60 px-4 py-3 rounded-xl border border-white/5">
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Hadiah</span>
                  <span className="font-display font-black text-base text-amber-400 flex items-center gap-1 justify-end">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    {selectedTournament.prizeBounty.toLocaleString()} BOUNTY
                  </span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">
                    {selectedTournament.status === 'COMPLETED' ? 'Status' : 'Sisa Waktu'}
                  </span>
                  <span className="font-mono font-bold text-sm text-cyan-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedTournament.status === 'COMPLETED'
                      ? 'SELESAI'
                      : getRemainingTime(selectedTournament.endTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action in Leaderboard View */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>
                  Total Peserta:{' '}
                  <strong className="text-white font-mono">{selectedTournament.participantsCount} Pembalap</strong>
                </span>
                <span className="text-gray-600">·</span>
                <span>
                  Penentuan:{' '}
                  <strong className="text-emerald-400">Skor Balapan Tertinggi Selama Periode Turnamen</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!selectedTournament.isRegistered && selectedTournament.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleRegister(selectedTournament)}
                    disabled={registeringId === selectedTournament.id}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-rose-500/20"
                  >
                    {registeringId === selectedTournament.id ? 'Mendaftarkan...' : 'Daftar Sekarang'}
                  </button>
                )}

                {selectedTournament.isRegistered && selectedTournament.status === 'ACTIVE' && onBackToGame && (
                  <button
                    onClick={() => {
                      sound.play('click');
                      onBackToGame();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-500/25"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Gas Balapan Turnamen!</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Standings List */}
          {loadingLeaderboard ? (
            <div className="py-12 text-center text-sm font-mono text-cyan-400 animate-pulse">
              Memuat klasemen live turnamen...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center bg-[#0b0c19] border border-white/5 rounded-2xl p-8">
              <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <h3 className="text-sm font-display font-bold text-white mb-1">Belum Ada Skor Tercatat</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
                Jadilah yang pertama mencatatkan skor balapan di turnamen ini! Daftar dan mainkan balapan untuk menduduki puncak podium.
              </p>
              {onBackToGame && (
                <button
                  onClick={() => {
                    sound.play('click');
                    onBackToGame();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  Mulai Balapan Sekarang
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Top 3 Podium Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {leaderboard.slice(0, 3).map((entry, idx) => {
                  const rankColors = [
                    'border-amber-400/40 bg-gradient-to-b from-amber-950/30 to-black/60 text-amber-400',
                    'border-slate-300/40 bg-gradient-to-b from-slate-900/30 to-black/60 text-slate-300',
                    'border-amber-700/40 bg-gradient-to-b from-amber-900/20 to-black/60 text-amber-600',
                  ];
                  const rankLabels = ['Juara 1 (60% Bounty)', 'Juara 2 (25% Bounty)', 'Juara 3 (15% Bounty)'];
                  const estimatedPrize =
                    idx === 0
                      ? Math.floor(selectedTournament.prizeBounty * 0.6)
                      : idx === 1
                      ? Math.floor(selectedTournament.prizeBounty * 0.25)
                      : Math.floor(selectedTournament.prizeBounty * 0.15);

                  return (
                    <div
                      key={entry.userId}
                      className={`rounded-xl border p-4 flex flex-col justify-between ${rankColors[idx]}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-display font-bold uppercase tracking-wider">
                          {rankLabels[idx]}
                        </span>
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-3 my-2">
                        <span className="text-2xl">{entry.avatar}</span>
                        <div className="overflow-hidden">
                          <h4 className="font-display font-bold text-white text-sm truncate">{entry.username}</h4>
                          <span className="text-[10px] text-gray-400 block truncate">{entry.title}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400">Skor: <strong className="text-white font-bold">{entry.score.toLocaleString()}</strong></span>
                        <span className="text-amber-400 font-bold">+{estimatedPrize.toLocaleString()} B</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full Standings Table */}
              <div className="bg-[#0b0c19] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-4 py-3 bg-black/40 border-b border-white/10 flex items-center justify-between text-[11px] font-bold uppercase text-gray-400">
                  <span className="w-12 text-center">Pos</span>
                  <span className="flex-1">Pembalap</span>
                  <span className="w-24 text-right">Jarak</span>
                  <span className="w-20 text-right">Combo</span>
                  <span className="w-28 text-right">Skor Turnamen</span>
                </div>

                <div className="divide-y divide-white/5">
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = user && user.id === entry.userId;
                    return (
                      <div
                        key={entry.userId}
                        className={`px-4 py-3 flex items-center justify-between transition-colors ${
                          isCurrentUser
                            ? 'bg-cyan-500/10 border-l-4 border-cyan-400'
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="w-12 text-center font-display font-bold text-sm">
                          {index === 0 ? (
                            <span className="text-amber-400">🥇 1</span>
                          ) : index === 1 ? (
                            <span className="text-slate-300">🥈 2</span>
                          ) : index === 2 ? (
                            <span className="text-amber-600">🥉 3</span>
                          ) : (
                            <span className="text-gray-400 font-mono">#{index + 1}</span>
                          )}
                        </div>

                        <div className="flex-1 flex items-center gap-3 overflow-hidden pr-2">
                          <span className="text-xl shrink-0">{entry.avatar}</span>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-xs sm:text-sm text-white truncate">
                                {entry.username}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                  Kamu
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 block truncate">{entry.title}</span>
                          </div>
                        </div>

                        <div className="w-24 text-right font-mono text-xs text-gray-300">
                          {entry.distance.toLocaleString()}m
                        </div>

                        <div className="w-20 text-right font-mono text-xs text-purple-400 font-bold">
                          {entry.bestCombo}x
                        </div>

                        <div className="w-28 text-right font-mono font-extrabold text-sm text-cyan-400">
                          {entry.score.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VIEW: TOURNAMENTS LIST & SCHEDULES */
        <div className="space-y-6">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mr-2">Filter:</span>
            {(
              [
                { id: 'ALL', label: 'Semua Turnamen' },
                { id: 'ACTIVE', label: 'Sedang Berlangsung' },
                { id: 'DAILY', label: 'Harian (Daily Rush)' },
                { id: 'WEEKLY', label: 'Mingguan (Grand Prix)' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  sound.play('click');
                  setFilterType(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tournament Cards Grid */}
          {loading ? (
            <div className="py-12 text-center text-sm font-mono text-cyan-400 animate-pulse">
              Memuat jadwal turnamen server...
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="py-12 text-center text-sm font-mono text-gray-400 bg-[#0b0c19] border border-white/5 rounded-2xl p-6">
              Tidak ada turnamen yang cocok dengan filter yang dipilih.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredTournaments.map(t => {
                const startDate = new Date(t.startTime);
                const endDate = new Date(t.endTime);
                const now = Date.now();
                const isLive = now >= startDate.getTime() && now <= endDate.getTime();
                const isEnded = now > endDate.getTime();

                return (
                  <div
                    key={t.id}
                    className={`bg-[#0b0c19] border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-xl ${
                      isLive
                        ? 'border-rose-500/50 shadow-rose-500/10'
                        : isEnded
                        ? 'border-white/5 opacity-80'
                        : 'border-white/10 hover:border-cyan-500/40'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-display font-bold uppercase tracking-wider ${
                              t.tier === 'CYBER_LEGEND'
                                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                                : t.tier === 'ELITE'
                                ? 'bg-purple-500 text-white'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {t.tier}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {t.type === 'WEEKLY' ? 'Mingguan' : 'Harian'}
                          </span>
                        </div>

                        {isLive ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            SEDANG BERLANGSUNG
                          </span>
                        ) : isEnded ? (
                          <span className="text-[10px] font-bold text-gray-500">SELESAI</span>
                        ) : (
                          <span className="text-[10px] font-bold text-cyan-400">SEGERA HADIR</span>
                        )}
                      </div>

                      <h3 className="text-base font-display font-bold text-white mb-1.5">{t.title}</h3>
                      <p className="text-xs text-gray-400 mb-4 leading-relaxed line-clamp-2">{t.description}</p>

                      {/* Prize Pool & Participants */}
                      <div className="bg-black/50 p-3 rounded-xl border border-white/5 mb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Total Hadiah</span>
                          <span className="font-display font-extrabold text-sm text-amber-400 flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            {t.prizeBounty.toLocaleString()} BOUNTY
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-cyan-400" /> Terdaftar:
                          </span>
                          <span className="text-white font-bold">{t.participantsCount} Pembalap</span>
                        </div>
                      </div>

                      {/* Countdown & Timing */}
                      <div className="text-[11px] bg-white/[0.02] p-2.5 rounded-xl border border-white/5 space-y-1.5 mb-5">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {isLive ? 'Sisa Waktu:' : isEnded ? 'Berakhir pada:' : 'Dimulai dalam:'}
                          </span>
                          <span className="font-mono font-bold text-xs text-white">
                            {isLive
                              ? getRemainingTime(t.endTime)
                              : isEnded
                              ? endDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
                              : getRemainingTime(t.startTime)}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-center justify-between pt-1 border-t border-white/5">
                          <span>
                            Mulai: {startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>
                            Selesai: {endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Winners Preview if Settled */}
                      {t.winners && t.winners.length > 0 && (
                        <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                          <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1 mb-1">
                            <Sparkles className="w-3 h-3" /> Sang Juara 1:
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="font-display font-bold text-white flex items-center gap-1.5">
                              <span>{t.winners[0].avatar}</span>
                              <span>{t.winners[0].username}</span>
                            </span>
                            <span className="font-mono font-bold text-amber-300">
                              {t.winners[0].score.toLocaleString()} Poin
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-3 border-t border-white/10">
                      {/* View Standings Button */}
                      <button
                        onClick={() => handleOpenLeaderboard(t)}
                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 hover:text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trophy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Lihat Papan Peringkat Live</span>
                      </button>

                      {/* Registration / Play Button */}
                      {isLive && t.isRegistered ? (
                        onBackToGame && (
                          <button
                            onClick={() => {
                              sound.play('click');
                              onBackToGame();
                            }}
                            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Flame className="w-4 h-4" />
                            <span>Balapan untuk Turnamen Ini</span>
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleRegister(t)}
                          disabled={t.isRegistered || registeringId === t.id || isEnded}
                          className={`w-full py-2.5 min-h-[44px] rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            isEnded
                              ? 'bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'
                              : t.isRegistered
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                              : registeringId === t.id
                              ? 'bg-rose-500/60 text-white cursor-wait'
                              : 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/25 active:scale-98'
                          }`}
                        >
                          {isEnded
                            ? 'Turnamen Telah Berakhir'
                            : t.isRegistered
                            ? '✓ Kamu Sudah Terdaftar'
                            : registeringId === t.id
                            ? 'Mendaftarkan...'
                            : 'Daftar Turnamen'}
                        </button>
                      )}

                      {/* Calendar Sync & Share */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={getGoogleCalendarUrl(t)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold text-center border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
                          title="Tambah Jadwal ke Google Calendar"
                        >
                          <span>Google Cal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => handleShare(t)}
                          className="py-2 px-2 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Bagi Tautan Turnamen"
                        >
                          {sharedId === t.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                          <span>Bagi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
