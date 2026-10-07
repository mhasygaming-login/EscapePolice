import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, UserProfile } from '../types';
import { api, sound, socket } from '../services';
import { Trophy, Medal, Search, RefreshCw, Flame, ShieldCheck, Radio, UserPlus, Gamepad2 } from 'lucide-react';

interface LeaderboardModalProps {
  user: UserProfile | null;
  onOpenAuth?: () => void;
  onBackToGame?: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ user, onOpenAuth, onBackToGame }) => {
  const [period, setPeriod] = useState<'all' | 'daily' | 'weekly'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const isUserRegistered = user && !user.id.startsWith('guest_') && !user.id.startsWith('offline_') && !user.id.startsWith('anon');

  const fetchLeaderboard = async () => {
    setLoading(true);
    const data = await api.getLeaderboard(period, difficultyFilter, searchQuery);
    setScores(data.leaderboard || []);
    setLoading(false);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    fetchLeaderboard();

    // Pastikan koneksi WebSocket aktif untuk real-time update
    socket.connect(user?.id);

    // Dengarkan pembaruan papan peringkat secara real-time via WebSocket
    const unsubscribe = socket.on('leaderboard_update', () => {
      fetchLeaderboard();
    });

    // Sinkronisasi otomatis periodik setiap 4 detik untuk keandalan maksimal
    const syncInterval = setInterval(() => {
      fetchLeaderboard();
    }, 4000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(syncInterval);
    };
  }, [period, difficultyFilter, user?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeaderboard();
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-3 sm:px-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-display font-black text-white tracking-wider flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Papan Peringkat Resmi</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-Time Live
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Hanya menampilkan pemain terdaftar yang sudah bermain. Tercantum nama dan skor terakhir dari balapan masing-masing pemain dengan pembaruan instan (Real-Time).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-center flex-wrap">
          {onBackToGame && (
            <button
              type="button"
              onClick={() => {
                sound.play('click');
                onBackToGame();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-display font-black uppercase tracking-wider shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer transition-transform whitespace-nowrap"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Main Balapan (Solo)</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.play('click');
              fetchLeaderboard();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Guest warning banner if player is not registered */}
      {!isUserRegistered && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-xs">
              <strong className="text-white block sm:inline">Anda belum terdaftar.</strong> Pemain yang belum mendaftar tidak akan dicantumkan di papan peringkat. Daftarkan nama Anda agar skor tercatat di sini!
            </div>
          </div>
          {onOpenAuth && (
            <button
              onClick={() => {
                sound.play('click');
                onOpenAuth();
              }}
              className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-display font-black uppercase tracking-wider shadow-md shadow-amber-400/20 transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Daftar / Masuk Sekarang
            </button>
          )}
        </div>
      )}

      {/* Filters Bar: Professional Responsive Auto-Layout */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0b0c19] border border-white/10 p-3 rounded-2xl">
        {/* Filter Groups with auto-wrap */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Period Selector */}
          <div className="inline-flex bg-black/60 p-1 rounded-xl border border-white/10 shrink-0">
            {[
              { id: 'all', label: 'Semua Waktu' },
              { id: 'weekly', label: 'Minggu Ini' },
              { id: 'daily', label: 'Hari Ini' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => {
                  sound.play('click');
                  setPeriod(p.id as any);
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  period === p.id
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Difficulty Filter */}
          <div className="inline-flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0 overflow-x-auto max-w-full">
            {['ALL', 'MAXXX', 'HARD', 'NORMAL', 'EASY'].map(d => (
              <button
                key={d}
                onClick={() => {
                  sound.play('click');
                  setDifficultyFilter(d);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-display uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  difficultyFilter === d
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Search Field */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari pembalap..."
            className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </form>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#0b0c19] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-[10px] uppercase font-bold tracking-widest text-gray-400 border-b border-white/10">
                <th className="py-3 px-4 text-center w-14">Rank</th>
                <th className="py-3 px-4">Pembalap</th>
                <th className="py-3 px-4 text-right">Skor Terakhir</th>
                <th className="py-2.5 px-3 text-right w-24 text-[9.5px]">Jarak (m)</th>
                <th className="py-3 px-4 text-right">Combo</th>
                <th className="py-3 px-4 text-center">Tingkat</th>
                <th className="py-3 px-4 text-right">Waktu Main</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-medium">
              {scores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Tidak ada data skor untuk filter saat ini.
                  </td>
                </tr>
              ) : (
                scores.map((entry, idx) => {
                  const rank = idx + 1;
                  const isMe = user && entry.userId === user.id;

                  return (
                    <tr
                      key={entry.id || idx}
                      className={`hover:bg-white/5 transition-colors ${
                        isMe ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : ''
                      }`}
                    >
                      {/* Rank Number / Badge */}
                      <td className="py-3 px-4 text-center font-display font-extrabold">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-black shadow-lg shadow-amber-400/40 text-xs">
                            🥇
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-black shadow-lg text-xs">
                            🥈
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white shadow-lg text-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="text-gray-400">#{rank}</span>
                        )}
                      </td>

                      {/* Driver Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-base border"
                            style={{
                              borderColor: entry.carColor || '#00f0ff',
                              backgroundColor: `${entry.carColor || '#00f0ff'}20`,
                            }}
                          >
                            {entry.avatar || '🏎️'}
                          </div>
                          <div>
                            <div className="font-display font-bold text-white flex items-center gap-1.5">
                              {entry.username}
                              {isMe && (
                                <span className="text-[9px] px-1 bg-cyan-400 text-black font-extrabold rounded">
                                  KAMU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-semibold">{entry.title || 'RACER'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3 px-4 text-right font-display font-black text-sm text-cyan-400">
                        {entry.score.toLocaleString()}
                      </td>

                      {/* Distance */}
                      <td className="py-2.5 px-3 text-right text-gray-300 font-medium text-[11px] font-mono">
                        {entry.distance.toLocaleString()} m
                      </td>

                      {/* Combo */}
                      <td className="py-3 px-4 text-right text-amber-400 font-bold">
                        ×{entry.bestCombo}
                      </td>

                      {/* Difficulty Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-display font-bold uppercase ${
                            entry.difficulty === 'MAXXX'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : entry.difficulty === 'HARD'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          }`}
                        >
                          {entry.difficulty}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-right text-[10px] text-gray-500">
                        {new Date(entry.timestamp).toLocaleDateString('id-ID', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
