import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, UserProfile } from '../types/game';
import { api } from '../services/api';
import { sound } from '../services/audio';
import { Trophy, Medal, Search, RefreshCw, Flame, ArrowUpRight } from 'lucide-react';

interface LeaderboardModalProps {
  user: UserProfile | null;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ user }) => {
  const [period, setPeriod] = useState<'all' | 'daily' | 'weekly'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const data = await api.getLeaderboard(period, difficultyFilter, searchQuery);
    setScores(data.leaderboard);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period, difficultyFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeaderboard();
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
        <h1 className="text-xl sm:text-2xl font-display font-black text-white tracking-wider flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Peringkat
        </h1>

        <button
          onClick={() => {
            sound.play('click');
            fetchLeaderboard();
          }}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          Segarkan
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0b0c19] border border-white/10 p-3 rounded-2xl">
        {/* Period Selector */}
        <div className="flex bg-black/50 p-1 rounded-xl border border-white/5">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all ${
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
        <div className="flex items-center gap-1 overflow-x-auto">
          {['ALL', 'MAXXX', 'HARD', 'NORMAL', 'EASY'].map(d => (
            <button
              key={d}
              onClick={() => {
                sound.play('click');
                setDifficultyFilter(d);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-display uppercase tracking-wider transition-all ${
                difficultyFilter === d
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari pembalap..."
            className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          />
        </form>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#0b0c19] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-[10px] uppercase font-bold tracking-widest text-gray-400 border-b border-white/10">
                <th className="py-3 px-4 text-center w-14">Rank</th>
                <th className="py-3 px-4">Pembalap</th>
                <th className="py-3 px-4 text-right">Skor Tertinggi</th>
                <th className="py-2.5 px-3 text-right w-24 text-[9.5px]">Jarak (m)</th>
                <th className="py-3 px-4 text-right">Combo</th>
                <th className="py-3 px-4 text-center">Tingkat</th>
                <th className="py-3 px-4 text-right">Waktu</th>
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
